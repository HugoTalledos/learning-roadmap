---
title: "El patrón Payment Intent y diseño del sistema"
date: 2024-02-15
project: "stripe-checkout"
category: "Diseño"
tags: ["payments", "architecture", "postgresql", "node.js"]
draft: false
---

## Contexto

Stripe Checkout es uno de los productos de pagos mejor diseñados de la industria. Decidí clonarlo para entender desde adentro qué hace que su arquitectura sea tan robusta.

El objetivo: implementar el núcleo funcional con las mismas garantías que Stripe — sin importar cuántas veces el cliente reintente la operación, el pago se procesa exactamente una vez.

## El patrón Payment Intent

Stripe usa el patrón **Payment Intent** para separar la intención de pago de su ejecución. Esto resuelve un problema clásico: el usuario puede navegar hacia atrás, recargar la página, o perder la conexión durante el checkout.

```
Cliente → POST /checkout/sessions         → Crea un PaymentIntent (estado: created)
Cliente → POST /checkout/sessions/:id/pay → Intenta cobrar (estado: processing)
Webhook → POST /webhooks/stripe           → Confirma el resultado (estado: succeeded | failed)
```

El `PaymentIntent` vive en base de datos con un `idempotency_key` que previene cobros duplicados aunque el cliente reintente la misma solicitud.

## Schema de base de datos

```sql
CREATE TABLE payment_intents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,
  amount          INTEGER NOT NULL,  -- siempre en centavos
  currency        CHAR(3) NOT NULL DEFAULT 'mxn',
  status          TEXT NOT NULL DEFAULT 'created',
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checkout_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id UUID NOT NULL REFERENCES payment_intents(id),
  success_url       TEXT NOT NULL,
  cancel_url        TEXT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

La restricción `UNIQUE` en `idempotency_key` es la primera línea de defensa contra cobros duplicados. PostgreSQL garantiza que solo un registro con esa clave puede existir.

## Máquina de estados

El `PaymentIntent` sigue una máquina de estados estricta:

```
created → processing → succeeded
                    ↘ failed
```

Las transiciones solo avanzan, nunca retroceden. Esto es crítico: un webhook `payment_intent.succeeded` sobre un intent ya `succeeded` debe ser un no-op.

```typescript
const VALID_TRANSITIONS: Record<string, string[]> = {
  created: ['processing'],
  processing: ['succeeded', 'failed'],
  succeeded: [],
  failed: [],
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

## Manejo de dinero

Regla fundamental: **nunca usar `float` para montos monetarios**.

```javascript
0.1 + 0.2 === 0.30000000000000004 // JavaScript :(
```

Todos los montos se almacenan y manipulan en centavos como `INTEGER`. La conversión a pesos/dólares solo ocurre en la presentación al usuario.

```typescript
// MAL
const amount = 99.99; // float

// BIEN
const amountInCents = 9999; // integer, 99.99 MXN
```

## API design

```
POST /checkout/sessions
  Body: { amount, currency, successUrl, cancelUrl, metadata? }
  Headers: Idempotency-Key: <uuid>
  Response: { sessionId, url }

POST /checkout/sessions/:id/pay
  Body: { card: { number, expiry, cvv } }
  Response: { status, paymentIntentId }

POST /webhooks/payment-processor
  Body: { event, paymentIntentId, status }
  Headers: X-Webhook-Signature: <hmac>
```

El siguiente paso fue implementar la idempotencia y el manejo de webhooks, que resultaron ser más complejos de lo que esperaba.
