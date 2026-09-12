---
title: "project_id no es thread_id: diseñando la persistencia de proyectos sin acoplar conceptos que van a divergir"
date: 2026-08-03
project: "light-house"
category: "diseño"
tags: ["ddd", "python", "langgraph", "firestore", "diseño", "arquitectura"]
draft: true
---

## El problema: el agente genera cosas, pero no recuerda proyectos

El chatbot de light-house ya podía generar una landing, una campaña de Facebook Ads y creativos de imagen a partir de una idea de negocio. Lo que no podía hacer era decirte, una semana después, "estas son las ideas que validaste".

Mirando el código encontré tres huecos concretos:

1. `MemorySaver`, el checkpointer de LangGraph, guarda la conversación en memoria — se pierde todo al reiniciar el proceso.
2. `thread_id` estaba hardcodeado a `"1"` en la config (esto era intencional, ya que cuando lo hice solo estaba probando).
3. Los tres modelos de dominio (`LandingBrief`, `CampaignBrief`, `ImageBrief`) ya tenían un campo `project_id`... pero era el LLM quien lo inventaba en cada llamada a tool. Nada garantizaba que fuera el mismo string entre `landing_builder_tool` y `campaign_builder_tool` en la misma conversación.

Ese tercer punto es el que más me interesó, porque es un bug silencioso: si el LLM le pone `"acme-landing-page"` a un tool y `"proyecto-acme"` a otro, nunca vas a poder correlacionar sus outputs como parte de la misma idea de negocio.

## La primera decisión (mala) y por qué la descarté

Mi primer instinto fue simplificar: `project_id = thread_id`. Un proyecto se crea al primer mensaje de un thread nuevo, y ya — no hay que generar ni mapear nada.

Era el camino fácil, pero si quiero seguir aprendiendo, un posible siguiente paso sea que cada proyecto tenga diferentes chats asociados y este camino me "limitaria" (aunque seguro hay forma de resolver).

Es un caso claro de acoplar dos conceptos porque hoy son 1:1, cuando en realidad son cosas distintas que *van a divergir*. `thread_id` es una conversación. `project_id` es una idea de negocio. Hoy una idea de negocio vive en una sola conversación — pero nada impide que mañana el usuario retome un proyecto viejo en un chat nuevo.

## La decisión clave: project_id como entidad propia, resuelta — no inventada

`project_id` pasa a ser un UUID que genera nuestro código, nunca el LLM. La relación con `thread_id` vive en el propio documento del proyecto:

```python
class Project(BaseModel):
    project_id: str
    thread_ids: list[str]   # hoy: uno solo. Mañana: varios.
    business_name: str | None = None
    value_proposition: str | None = None
    created_at: datetime
    updated_at: datetime
    resources: dict[ResourceKind, ResourceState]
```

El mecanismo de resolución vive en el nodo `chatbot` del grafo: al entrar, si el `state` todavía no tiene `project_id`, se busca (o se crea) un proyecto a partir del `thread_id` actual, usando una transacción de Firestore para evitar crear dos proyectos si llegan dos mensajes casi simultáneos en un thread nuevo.

```python
def chatbot(state: State):
    project_id = state.get("project_id")
    if not project_id:
        project_id = _project_repo.get_or_create_by_thread(state["thread_id"]).project_id

    message = model.invoke([...])
    return { "messages": [message], "project_id": project_id }
```

Una vez resuelto, `project_id` se guarda en el `State` del grafo y se propaga solo — el LLM ya no lo ve ni lo puede inventar.

## Sacarle el project_id de las manos al LLM

Para que ningún tool dependa de que el LLM escriba un `project_id` correcto, uso `InjectedState` de LangGraph: un tipo de parámetro que LangGraph completa automáticamente desde el estado del grafo, y que **no aparece en el schema que ve el LLM**. Es como un enchufe que el runtime llena por vos — el LLM ni sabe que existe.

```python
@tool
async def landing_builder_tool(
    brief_dict: dict,
    state: Annotated[dict, InjectedState],
) -> dict:
    brief = LandingBrief.model_validate({**brief_dict, "project_id": state["project_id"]})
    result = await _build_service().build(brief)
    ...
```

El LLM le manda a `landing_builder_tool` un brief *sin* `project_id`. El grafo inyecta el valor correcto antes de que el tool valide el modelo. Es la misma clase de solución que un `port` en DDD: la parte de afuera (el LLM) no necesita — ni puede — saber cómo se resuelve esa dependencia.

## Aprobación independiente por recurso, no por proyecto

Landing, campaña e imágenes se aprueban por separado. Un proyecto puede tener la landing aprobada y la campaña todavía en borrador. No guardo un flag global de "proyecto aprobado" — se calcula leyendo los tres `resources.*.status` si hace falta, pero nunca se persiste como verdad separada que se pueda desincronizar.

```
resources:
  landing:  { status: "approved", payload: {storage_path, version} }
  campaign: { status: "pending",  payload: {} }
  images:   { status: "pending",  payload: {} }
```

Esto llevó a agregar dos tools nuevos, `approve_campaign_tool` y `approve_images_tool`, calcados del `promote_landing_tool` que ya existía — mismo patrón, misma forma de invocarse solo después de que el usuario aprueba explícitamente.

## Firestore se puede caer, la conversación no

La escritura a Firestore nunca debería tumbar el turno de chat en curso. Si falla, la escritura cae a un outbox local en disco:

```python
def update_resource(self, project_id, resource, payload, status="approved"):
    self._flush_outbox(project_id)
    try:
        self._write_resource(project_id, {...})
    except Exception:
        self._outbox.enqueue(project_id, "update_resource", {...})
```

No hay worker en background reintentando — es reintento perezoso: antes de la próxima escritura para ese mismo proyecto, el repositorio intenta vaciar primero lo que quedó pendiente. Si el proyecto no vuelve a tener actividad, el outbox se queda ahí. Fue una decisión consciente de no meter infraestructura de scheduler que el proyecto no necesita.

## Qué queda funcionando

Con este diseño: un proyecto se crea solo al primer mensaje de un thread nuevo, cada recurso se aprueba de forma independiente, y hay un API mínima de solo lectura (`GET /projects`, `GET /projects/{id}`) para listar ideas pasadas y ver sus recursos aprobados sin tocar HTML crudo.

Lo que más me llevo de esta sesión no es el modelo de datos — es la corrección sobre `project_id == thread_id`. Simplificar de más también es una forma de acoplar cosas que no deberían estarlo, y a veces el costo de esa simplificación no se ve hasta que el "siguiente paso pedagógico" ya está bloqueado por una decisión de hoy.
