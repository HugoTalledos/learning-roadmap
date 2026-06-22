---
title: Por qué crear este blog?"
date: 2026-06-20
project: "learning-roadmap"
category: "Planeación"
tags: ["planning", "architecture", "astro"]
draft: false
---

## Motivación

Construir un CMS es un reto interesante. Involucra aspectos como SEO, modelado de datos, seguridad, rendimiento y experiencia de usuario. Precisamente por esa complejidad, ya existen herramientas maduras, ampliamente probadas y adoptadas por el mercado, como WordPress, Wix, Drupal o Joomla.

Sin embargo, mi objetivo no es competir con estas plataformas. Lo que busco es documentar los proyectos que realizo y crear una especie de diario de ingeniería donde pueda registrar decisiones técnicas, dificultades encontradas y las soluciones implementadas.

Esto me llevó a la primera pregunta importante:

¿Debía utilizar una herramienta existente o construir mi propio blog desde cero?

La respuesta fue: construirlo desde cero, aunque con algunos matices.

No considero que reinventar la rueda sea la opción más eficiente, pero este proyecto representa una oportunidad perfecta para explorar un área que me interesa cada vez más: los agentes de IA.

Dado que el problema de un blog ya está resuelto por la industria, puedo delegar gran parte de la implementación a un agente de IA y concentrar mi tiempo en aprender nuevas tecnologías, experimentar con arquitecturas diferentes y enfrentar desafíos más interesantes.

## Alcance del proyecto

El objetivo no es replicar toda la funcionalidad de WordPress. Hacerlo tomaría años y desviaría completamente el propósito original del proyecto.

Por eso, el alcance inicial queda limitado a:

1. **Publicación de contenido en Markdown**. Quiero que escribir nuevos artículos sea un proceso rápido y sencillo. Además, dedicar tiempo a desarrollar un CMS completo con ayuda de IA tendría un costo innecesario para las necesidades actuales del proyecto.

De manera explícita, quedan fuera del alcance:

* Base de datos.
* Sistema de comentarios para usuarios externos.
* Panel de administración.
* Gestión avanzada de contenido.

La prioridad es mantener el proyecto *simple y funcional*.

## Stack tecnológico elegido

Después de investigar cómo probablemente está construido Notion —basándome en análisis e ingeniería inversa realizados por la comunidad sobre su aplicación web— decidí utilizar el siguiente stack:

- **TypeScript** para mantener tipado estático en todo el proyecto.
- **Astro** para generar páginas estáticas y aprovechar su excelente integración con contenido escrito en Markdown.
- **Tailwind CSS** para generar únicamente los estilos necesarios y mantener un CSS ligero.
- **Firebase Hosting** para desplegar contenido estático de forma sencilla.
- **Claude Code** como agente principal para acelerar la generación de código.

La decisión más importante fue encontrar el equilibrio adecuado entre construir y aprender.

WordPress es una solución extremadamente robusta para el problema que intento resolver, pero construir absolutamente todo desde cero también habría retrasado el verdadero objetivo del proyecto: aprender cosas nuevas.

Por eso decidí apoyarme en Claude Code. Delegar parte de la implementación me permite avanzar más rápido, experimentar con nuevas ideas y enfocar mi energía en los aspectos que realmente aportan valor al aprendizaje.