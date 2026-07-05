---
title: Un agente para validar las ideas de negocio que se me ocurren
date: 2026-07-05
project: "light-house"
category: "Diseño"
tags: ["agentes-ia","arquitectura","langgraph","side-project"]
draft: false
---

## Se me ocurren demasiadas ideas
 
Tengo una debilidad: se me ocurren negocios todo el tiempo. Me gusta pensar en experiencias, en lugares, en cosas para la gente. Voy caminando por una colonia y ya estoy imaginando el café que debería existir en esa esquina, o el servicio que le facilitaría la vida a quien pasa por ahí. Mi cabeza produce ideas más rápido de lo que yo podría ejecutarlas.
 
Y ahí está el problema: casi todas se quedan en eso, en ideas.
 
La razón no es que me falte convicción. Es que emprender cuesta. Cuesta dinero, cuesta tiempo, y sobre todo cuesta enfrentar la posibilidad de perder. Ese miedo a perder —a poner esfuerzo y plata en algo que a nadie le importaba— es exactamente lo que me frena antes de intentar. Prefiero no arriesgar a arriesgar y equivocarme. Y así, idea tras idea se va apagando sola.
 
El detalle es que soy desarrollador. Y como buen desarrollador, cuando algo me molesta lo suficiente, mi reacción no es aguantarme: es programar una solución.
 
## La vez que lo hice a mano
 
En este momento, por fin decidí, validar una de esas ideas en serio. No construirla entera —eso es justo lo que quería evitar—, sino *probar* si a alguien le interesaba antes de comprometerme.
 
Así que me puse a ello a la vieja usanza:

- Cree un formulario de Google para aclarar ideas.
- Diseñé y armé una **landing page** para capturar interés.
- Generé las **imágenes** y los creativos.
- Configuré una **campaña en Facebook Ads** para llevar gente a la landing.
- Monté la **infraestructura en AWS** para recibir los leads, con todo lo que eso implica.
Y ¿saben qué? Me divertí. Me gusta ese tipo de trabajo, ver cómo las piezas encajan. Pero cuando terminé me di cuenta de dos cosas incómodas: primero, que había invertido un montón de horas en montar el andamiaje, no en la idea en sí. Y segundo, que si quería probar la *siguiente* idea, me tocaba repetir todo desde cero.
 
No tengo tanto tiempo. Y validar una idea a mano no escala de la mejor idea.
 
## Por qué un agente
 
Ahí fue cuando se conectaron los cables. El cuello de botella no era la falta de ideas ni la falta de ganas de intentar. Era el **costo de intentar**: cada validación me pedía diseño, desarrollo web, configuración de infra, Facebook Ads y analítica. Horas y horas por cada corazonada.
 
¿Y si bajara ese costo tanto que el miedo a perder dejara de tener sentido?
 
Si validar una idea me costara una tarde de conversación en vez de una semana de trabajo, podría probar diez, veinte, cincuenta "pendejadas" de las que se me ocurren, y quedarme solo con la que de verdad muestre señales de vida. El miedo a perder pierde su fuerza cuando lo que arriesgas es tan poco.
 
Así que decidí construir para mí una herramienta que hiciera todo ese trabajo de andamiaje: **un agente que valide ideas de negocio de punta a punta, desde una conversación.** No un producto para vender. Una herramienta para mis propias ideas. Le puse de nombre en clave *Lighthouse*.
 
## Qué hace el agente
 
La idea es que el agente me lleve por cinco fases sin que yo tenga que tocar una sola herramienta técnica:
 
1. **Clarificación.** Le describo la idea por chat y me hace preguntas hasta armar un *brief* estructurado: problema, cliente, propuesta de valor, criterio de éxito. La fase no termina por número de mensajes, sino cuando el brief está completo. En el fondo, es él obligándome a pensar la idea en serio.
2. **Generación.** Produce en paralelo la landing, un puñado de imágenes para los creativos y un borrador de campaña (público, presupuesto, copy).
3. **Revisión.** Aquí veo *todo* antes de que se ejecute nada: la landing renderizada, la galería de creativos, los parámetros de campaña en un formulario que puedo editar. Pido ajustes en un loop hasta que me convenza.
4. **Ejecución.** Solo cuando yo apruebo: crea el subdominio, despliega la landing con SSL y arma la campaña en Meta **en pausa**.
5. **Optimización.** Un proceso periódico revisa las métricas, pausa lo que rinde mal, reasigna presupuesto y al final me da un veredicto: la idea vale la pena, no vale la pena, o no quedó claro.
La regla de oro que le puse desde el diseño: **nada que cueste dinero real se ejecuta sin que yo lo apruebe explícitamente.** Ni el dominio, ni el deploy, ni un solo peso de gasto publicitario. Es una herramienta para perder el miedo a intentar, no para gastar sin darme cuenta.
 
## Lo que a propósito NO hago
 
Como esto es una herramienta para mí y no un producto, me di el lujo de recortar sin culpa:
 
- **Solo Meta.** Nada de Google Ads, TikTok ni LinkedIn. Con una plataforma bien resuelta me alcanza para validar.
- **No es un e-commerce.** La landing captura interés y mide intención. No hay carrito ni pagos. Es una prueba de mercado, no una tienda.
- **Sin editor visual.** Ajusto la landing conversando con el agente, no arrastrando bloques. Construir un builder tipo Webflow sería otro proyecto entero, y no lo necesito.
- **Una idea a la vez.** Valido de a una. Cuando termine con una, arranco con la siguiente.
- **Subdominios, no dominios propios.** Las URLs son tipo `mi-idea.validate.app`. Verificar dominios de terceros es complejidad que no me aporta nada.

## Las decisiones que tomé para no complicarme la vida
 
Como esto lo construyo para mí, la simplicidad no es una concesión: es el objetivo. No quiero mantener una infraestructura de startup para probar mis corazonadas.
 
- **SQLite en lugar de una base de datos con servidor.** Cero operación, backup = copiar un archivo. Soy un usuario con un proyecto a la vez; no necesito más.
- **Ejecución secuencial con `async` en lugar de un motor de workflows tipo Temporal.** El flujo DNS → deploy → campaña es secuencial y se maneja con `async/await` y reintentos. Montar un cluster para esto sería ingeniería de vanidad.
- **Un cron interno** para revisar las métricas, en vez de toda una orquestación durable.
- **Firebase Hosting para las landings**: deploy atómico, CDN y SSL automático sin que yo gestione infraestructura.
- **La campaña siempre nace en PAUSA.** La veo ya configurada dentro de Meta, verifico que todo esté bien, y recién ahí doy una segunda confirmación para encenderla. Un doble seguro contra quemar mi propio dinero por un descuido.
Todo el stack lo elegí para poder olvidarme de él. Nuxt para el chat y las vistas previas, FastAPI + LangGraph para el cerebro del agente (LangGraph tiene soporte nativo para máquinas de estado y para pausar el flujo y pedir mi aprobación, que es exactamente lo que necesito), y las APIs de Namecheap, Firebase y Meta para la parte que toca el mundo real.
 
## El guiño personal
 
Este blog que estás leyendo también está hecho con **Astro** y desplegado en **Firebase**. Y *Lighthouse* usa exactamente lo mismo para generar las landings.
 
Es un patrón que ya probé en carne propia aquí y que ahora reutilizo en algo más ambicioso. Me gusta cuando lo que aprendo en un proyecto pequeño le sirve al siguiente. En cierto modo, este agente es la continuación natural de esa misma pulsión: automatizar el andamiaje para poder concentrarme en lo que de verdad me importa.
 
## Preguntas abiertas
 
- **¿Cuánta autonomía le doy en la optimización?** Hoy debería poder pausar anuncios y mover presupuesto dentro del total que aprobé. ¿Debería poder subir ese total si huele una señal fuerte? Mi instinto dice que no sin preguntarme, pero quiero verlo funcionando antes de decidir.
- **¿El veredicto debe ser blanco o negro?** "Vale la pena / no vale la pena / no quedó claro" suena limpio, pero una campaña de unos días rara vez es tan nítida. Supongo que la major opción es que el agente solo presente datos y sea yo quien de el veredicto. Pero igual, primero toca probar.