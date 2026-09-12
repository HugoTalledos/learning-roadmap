---
title: "Staging + TTL: por qué el flujo de generación de creativos necesitaba un paso de aprobación"
date: 2026-07-19
project: "light-house"
category: "arquitectura"
tags: ["ddd", "python", "langgraph", "firebase", "asyncio", "diseño"]
draft: true
---

## El problema que no vi venir

El [post anterior](./image-builder-tool.md) describía un flujo donde `image_builder_tool` generaba los creativos, los componía con Pillow y los subía a Firebase directamente. Las URLs resultantes quedaban listas para Meta Ads.

Hay dos cosas que ese diseño no resuelve:

1. **Archivos huérfanos.** Si el usuario ve los tres creativos y rechaza dos, esos dos PNGs quedan en Firebase para siempre. No hay ningún mecanismo que los limpie.
2. **Bytes en el contexto del LLM.** El campo `image_bytes` (base64) llegaba serializado dentro del resultado del tool — es decir, directamente en el contexto del modelo. Eso son kilobytes de ruido que el LLM tiene que procesar en cada turno siguiente.

El rediseño resuelve ambos con un solo cambio de arquitectura: separar el flujo en dos etapas con responsabilidades distintas.

## La solución: staging + TTL + promote

El nuevo flujo tiene tres piezas:

```
image_builder_tool
  genera → compone → sube a staging/ (con TTL) → devuelve staging URLs (sin bytes)
                             │
               [ usuario revisa en el frontend ]
                             │  aprueba un subconjunto
promote_creatives_tool
  promueve staging/ → creatives/ → devuelve URLs permanentes
                             │
        los drafts en staging/ expiran solos por la regla de lifecycle
```

`image_builder_tool` ya no sube a la ubicación final. Sube a un prefijo `staging/` que tiene una regla de lifecycle que borra objetos con más de un día de antigüedad. Eso convierte el problema de los archivos huérfanos en el estado por defecto: si el usuario no aprueba, el archivo desaparece solo.

La regla se configura a nivel de bucket, fuera del código de la app:

```bash
gcloud storage buckets update gs://$FIREBASE_STORAGE_BUCKET \
  --lifecycle-file=lifecycle.json
```

```json
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": { "age": 1, "matchesPrefix": ["staging/"] }
    }
  ]
}
```

`creatives/` no tiene regla de borrado. Lo que el usuario aprueba es permanente.

## Nuevos modelos: `DraftCreative` reemplaza a `ComposedCreative`

El cambio más visible en el dominio es que `ComposedCreative` desaparece y aparece `DraftCreative`:

```python
class DraftCreative(BaseModel):
    variant_index: int
    staging_path: str   # e.g. "staging/{project_id}/{filename}"
    staging_url: str    # URL pública para preview en el frontend
    headline: str
    cta_text: str
    prompt_used: str
    provider: str
    # Sin image_bytes — los bytes se descartan después del upload
```

`staging_path` es lo que el LLM pasa a `promote_creatives_tool` cuando el usuario aprueba. `staging_url` es lo que el frontend usa para mostrar la previsualización. Nunca hay bytes en el resultado del tool.

El aggregate root cambia en consecuencia:

```python
class ImageBuildResult(BaseModel):
    brief: ImageBrief
    drafts: list[DraftCreative]  # era "creatives: list[ComposedCreative]"
    status: Literal["success", "partial", "failed"]
    errors: list[str]
```

## El puerto de storage se abre en dos operaciones

El diseño anterior tenía un solo método en `ImageStoragePort`:

```python
class ImageStoragePort(ABC):
    async def upload(self, image_bytes: bytes, filename: str, project_id: str) -> str: ...
```

El nuevo tiene dos:

```python
class ImageStoragePort(ABC):
    async def upload_draft(
        self, image_bytes: bytes, filename: str, project_id: str
    ) -> DraftUpload: ...

    async def promote(self, staging_path: str, project_id: str) -> str: ...
```

`upload_draft` devuelve un value object `DraftUpload` con el path de staging y la URL pública. `promote` recibe ese path, copia el blob a `creatives/`, borra el original en staging y devuelve la URL permanente.

Si el objeto en staging ya fue reapado por el TTL antes de que el usuario apruebe, `promote` lanza una excepción. `CreativePromotionService` la captura y la registra en `PromoteResult.errors` — el resto de los paths aprobados sigue adelante.

## Una nueva tool: `promote_creatives_tool`

El flujo de aprobación necesita su propio tool:

```python
@tool
async def promote_creatives_tool(project_id: str, staging_paths: list[str]) -> dict:
    """
    Promotes user-approved draft creatives from staging to permanent storage.
    Input: project_id and the staging_paths the user approved.
    Output: serialized PromoteResult dict (permanent URLs).
    """
    result = await _build_promotion_service().promote(project_id, staging_paths)
    return result.model_dump(mode="json")
```

El servicio detrás (`CreativePromotionService`) tiene la misma mecánica de tolerancia a fallos parciales que `ImageBuilderService`: usa `return_exceptions=True` implícitamente a través de try/except por path y devuelve un `PromoteResult` con `status: "success" | "partial" | "failed"`.

## Regenerar una sola variante sin tirar las demás

Otro problema del diseño anterior: si al usuario no le gusta el creativo 2, la única opción era regenerar los tres. Eso desperdicia llamadas a DALL-E y tiempo.

La solución pasa por cambiar dos cosas en cascada.

Primero, `PromptBuilder` pasa de generar todos los prompts en batch a generar uno por índice:

```python
# antes
def build_prompts(self, brief: ImageBrief) -> list[str]: ...

# ahora
def build_prompt(self, brief: ImageBrief, variant_index: int) -> str: ...
```

El mood por variante (warm morning light, cool evening tones, neutral studio light) se codifica con `variant_index % len(moods)`, así cada índice produce siempre el mismo mood independientemente del tamaño del batch.

Segundo, `ImageBuilderService.build` acepta un parámetro `variants`:

```python
async def build(
    self,
    brief: ImageBrief,
    variants: list[int] | None = None,
) -> ImageBuildResult: ...
```

Cuando `variants` es `None`, genera todos los índices `range(brief.n_images)`. Cuando el agente quiere regenerar solo el índice 2, llama `build(brief, variants=[2])`. La variante nueva sube como un objeto fresco en staging; la descartada expira sola.

El tool expone esto directamente:

```python
@tool
async def image_builder_tool(brief_dict: dict, variants: list[int] | None = None) -> dict:
    brief = ImageBrief.model_validate(brief_dict)
    result = await _build_service().build(brief, variants)
    return result.model_dump(mode="json")
```

## Qué cambió en resumen

| Antes | Ahora |
|---|---|
| Upload directo a `creatives/` | Upload a `staging/` + promote explícito |
| `ComposedCreative` con `image_bytes` | `DraftCreative` sin bytes, con `staging_path` |
| `ImageBuildResult.creatives` | `ImageBuildResult.drafts` |
| `ImageStoragePort.upload(...)` | `upload_draft(...)` + `promote(...)` |
| `build_prompts(brief)` batch | `build_prompt(brief, variant_index)` por variante |
| `build(brief)` siempre los `n` | `build(brief, variants=[i])` selectivo |
| Un solo tool | Dos tools: `image_builder_tool` + `promote_creatives_tool` |

## Lo que aprendí con el rediseño

La corrección más importante no fue técnica sino conceptual: confundí "subir una imagen" con "persistir un creativo". Son dos cosas distintas. Subir es una operación de transporte; persistir es una decisión de negocio que depende de la aprobación del usuario.

Una vez que separé esas dos responsabilidades, el resto cayó en cascada: el staging con TTL resuelve los huérfanos, el promote resuelve la aprobación, y el puerto con dos métodos refleja exactamente esa distinción en el contrato del dominio.

El diseño de antes no estaba mal técnicamente. Estaba mal porque no modelaba el flujo real del usuario.
