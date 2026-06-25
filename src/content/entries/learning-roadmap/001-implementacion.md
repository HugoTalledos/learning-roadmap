---
title: ADR Selección de plataforma
date: 2026-06-25
project: "learning-roadmap"
category: "Diseño"
tags: ["design", "plannig"]
draft: false
---

## Contexto

El objetivo principal del proyecto es disponer de un espacio donde documentar aprendizajes, decisiones de ingeniería y experiencias obtenidas durante el desarrollo de proyectos personales. La prioridad no es construir una plataforma de contenido masiva, sino minimizar la fricción asociada al proceso de escritura y publicación.

Durante la fase inicial se identificó la necesidad de decidir entre utilizar una solución existente especializada en la creación de blogs o desarrollar una implementación propia adaptada a las necesidades del proyecto.

La decisión debe considerar aspectos como costo operativo, facilidad de mantenimiento, capacidad de personalización y alineación con los objetivos de aprendizaje que motivan la creación del proyecto.

## Alternativas evaluadas
### Alternativa 1: Utilizar Wordpress

WordPress es una de las plataformas de gestión de contenido más utilizadas en el mercado y ofrece un ecosistema maduro para la creación y administración de blogs.

Su principal ventaja es que gran parte de las funcionalidades necesarias ya existen y han sido probadas ampliamente. La creación de contenido, la gestión de publicaciones, el SEO, la administración de usuarios y otros aspectos comunes de un blog pueden resolverse utilizando capacidades nativas o complementos existentes.

Adicionalmente, dependiendo del proveedor elegido, una parte importante de las responsabilidades operativas puede delegarse a la plataforma. Actividades como actualizaciones de software, mantenimiento de infraestructura, administración de bases de datos y monitoreo suelen estar parcialmente resueltas por el servicio contratado.

Sin embargo, esta alternativa presenta algunas limitaciones para el contexto específico del proyecto. Aunque los costos asociados a WordPress pueden ser razonables para productos con múltiples usuarios o fines comerciales, representan una inversión relativamente alta para una iniciativa personal cuyo objetivo principal es documentar aprendizajes.

También existe un costo asociado a la personalización. WordPress ofrece una enorme cantidad de funcionalidades y mecanismos de extensión, pero alcanzar comportamientos específicos puede requerir comprender su ecosistema, temas, plugins y convenciones de desarrollo. Esto introduce una complejidad adicional que no necesariamente aporta valor directo a los objetivos iniciales.

Finalmente, gran parte de las capacidades avanzadas de WordPress quedarían subutilizadas. El alcance inicial del proyecto es reducido y se centra principalmente en la publicación de contenido estructurado, por lo que la adopción de una plataforma diseñada para resolver problemas significativamente más complejos podría resultar desproporcionada.

### Alternativa 2: Construir una solución propia

Desarrollar una implementación propia permite definir exactamente las funcionalidades necesarias para la primera versión del producto, evitando dependencias de características que no aportan valor inmediato.

Esta alternativa ofrece control total sobre la experiencia de escritura, la estructura de los contenidos y la evolución futura de la plataforma. Asimismo, permite que el propio desarrollo del blog se convierta en una oportunidad de aprendizaje y documentación, alineándose con la motivación principal del proyecto.

Como contrapartida, esta decisión implica asumir responsabilidades relacionadas con el desarrollo, mantenimiento y evolución del sistema. Funcionalidades que en plataformas maduras ya existen deberán implementarse manualmente en caso de ser necesarias.

No obstante, dado el alcance limitado de la primera versión, la complejidad inicial esperada es baja y puede mantenerse bajo control mediante una estrategia de desarrollo incremental.

## Decisión
Se decide construir la primera versión del blog desde cero utilizando Astro como framework principal y delegar su implementación a un agente de inteligencia artificial, específicamente Claude Code.

La elección de Astro responde directamente a uno de los objetivos más importantes del proyecto: reducir al máximo la fricción asociada a la creación de contenido. Astro permite generar páginas a partir de formatos simples como Markdown y estructuras de datos JSON, facilitando que la publicación de nuevos artículos se limite principalmente a escribir contenido en lugar de interactuar con interfaces administrativas complejas o flujos de publicación elaborados.

Adicionalmente, Astro genera sitios estáticos por defecto, lo que simplifica significativamente el despliegue y la operación de la plataforma. Esta característica permite alojar el proyecto en servicios que ofrecen planes gratuitos generosos, como Firebase Hosting, eliminando la necesidad de administrar servidores, bases de datos o infraestructura adicional durante las primeras etapas del proyecto.

Aunque el problema de construir un blog es uno que ya ha sido resuelto por numerosas herramientas del mercado, el objetivo de esta decisión no es reinventar la solución sino crear una implementación mínima adaptada a las necesidades específicas del proyecto. Para evitar invertir tiempo excesivo en una tarea ampliamente conocida, se decide delegar la construcción de la primera versión a un agente de inteligencia artificial.

Claude Code será responsable de la implementación inicial de las funcionalidades, la estructura del proyecto y los componentes necesarios para disponer de una primera versión funcional. De esta manera, el esfuerzo humano puede enfocarse en definir requisitos, validar decisiones y generar contenido, en lugar de dedicar tiempo a tareas de implementación repetitivas o de bajo valor estratégico.

## Consecuencias

### Positivas

* La creación de contenido se simplifica al utilizar formatos ampliamente conocidos como Markdown y JSON.
* El proyecto mantiene una barrera de entrada baja para futuras publicaciones, alineándose con el objetivo principal de documentar aprendizajes de manera frecuente.
* La generación de sitios estáticos reduce significativamente la complejidad operativa de la solución.
* El despliegue puede realizarse utilizando servicios con capas gratuitas generosas, minimizando los costos iniciales del proyecto.
* Se obtiene control total sobre la estructura del contenido y la evolución futura de la plataforma.
* La utilización de un agente de IA acelera la construcción de la primera versión y reduce el tiempo invertido en tareas de implementación ya conocidas.
* El esfuerzo puede concentrarse en la definición del producto y la generación de contenido, en lugar de la construcción manual de la infraestructura del blog.

### Negativas 

* La solución dependerá del conocimiento y calidad de las decisiones generadas por el agente de IA durante la implementación inicial.
* Será necesario revisar y validar el código generado para asegurar que cumple los requisitos definidos y mantiene un nivel adecuado de calidad.
* Algunas decisiones técnicas tomadas por el agente podrían requerir refactorizaciones posteriores a medida que evolucionen los requerimientos del proyecto.
* Al tratarse de una solución propia, la responsabilidad del mantenimiento continúa recayendo sobre el proyecto.

### Riesgos

* El código generado por la IA puede introducir complejidad innecesaria o patrones que no se ajusten completamente a los objetivos del proyecto.
* Existe el riesgo de aceptar decisiones de implementación sin comprender completamente sus implicaciones técnicas, generando deuda técnica futura.
* La facilidad para generar nuevas funcionalidades mediante IA podría incentivar el crecimiento prematuro del alcance del proyecto, desviando el foco principal de la documentación y el aprendizaje.
* Si la estructura inicial no se diseña adecuadamente, futuras necesidades de organización del contenido podrían requerir cambios significativos en el modelo de datos o la navegación del sitio.

## Preguntas abiertas

Las siguientes decisiones fueron identificadas durante el análisis de la solución, pero no son necesarias para la implementación de la primera versión del proyecto. Se registran para ser evaluadas en futuras iteraciones una vez exista experiencia real utilizando la plataforma.

### ¿Debe Git convertirse en el CMS del proyecto?

Actualmente el contenido se almacena como archivos Markdown consumidos por Astro durante el proceso de generación del sitio. Esto plantea una pregunta natural: ¿debería el repositorio Git convertirse en la fuente de verdad del contenido?

Adoptar Git como CMS ofrece varias ventajas. Cada publicación pasaría a formar parte del historial del proyecto, permitiendo rastrear cambios, recuperar versiones anteriores, revisar modificaciones mediante Pull Requests y mantener el contenido versionado junto con el código que lo renderiza.

Este enfoque también encaja naturalmente con el ecosistema de desarrollo ya utilizado para el proyecto, eliminando la necesidad de introducir herramientas adicionales para la gestión de contenido.

Sin embargo, esta decisión también implica que la creación y edición de publicaciones quede ligada al flujo de trabajo de Git. A medida que el volumen de contenido aumente, podría ser conveniente evaluar alternativas que desacoplen el contenido de la aplicación o que proporcionen una experiencia de edición más amigable.

Por el momento, no existe suficiente información para determinar si Git debe considerarse únicamente un mecanismo de almacenamiento o si debe asumir formalmente el rol de CMS del proyecto.

### ¿Cómo debe automatizarse el proceso de publicación?

La arquitectura actual requiere ejecutar un proceso de construcción y despliegue cada vez que se agrega o modifica contenido. Aunque el flujo es simple, representa una tarea repetitiva que podría convertirse en una fuente de fricción a medida que aumente la frecuencia de publicación.

Existen al menos dos enfoques posibles para abordar este problema.

El primero consiste en implementar una pipeline tradicional de integración y despliegue continuo. Bajo este modelo, cada cambio incorporado al repositorio desencadenaría automáticamente los procesos de validación, construcción y despliegue del sitio. Esta alternativa es ampliamente conocida, madura y fácil de mantener.

El segundo enfoque consiste en incorporar agentes de inteligencia artificial capaces de participar activamente en el flujo de publicación. Estos agentes podrían validar contenido, generar metadatos, realizar verificaciones previas al despliegue o incluso coordinar el proceso completo de publicación.

La pregunta abierta no es únicamente cómo automatizar el despliegue, sino también si el problema justifica una solución basada en agentes o si una pipeline tradicional proporciona suficiente valor con menor complejidad operativa.

La decisión se pospone hasta contar con mayor experiencia utilizando la plataforma y comprender mejor cuáles son los verdaderos puntos de fricción del proceso de publicación.