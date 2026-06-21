---
title: "CRDT y sincronización en tiempo real"
date: 2024-05-10
project: "notion-clone"
category: "Implementación"
tags: ["crdt", "websockets", "real-time", "distributed-systems"]
draft: false
---

## El problema

¿Qué pasa cuando Alice y Bob editan el mismo bloque al mismo tiempo?

Sin coordinación, el último en guardar gana. El texto del otro desaparece. Esto es inaceptable para un editor colaborativo.

Las dos soluciones principales son **Operational Transform (OT)** y **CRDT (Conflict-free Replicated Data Types)**. Notion originalmente usó OT (como Google Docs), pero la tendencia moderna es hacia CRDT.

Yo implementé una versión simplificada de **Logoot**, un CRDT para secuencias de texto.

## CRDT: el concepto

La idea central: cada carácter tiene una **posición única y estable** generada de forma distribuida. Las posiciones pueden compararse entre sí para determinar el orden, sin coordinación con el servidor.

```typescript
type Position = number[];

// Alice inserta 'A' en posición [1, 3]
// Bob inserta 'B' en posición [1, 5]
// Merge determinístico: [1, 3] < [1, 5], entonces 'A' siempre va antes que 'B'
// sin importar el orden de llegada de los mensajes

interface Atom {
  char: string;
  position: Position;
  siteId: string; // para desempatar posiciones iguales
  clock: number;
}
```

El merge es siempre el mismo resultado sin importar el orden de operaciones. Esto es la propiedad fundamental: commutativity + idempotency.

## Generación de posiciones

El algoritmo para insertar entre dos posiciones `left` y `right`:

```typescript
function generatePosition(left: Position, right: Position, siteId: string): Position {
  const depth = Math.max(left.length, right.length);
  
  for (let i = 0; i <= depth; i++) {
    const l = left[i] ?? 0;
    const r = right[i] ?? Number.MAX_SAFE_INTEGER;
    
    if (r - l > 1) {
      // Hay espacio: insertar entre l y r
      const mid = Math.floor((l + r) / 2);
      return [...left.slice(0, i), mid];
    }
  }
  
  // Sin espacio a este nivel: bajar un nivel
  return [...left, Math.floor(Number.MAX_SAFE_INTEGER / 2)];
}
```

El problema del "interleaving" de Logoot (cuando múltiples inserciones concurrentes producen texto mezclado) es real. Hay CRDTs más modernos como **RGA** o **YATA** (que usa Yjs) que lo resuelven mejor.

## Arquitectura de WebSockets

Separé los concerns en dos servidores:

```
Cliente A ──┐
Cliente B ──┤──→ Presence Server ──→ Redis Pub/Sub ──→ Document Server
Cliente C ──┘                                               ↕
                                                        PostgreSQL
```

**Presence Server**: maneja quién está conectado y qué bloque está editando cada quien. Estado efímero — vive en memoria, replicado vía Redis. Si se cae un servidor, los clientes reconectan y el estado de presencia se reconstruye.

**Document Server**: maneja el estado real de los documentos. Estado persistente — todo va a PostgreSQL. Este servidor es el "source of truth".

La separación permite escalar el presence horizontalmente (muchas conexiones baratas) sin coordinar estado de documento (operación cara).

## Protocolo de mensajes

```typescript
type ClientMessage =
  | { type: 'join'; pageId: string }
  | { type: 'operation'; op: Operation; version: number }
  | { type: 'cursor'; blockId: string; offset: number };

type ServerMessage =
  | { type: 'operations'; ops: Operation[]; version: number }
  | { type: 'presence'; cursors: CursorState[] }
  | { type: 'error'; code: string; message: string };
```

El cliente envía operaciones con la `version` del documento que tiene localmente. El servidor las aplica y retransmite a otros clientes. Si hay divergencia, el servidor envía las operaciones faltantes.

## Estado actual y problemas encontrados

**Funcionando:**
- Inserción y borrado de texto con merge correcto en la mayoría de casos
- Presencia básica (quién está conectado)
- Reconexión automática con sincronización del estado

**Bugs conocidos:**
- El problema de interleaving de Logoot aparece con ediciones muy rápidas
- La generación de posiciones puede crear arrays muy profundos después de muchas inserciones/borrados

**Próximo paso:** migrar de Logoot a una implementación de Yjs. Yjs es battle-tested, tiene mejor rendimiento, y ya existe integración con ProseMirror y CodeMirror.

## Lecciones

**CRDT es teoría elegante con implementación complicada.** Los papers académicos asumen condiciones que no se dan en producción: latencia variable, clientes que se desconectan a mitad de una operación, y relojes que no están sincronizados.

**Yjs existe por buenas razones.** La complejidad que encontré en 6 semanas de implementación es la que Yjs resolvió en años. Para producción, usaría Yjs. Para aprender, valió la pena el camino.
