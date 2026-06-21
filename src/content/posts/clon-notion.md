---
title: "Clon de Notion: editor de bloques con sincronización en tiempo real"
description: "Construí un editor de bloques tipo Notion con sincronización en tiempo real usando WebSockets, CRDT para resolución de conflictos, y una arquitectura de plugins extensible."
publishedAt: 2024-05-20
updatedAt: 2024-06-10
tags: ["typescript", "websockets", "crdt", "architecture", "react"]
draft: false
projectStatus: "wip"
---

## Por qué clonar Notion

Notion resuelve un problema de UX extremadamente difícil: un editor de texto que se comporta como un procesador de palabras moderno pero guarda la información como una base de datos estructurada.

Lo que parece simple desde afuera — escribir con `/` para insertar bloques — esconde un sistema de tipos, un árbol de nodos, resolución de conflictos y sincronización en tiempo real.

## Arquitectura del editor

### El modelo de bloques

Todo en Notion es un bloque. Un documento es un bloque que contiene bloques. Cada bloque tiene un tipo, propiedades y una lista de hijos:

```typescript
interface Block {
  id: string;
  type: 'paragraph' | 'heading_1' | 'heading_2' | 'code' | 'bulleted_list' | 'toggle';
  properties: Record<string, RichText[]>;
  children: string[]; // IDs de bloques hijos
  parentId: string | null;
}

interface RichText {
  text: string;
  annotations: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    color?: string;
  };
}
```

Esta representación plana (no árbol anidado) hace que las operaciones de reordenamiento y movimiento entre páginas sean O(1) en base de datos.

### CRDT para sincronización

El problema más difícil: ¿qué pasa cuando dos usuarios editan el mismo bloque al mismo tiempo?

Implementé una versión simplificada de **Logoot**, un CRDT (Conflict-free Replicated Data Type) para secuencias. Cada carácter tiene una posición única generada de forma distribuida:

```typescript
type Position = number[];

// Alice inserta 'A' en posición [1, 3]
// Bob inserta 'B' en posición [1, 5]
// El merge es determinístico: 'A' siempre va antes que 'B'
// sin importar el orden de llegada de los mensajes
```

El tradeoff: el overhead de metadata por carácter es significativo. Notion probablemente usa una estrategia diferente (Operational Transform o un CRDT más eficiente).

### Arquitectura de WebSockets

```
Cliente A ──┐
Cliente B ──┤──→ Presence Server ──→ Redis Pub/Sub ──→ Document Server
Cliente C ──┘                                               ↕
                                                        PostgreSQL
```

Separé el **Presence Server** (quién está editando qué) del **Document Server** (el estado real del documento). Esto permite escalar el presence horizontalmente sin coordinar estado de documento.

## El editor visual

El editor usa un `contenteditable` personalizado en lugar de librerías como Slate.js o ProseMirror. Tomé esta decisión para entender los problemas de bajo nivel:

- Manejo de composición de caracteres (IME para idiomas asiáticos)
- Selección de texto a través de múltiples bloques
- Undo/redo distribuido
- Drag and drop de bloques

Cada uno de estos es un mundo aparte. ProseMirror existe por buenas razones.

## Estado actual

- Editor de bloques básico funcionando (párrafos, headings, código, listas)
- Sincronización en tiempo real vía WebSockets
- CRDT implementado pero con bugs en casos edge de concurrencia alta
- Sin implementar: base de datos relacional, vistas, fórmulas

## Lo que aprendí

**No subestimes el editor de texto.** Es el componente más difícil de la UI. `contenteditable` tiene comportamiento diferente en cada navegador y OS.

**CRDT es teoría elegante con implementación complicada.** Los papers de académicos asumen condiciones que no se dan en producción: latencia variable, clientes que se desconectan a mitad de una operación, y relojes que no están sincronizados.

**El modelo de datos de Notion es brillante.** La representación plana de bloques con IDs hace que operaciones que en un árbol serían complejas sean triviales en SQL.

Continuaré documentando el progreso en futuros posts.
