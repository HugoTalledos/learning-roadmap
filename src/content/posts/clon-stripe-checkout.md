---
title: "Clon de Stripe Checkout: sistema de pagos desde cero"
description: "Implementé un sistema de pagos similar a Stripe Checkout usando Node.js, PostgreSQL y el patrón Payment Intent. Documentación completa del diseño, decisiones de arquitectura y lecciones aprendidas."
publishedAt: 2024-03-15
tags: ["node.js", "postgresql", "payments", "architecture"]
draft: false
projectStatus: "completed"
---

## Contexto

Stripe Checkout es uno de los productos de pagos mejor diseñados de la industria. Decidí clonarlo no para competir con Stripe, sino para entender desde adentro qué hace que su arquitectura sea tan robusta.

El objetivo era implementar el núcleo funcional: crear una sesión de checkout, procesar el pago, y manejar el webhook de confirmación, todo con las garantías de idempotencia que Stripe ofrece.

## Diseño del sistema

### El patrón Payment Intent

Stripe usa el patrón **Payment Intent** para separar la intención de pago de su ejecución. Esto resuelve un problema clásico: el usuario puede navegar hacia atrás, recargar la página, o perder la conexión durante el checkout.

```
Cliente → POST /checkout/sessions         → Crea un PaymentIntent (estado: created)
Cliente → POST /checkout/sessions/:id/pay → Intenta cobrar (estado: processing)
Webhook → POST /webhooks/stripe           → Confirma el resultado (estado: succeeded | failed)
```

El `PaymentIntent` vive en base de datos con un `idempotency_key` que previene cobros duplicados aunque el cliente reintente la misma solicitud.

### Schema de base de datos

```sql
CREATE TABLE payment_intents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  amount        INTEGER NOT NULL,  -- en centavos
  currency      CHAR(3) NOT NULL DEFAULT 'mxn',
  status        TEXT NOT NULL DEFAULT 'created',
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checkout_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id UUID REFERENCES payment_intents(id),
  success_url       TEXT NOT NULL,
  cancel_url        TEXT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### Idempotencia

El punto más importante del diseño. Cada solicitud de pago incluye un `Idempotency-Key` en el header. Si la misma clave llega dos veces, el servidor devuelve la respuesta original sin procesar el pago dos veces:

```typescript
async function createPaymentIntent(key: string, amount: number) {
  const existing = await db.query(
    'SELECT * FROM payment_intents WHERE idempotency_key = $1',
    [key]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0]; // respuesta cacheada
  }

  return db.query(
    'INSERT INTO payment_intents (idempotency_key, amount) VALUES ($1, $2) RETURNING *',
    [key, amount]
  );
}
```

## Manejo de webhooks

Los webhooks de Stripe llegan asíncronamente y pueden llegar fuera de orden o más de una vez. La solución es un estado de máquina finita:

```
created → processing → succeeded
                    ↘ failed
```

Las transiciones solo avanzan, nunca retroceden. Un webhook `payment_intent.succeeded` sobre un intent ya `succeeded` es un no-op.

## Lecciones aprendidas

**La idempotencia es más difícil de lo que parece.** No es solo guardar la respuesta; hay condiciones de carrera cuando dos requests con la misma clave llegan al mismo tiempo. Necesité `SELECT FOR UPDATE` y un índice único.

**Los webhooks no son confiables.** Stripe reintenta durante 72 horas. El sistema debe asumir que cualquier webhook puede llegar tarde, duplicado, o nunca.

**Maneja el dinero en enteros.** Nunca uses `float` para montos. Siempre en centavos como `INTEGER`. Aprendí esto con `0.1 + 0.2 = 0.30000000000000004`.

## Resultado

El sistema procesa sesiones de checkout con garantías de exactamente-una-vez, maneja reintentos de red correctamente, y tiene cobertura de tests con casos de fallo de red simulados.

El código completo está en mi GitHub con un README que incluye instrucciones para correrlo localmente con Docker.
