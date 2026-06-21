---
title: "El modelo de bloques"
date: 2024-04-20
project: "notion-clone"
category: "Arquitectura"
tags: ["typescript", "architecture", "data-structures", "postgresql"]
draft: false
---

## El modelo de datos

Todo en Notion es un bloque. Un documento es un bloque que contiene bloques. Cada bloque tiene un tipo, propiedades y una lista de hijos.

La representación más natural sería un árbol anidado. Pero Notion usa una representación **plana**:

```typescript
interface Block {
  id: string;
  type: 'paragraph' | 'heading_1' | 'heading_2' | 'code' | 'bulleted_list' | 'toggle';
  properties: Record<string, RichText[]>;
  children: string[]; // IDs de bloques hijos — no los bloques en sí
  parentId: string | null;
  pageId: string;
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

La representación plana (IDs en lugar de nodos anidados) hace que las operaciones de reordenamiento y movimiento entre páginas sean O(1) en base de datos — un `UPDATE` que cambia `parentId` y `children` en lugar de reescribir subárboles enteros.

## Schema de base de datos

```sql
CREATE TABLE blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     UUID NOT NULL REFERENCES pages(id),
  parent_id   UUID REFERENCES blocks(id),
  type        TEXT NOT NULL,
  properties  JSONB NOT NULL DEFAULT '{}',
  children    UUID[] NOT NULL DEFAULT '{}',
  version     BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX blocks_page_id_idx ON blocks(page_id);
CREATE INDEX blocks_parent_id_idx ON blocks(parent_id);
```

El campo `version` es crítico: permite detectar conflictos cuando dos clientes modifican el mismo bloque simultáneamente.

## Operaciones del árbol

Con esta estructura, las operaciones básicas del editor se traducen directamente a SQL:

```typescript
// Mover bloque a nueva posición dentro de la misma página
async function moveBlock(blockId: string, newParentId: string, newIndex: number) {
  await db.transaction(async (tx) => {
    const block = await tx.query('SELECT * FROM blocks WHERE id = $1', [blockId]);
    
    // Remover del padre actual
    await tx.query(
      'UPDATE blocks SET children = array_remove(children, $1) WHERE id = $2',
      [blockId, block.parentId]
    );
    
    // Insertar en nuevo padre en la posición correcta
    await tx.query(
      `UPDATE blocks 
       SET children = children[:$3-1] || $1::uuid || children[$3:]
       WHERE id = $2`,
      [blockId, newParentId, newIndex]
    );
    
    // Actualizar el bloque mismo
    await tx.query(
      'UPDATE blocks SET parent_id = $1 WHERE id = $2',
      [newParentId, blockId]
    );
  });
}
```

## El problema de la carga

Cargar un documento requiere obtener todos los bloques de una página y reconstruir el árbol en el cliente:

```typescript
async function loadPage(pageId: string): Promise<Block[]> {
  const blocks = await db.query(
    'SELECT * FROM blocks WHERE page_id = $1 ORDER BY created_at',
    [pageId]
  );
  return blocks.rows;
}

// En el cliente, reconstruir el árbol
function buildTree(blocks: Block[]): BlockNode {
  const map = new Map(blocks.map((b) => [b.id, { ...b, childBlocks: [] }]));
  
  for (const block of blocks) {
    if (block.parentId) {
      map.get(block.parentId)?.childBlocks.push(map.get(block.id)!);
    }
  }
  
  return map.get(blocks[0].id)!; // el bloque raíz (la página)
}
```

Para documentos grandes esto puede traer cientos de bloques. Notion usa lazy loading por secciones — eso lo implementaré en una fase posterior.

## Decisión: sin ORM

Decidí usar `pg` directamente en lugar de Prisma o Drizzle. El motivo: las operaciones de array de PostgreSQL (`array_remove`, `array_append`, slicing) no tienen buen soporte en los ORMs principales. Escribir SQL directo es más claro aquí.

El tradeoff es más boilerplate. Es aceptable para un proyecto de aprendizaje.
