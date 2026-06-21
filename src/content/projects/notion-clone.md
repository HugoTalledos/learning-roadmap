---
title: "Clon de Notion"
description: "Editor de bloques con sincronización en tiempo real usando WebSockets y CRDT. Un estudio profundo de cómo funciona Notion por dentro."
status: "wip"
repository: "https://github.com/hugotalledos/notion-clone"
startedAt: 2024-04-01
updatedAt: 2024-06-10
technologies: ["TypeScript", "React", "WebSockets", "CRDT", "PostgreSQL", "Redis"]
featured: true
difficulty: "expert"
---

Notion resuelve un problema de UX extremadamente difícil: un editor de texto que se comporta como un procesador de palabras moderno pero guarda la información como una base de datos estructurada.

Lo que parece simple desde afuera — escribir con `/` para insertar bloques — esconde un sistema de tipos, un árbol de nodos, resolución de conflictos y sincronización en tiempo real. Este proyecto existe para entender cada una de esas capas desde adentro.
