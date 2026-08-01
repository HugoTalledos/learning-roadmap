---
title: "Mi primer chatbot con LangGraph: un grafo de dos nodos y tres herramientas"
date: 2026-08-01
project: "light-house"
category: "arquitectura"
tags: ["langgraph", "langchain", "ollama", "chatbot", "agentes", "aprendizaje"]
draft: false
---

## El problema de fondo

Ya tenía tres herramientas construidas y probadas por separado: `campaign_builder_tool`, `image_builder_tool` y `landing_builder_tool`. Cada una hace bien su trabajo, pero hasta ahora vivían aisladas — nada las conectaba en una conversación real donde un usuario pudiera pedir "arma una campaña para mi negocio" y el sistema decidiera solo qué herramienta usar y en qué orden.

Antes de meterle más capas de diseño a eso, quería resolver una pregunta más básica: ¿cómo modela LangGraph el flujo de "el modelo decide, a veces usa una herramienta, y sigue"? Seguí [un video](https://www.youtube.com/watch?v=LS4pALyrm00&t=76s) que arma justo ese patrón mínimo, y lo repliqué contra mis propias tools para entenderlo en carne propia antes de construir algo serio encima.

## Un grafo, no un loop

La diferencia mental más importante frente a escribir el loop de agente a mano es que acá el control de flujo es un grafo explícito: nodos y aristas, no un `while` escondido dentro de un framework. Un nodo `chatbot` invoca al modelo; si el modelo pide una herramienta, una arista condicional manda la ejecución a un nodo `tools`; de ahí se vuelve a `chatbot` para que redacte la respuesta final con el resultado ya disponible.

```python
def build_graph() -> StateGraph:
    graph_bulder = StateGraph(State)

    def chatbot(state: State):
        message = model.invoke(state["messages"])
        return { "messages": [message] }

    tool_node = ToolNode(tools)

    graph_bulder.add_node("chatbot", chatbot)
    graph_bulder.add_node("tools", tool_node)

    graph_bulder.add_conditional_edges("chatbot", tools_condition)
    graph_bulder.add_edge("tools", "chatbot")
    graph_bulder.add_edge(START, "chatbot")

    return graph_bulder.compile(checkpointer=memory)
```

`tools_condition` es la pieza que hace la magia: mira si el último mensaje del modelo trae una tool call y, si es así, enruta a `"tools"`; si no, el grafo termina ahí. No tuve que escribir ese `if` a mano.

## El estado es la memoria de la conversación

Para que el nodo `chatbot` sepa qué se dijo antes, el grafo necesita un estado que se acumule turno a turno. LangGraph resuelve esto con un `TypedDict` anotado con un "reducer" — una función que le dice al grafo cómo combinar el estado viejo con el nuevo cada vez que un nodo devuelve algo.

```python
class State(TypedDict):
    messages: Annotated[list, add_messages]
    thread_id: str
```

`add_messages` es ese reducer: en vez de que cada nodo tenga que devolver la lista completa de mensajes, alcanza con devolver el mensaje nuevo y `add_messages` lo agrega a la lista existente. Es la diferencia entre "el nodo administra el historial" y "el grafo administra el historial".

Para que esa memoria sobreviva entre turnos de la misma conversación (y no solo dentro de una llamada), el grafo se compila con un checkpointer y se invoca siempre con el mismo `thread_id`:

```python
memory = MemorySaver()
graph_config = { "configurable": { "thread_id": "1" } }
```

Si algún día quisiera una conversación nueva desde cero, la única palanca es cambiar ese `thread_id` — el resto del código no se toca.

## El modelo corre en local, atado a las tres tools

Para no depender de una API key mientras probaba, usé Ollama con `qwen2.5-coder:7b` corriendo en mi máquina, y le até las tres herramientas con `bind_tools`:

```python
model = ChatOllama(
    model="qwen2.5-coder:7b",
    temperature=0.5,
    max_tokens=1000,
    top_p=1.0,
).bind_tools(tools)
```

Esto es lo más artesanal de todo el experimento: el modelo está hardcodeado acá, sin pasar por `LLM_PROVIDER` como sí hace el resto del proyecto para el resto de las tools. Fue a propósito — quería aislar la variable "¿entiendo LangGraph?" de la variable "¿cómo integro esto a la arquitectura de proveedores que ya tengo?".

## Resultado

Con esas cinco piezas (`state.py`, `config.py`, `graph.py`, `chat.py`, `main.py`) tengo un chatbot de consola que mantiene contexto entre mensajes y que, cuando el usuario lo pide, invoca alguna de las tres tools reales del proyecto y sigue la conversación con el resultado. Nada de esto habla con un frontend todavía — es un loop de `input()` pensado solo para validar que el grafo se comporta como esperaba.

## Qué sigue

Este experimento dejó claro qué falta antes de que esto sea usable desde fuera de una terminal:

1. **System prompt** — el modelo hoy no tiene ninguna instrucción sobre su rol o sobre cuándo usar cada herramienta; todo lo infiere del historial de mensajes.
2. **Una API** — para poder hablarle al modelo desde otro sistema (el frontend u otro servicio), en vez de depender del loop interactivo.
3. **Separar modelos por herramientas permitidas** — no todas las tools deberían estar disponibles para cualquier modelo; separar esa responsabilidad debería dar más control sobre qué puede hacer cada uno.
4. **Probar todo de punta a punta** una vez esas piezas estén en su lugar.

Por ahora, la conclusión honesta es que sirvió para perder el miedo a LangGraph. Honestamente, esto es algo "magico" para mi todavía, pero me siento orgulloso de estos primeros pasos.