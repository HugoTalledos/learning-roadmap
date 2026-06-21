---
title: "Por qué clonar Notion"
date: 2024-04-01
project: "notion-clone"
category: "Planeación"
tags: ["planning", "architecture", "notion"]
draft: false
---

## Motivación

Notion resuelve un problema de UX extremadamente difícil: un editor de texto que se comporta como un procesador de palabras moderno pero guarda la información como una base de datos estructurada.

Lo que parece simple desde afuera — escribir con `/` para insertar bloques — esconde un sistema de tipos, un árbol de nodos, resolución de conflictos y sincronización en tiempo real.

Decidí clonarlo no para competir con Notion, sino para entender desde adentro qué hace que su arquitectura sea tan compleja. Clonar productos bien diseñados es la forma más honesta de aprender.

## Alcance del proyecto

El objetivo no es replicar toda la funcionalidad de Notion — eso tomaría años. El alcance definido para este clon:

1. **Editor de bloques** — párrafos, headings, listas, bloques de código, toggles
2. **Sincronización en tiempo real** — múltiples usuarios editando el mismo documento
3. **Resolución de conflictos** — qué pasa cuando dos usuarios editan el mismo bloque simultáneamente
4. **Presencia** — indicadores de quién está editando qué

Lo que explícitamente queda fuera: base de datos relacional, vistas (tabla, kanban, galería), fórmulas, integraciones, y la mayoría del sistema de permisos.

## Stack tecnológico elegido

Después de investigar cómo Notion probablemente está construido (basado en ingeniería inversa de su app web), decidí:

- **TypeScript** en todo — cliente y servidor
- **React** para el editor — aunque consideré Solid.js
- **contenteditable** personalizado en lugar de ProseMirror o Slate.js
- **WebSockets** para sincronización en tiempo real
- **CRDT (Logoot)** para resolución de conflictos
- **PostgreSQL** para persistencia
- **Redis** para pub/sub entre instancias del servidor

La decisión más importante: implementar el editor con `contenteditable` puro en lugar de usar una librería existente. Esto agrega complejidad, pero es la única forma de entender realmente los problemas de bajo nivel que ProseMirror ya resuelve.

## Plan de desarrollo

```
Semana 1-2: Arquitectura de datos y modelo de bloques
Semana 3-4: Editor visual básico (sin sincronización)
Semana 5-6: WebSockets y presencia
Semana 7-8: CRDT e implementación
Semana 9+:  Estabilización y casos edge
```

El plan es optimista. Siempre lo es.
