---
title: "El editor visual: contenteditable a bajo nivel"
date: 2024-06-10
project: "notion-clone"
category: "Frontend"
tags: ["react", "typescript", "editor", "contenteditable"]
draft: false
---

## La decisión de usar contenteditable puro

Implementé el editor con un `<div contenteditable>` personalizado en lugar de librerías como Slate.js o ProseMirror. Tomé esta decisión para entender los problemas de bajo nivel que esas librerías ya resuelven.

Spoiler: ProseMirror existe por muy buenas razones.

## Los problemas que encontré

### Composición de caracteres (IME)

Los sistemas de Input Method Editor (IME) — usados para escribir chino, japonés, coreano, etc. — funcionan de forma diferente al input de teclado normal. El navegador dispara eventos especiales:

```
compositionstart → compositionupdate (múltiples veces) → compositionend
```

Durante la composición, el texto en el DOM es "temporal" — el usuario todavía está eligiendo el caracter final. Si proceso eventos `input` durante la composición, rompo el flujo IME.

```typescript
const [isComposing, setIsComposing] = useState(false);

function handleCompositionStart() {
  setIsComposing(true);
}

function handleCompositionEnd(e: CompositionEvent) {
  setIsComposing(false);
  // Ahora sí proceso el texto final
  processInput(e.data);
}

function handleInput(e: InputEvent) {
  if (isComposing) return; // Ignorar durante composición
  processInput(e.data ?? '');
}
```

Safari y Chrome tienen comportamientos sutilmente diferentes en el orden de los eventos. Pasé dos días en esto.

### Selección de texto entre bloques

Cuando el usuario selecciona texto que abarca múltiples bloques, necesito saber exactamente qué bloques están incluidos y qué offset tiene la selección en cada uno.

```typescript
function getSelectionRange(): SelectionRange | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  
  const range = selection.getRangeAt(0);
  const startBlock = findBlockFromNode(range.startContainer);
  const endBlock = findBlockFromNode(range.endContainer);
  
  if (!startBlock || !endBlock) return null;
  
  return {
    startBlockId: startBlock.id,
    startOffset: range.startOffset,
    endBlockId: endBlock.id,
    endOffset: range.endOffset,
    collapsed: range.collapsed,
  };
}
```

El problema: `range.startContainer` puede ser un `TextNode` dentro de un `<span>` dentro del bloque. Necesito subir el árbol DOM hasta encontrar el nodo del bloque.

### Undo/redo

El `Ctrl+Z` nativo del browser deshace cambios en el DOM. Pero yo necesito que deshaga operaciones en el modelo de datos (los bloques). Si mezclo los dos sistemas, los estados se dessincronizan.

Solución: `document.execCommand('styleWithCSS', false)` + implementar mi propio historial de operaciones. El undo nativo del browser se deshabilita (`e.preventDefault()` en `keydown`).

Mi historial es una pila de operaciones inversas:

```typescript
class UndoHistory {
  private stack: Operation[][] = [];
  private redoStack: Operation[][] = [];
  
  push(ops: Operation[]) {
    this.stack.push(ops);
    this.redoStack = []; // invalidar redo al hacer nueva operación
  }
  
  undo(): Operation[] | undefined {
    const ops = this.stack.pop();
    if (ops) this.redoStack.push(ops);
    return ops?.map(invertOperation);
  }
  
  redo(): Operation[] | undefined {
    const ops = this.redoStack.pop();
    if (ops) this.stack.push(ops);
    return ops;
  }
}
```

### Drag and drop de bloques

Este fue el más difícil. El drag-and-drop nativo del HTML5 no permite controlar el "ghost" (la imagen que se arrastra). Usé la API `Drag` pero con el ghost invisible + un componente custom que sigue el cursor.

El problema de rendimiento: mientras arrastras, necesitas calcular en qué posición del documento debería insertarse el bloque, basándote en la posición Y del cursor. Con documentos de 100+ bloques esto requiere memoización agresiva.

## Estado actual

El editor funciona para casos comunes:
- Párrafos, headings, listas, bloques de código
- Atajos de teclado estándar (`Ctrl+B`, `Ctrl+I`, etc.)
- El comando `/` para cambiar el tipo de bloque

Casos edge con bugs conocidos:
- IME en Safari tiene comportamiento inconsistente
- Selección multi-bloque con mouse (funciona con teclado)
- Drag and drop en dispositivos móviles

## Lo que aprendí

**No subestimes el editor de texto.** Es el componente más difícil de la UI. El mismo ProseMirror tiene ~15,000 líneas de código bien pensadas para manejar estos casos.

**Para producción: usa una librería.** Tiptap (sobre ProseMirror) o Lexical (de Meta) tienen años de trabajo resolviendo exactamente estos problemas. Este ejercicio fue valioso para entender *por qué* esas librerías son complejas, no para reemplazarlas.
