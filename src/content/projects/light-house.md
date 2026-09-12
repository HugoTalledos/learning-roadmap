---
title: "Light House"
description: "Agente de IA para realizar un estudio de mercado básico de ideas de negocio."
status: "completed"
repository: "https://github.com/HugoTalledos/lighthouse-back"
startedAt: 2026-07-05
updatedAt: 2026-09-12
technologies: ["Vue", "Python", "langgraph"]
featured: false
difficulty: "intermediate"
---

Me gusta imaginar lugares y experiencias que podría crear para las personas, pero llevar a cabo cualquier idea implica invertir dinero en algo incierto.

Validar una idea es relativamente sencillo: un formulario de Google, una landing page y una campaña publicitaria en Facebook deberían ser suficientes. Aunque es algo simple, requiere tiempo, y seguramente se puede automatizar.
Por esa razón decidí crear un agente de IA que me ayude a generar landing pages, imágenes y la configuración inicial de la campaña de Facebook; que se encargue del despliegue y me entregue un informe final, para que yo pueda descartar cada idea o actuar sobre ella.

# Finalización del proyecto

Pasó un mes desde la última actualización de este proyecto, pero estoy muy feliz de compartir que tengo un producto final (¡por fin!).
Sé que aún tiene muchos aspectos por mejorar: cosas de experiencia de usuario, memoria del agente, algunos mensajes que el back emite pero que el front decide ignorar... pero me siento muy orgulloso.
Si quieres enterarte del proceso que tuve con este proyecto, en la parte inferior podrás encontrar todos los posts relacionados; espero que mi experiencia pueda ayudarte en algo (así sea como mal ejemplo, jaja).

## Algunas cosas que debes saber
1. Para ser honesto, el front no lo construí yo: Claude fue el encargado de construir el proyecto front a partir de los contratos establecidos en el back.
2. El video en el que te muestro los resultados está editado; la ejecución de principio a fin fueron 17 minutos de espera, y casi 14 de esos 17 minutos era yo esperando a que el agente terminara de trabajar.
3. Esta no es la primera prueba punta a punta que hago. Ya había hecho bastantes pruebas que me fueron arrojando errores pequeños que no valían la pena documentar; cosas como darme cuenta a media ejecución de que faltaba alguna variable de entorno y tener que reiniciar la ejecución, o ajustar los parámetros del agente que me quedaron mal pensados en un inicio, como el máximo de tokens de respuesta o la temperatura del agente.

## Prompt de prueba
Como mencioné anteriormente, no fue la primera prueba que lancé, y para facilitar el camino, después de tantas pruebas, generé un prompt inicial para saltarme toda la etapa de preguntas del agente y que pasara directamente al uso de las tools. Si eres curioso y quieres saber cuál fue el prompt que usé, acá te lo comparto:

```
## 📋 El Prompt Ideal para Iniciar (Resumen de lo que debería haberse compartido desde el inicio):

## ✅ Información del Negocio (CONFIRMADA)

### 🏢 Nombre: **OrigenClub**
Servicio de suscripción mensual de café de origen colombiano, enviado directamente desde las fincas productoras.

### 💡 Propuesta de Valor:
Suscripción mensual que envía café de origen fresco directamente desde fincas cafeteras colombianas. El usuario elige entre 3 cafés insignia fijos y 3 cafés de temporada que se rotan mensualmente, garantizando máxima frescura (tostado/molido hace apenas unos días). A diferencia del café premium en supermercados, garantiza autenticidad de origen y calidad real sobre marcas establecidas.

**Precios:**
- Básico: 30k COP (café a domicilio)
- Intermedio: 35k COP (+ muestras de nuevos lotes)
- Avanzado: 50k COP (+ curso de barista)

### 👥 Cliente Objetivo (perfil temporal para test):
Clientes actuales de café "premium" en supermercados que están frustrados pagando más por marca que por calidad real. Buscan frescura auténtica, origen transparente y conexión directa con el productor. No definido específicamente por edad o consumo habitual ya que es un test de descubrimiento.

### ☕ Producto/Servicio:
Suscripción mensual/anual de café de origen colombiano con 3 planes escalonados. Incluye 3 cafés insignia fijos y 3 cafés rotativos mensuales según temporada, garantizando máxima frescura desde la cosecha hasta el tostado/molido.

---

## 🎨 Configuración Visual (INFERIDA/PROPUEDA)

- **Estilo visual:** Minimalista con calidez tropical
- **Paleta sugerida:** Tonos tierra, estética orgánica, tipografía limpia
- **Headline propuesto:** "Café directo de finca"
- **CTA propuesto:** "Suscríbete"

---

## 📊 Configuración de Campaign (APROBADA ✅)

**Objetivo:** Captar leads (emails para lista de espera)

**Presupuesto diario:** $3.33 USD (~15.000 COP/día)

**Targeting:**
- País: Colombia
- Edad: 18-65 años
- Género: Todo
- Intereses: Coffee Gourmet, Sustainable Living, Food & Wine

**Anuncios generados (2 variantes):**
1. "Obtén café fresco directamente de las fincas colombianas" + "Café de Origen: Suscríbete"
2. "Descubre los sabores auténticos con OrigenClub" + "Café Premium"
```

## Configuración del agente
En alguno de los posts te conté que quería hacer pruebas sin necesidad de gastar dinero; bueno, eso fue a medias. Para la mayor parte del flujo usé Ollama como backend para servir un LLM de manera local; sin embargo, decidí que quería probar la generación de imágenes con un modelo más potente, así que usé OpenRouter.
Esto permitió varias cosas, como que las imágenes generadas tuvieran una calidad excelente, pero la más importante fue la reducción de tiempo en la ejecución del agente: sin generar imágenes, el agente demoró 14 minutos, y no quiero imaginarme cuánto tiempo hubiera tomado si además hubiera tenido que generar 3 imágenes. Aunque, siendo honestos, 14 minutos no es nada comparado con los posibles dos días de trabajo que a mí me hubiera tomado hacer todo esto. Quizá el uso de IA me está haciendo impaciente.

En el repositorio puedes encontrar la configuración exacta que usé, pero aquí te comparto rápidamente los modelos usados:

| Tarea                     | Proveedor   | Modelo                                  |
|---------------------------|-------------|-----------------------------------------|
| Agente principal          | Ollama      | qwen3.5:9b-mlx                         |
| Constructor de campaña    | Ollama      | qwen3.5:9b-mlx                         |
| Constructor de landing page| Ollama      | qwen3.5:9b-mlx                         |
| Generador de imágenes     | Openrouter  | google/gemini-3.1-flash-lite-image     |

También te dejo las especificaciones de la máquina en la que ejecuté la prueba:

| Especificación   | Valor                 |
|------------------|-----------------------|
| Equipo           | MacBook Pro 14 pulgadas |
| Chip             | Apple M5              |
| Memoria          | 16 GB                 |


## Resultados
No tengo tiempos exactos de ejecución (hubiera sido buena idea medirlos) pero tengo algunas aproximaciones de los tiempos que demoro el agente en realizar las tareas y te comparto mis resultados

| Tarea | Tiempo de respuesta |
|-------|---------------------|
| Primera interacción | 1:30 min |
| Parametros para campaña | 2:30 min |
| Anuncios | 1:20 min |
| Landing page (primer intento) | 3:40 min |
| Landing page (segundo intento) | 4:40 min |

## Finalmente
Como último apartado, antes de culminar este proyecto, quiero decir que fue una experiencia muy divertida. Empezar a jugar con conceptos o formas de trabajo nuevas siempre lo es, aunque me di cuenta de que los conceptos son especialmente importantes. Saber distinguir en qué momento es necesario un proceso determinista y en qué momento es buena idea dejar que un modelo intervenga es algo nuevo que tendré que aprender a incorporar en mis futuros desarrollos.

Si quieres echar un vistazo al código que construí, te dejo por acá los links a los repositorios:

- [Frontend](https://github.com/HugoTalledos/lighthouse-front)
- [Backend](https://github.com/HugoTalledos/lighthouse_back)
- [Landing page template](https://github.com/HugoTalledos/lighthouse_landing_template)

Sin más por el momento, te dejo el resultado final:

<video controls preload="metadata" style="width: 100%; border-radius: 0.5rem;">
  <source src="/videos/light-house/light_house_demo.mp4" type="video/mp4" />
  Tu navegador no soporta la reproducción de video. Puedes <a href="/videos/light-house/light_house_demo.mp4">descargarlo aquí</a>.
</video>
