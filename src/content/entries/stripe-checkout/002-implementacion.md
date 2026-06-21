---
title: "Idempotencia, webhooks y lecciones aprendidas"
date: 2024-03-15
project: "stripe-checkout"
category: "Implementación"
tags: ["payments", "node.js", "webhooks", "postgresql", "idempotency"]
draft: false
---

## Idempotencia: más difícil de lo que parece

La idempotencia no es solo guardar la respuesta — hay condiciones de carrera cuando dos requests con la misma clave llegan al mismo tiempo.

El caso problemático:

```
T1: Request A llega → busca en DB → no existe → va a insertar
T2: Request B llega → busca en DB → no existe → va a insertar
T1: INSERT → éxito
T2: INSERT → UNIQUE CONSTRAINT violation
```

La solución con `SELECT FOR UPDATE` y transacción:

```typescript
async function createPaymentIntent(key: string, amount: number, currency: string) {
  return db.transaction(async (tx) => {
    // Bloquear el registro si existe
    const existing = await tx.query(
      'SELECT * FROM payment_intents WHERE idempotency_key = $1 FOR UPDATE',
      [key]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0]; // respuesta cacheada, sin nuevo cobro
    }

    return tx.query(
      `INSERT INTO payment_intents (idempotency_key, amount, currency)
       VALUES ($1, $2, $3) RETURNING *`,
      [key, amount, currency]
    );
  });
}
```

El `FOR UPDATE` adquiere un lock exclusivo sobre el registro. Si no existe todavía, la transacción hace el INSERT. El índice UNIQUE es el último guardián: si dos transacciones simultáneas llegan al INSERT, solo una gana.

## Manejo de webhooks

Los webhooks de un procesador de pagos llegan asíncronamente y pueden:
- Llegar fuera de orden
- Llegar más de una vez
- No llegar nunca (el procesador los reintenta por horas)

El sistema debe manejar todos estos casos correctamente.

### Verificación de firma

Todo webhook incluye una firma HMAC que demuestra que vino del procesador y no de un atacante:

```typescript
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  // Comparación en tiempo constante para prevenir timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

Si el signature no coincide, respondo `400` y no proceso el webhook.

### Deduplicación de webhooks

El procesador puede enviar el mismo webhook múltiples veces. Deduplicación con una tabla de eventos:

```sql
CREATE TABLE webhook_events (
  id              TEXT PRIMARY KEY, -- ID del evento del procesador
  payment_intent_id UUID REFERENCES payment_intents(id),
  type            TEXT NOT NULL,
  processed_at    TIMESTAMPTZ DEFAULT NOW()
);
```

```typescript
async function processWebhook(event: WebhookEvent) {
  // Deduplicación — si ya procesamos este evento, ignorar
  const exists = await db.query(
    'SELECT id FROM webhook_events WHERE id = $1',
    [event.id]
  );
  
  if (exists.rows.length > 0) {
    return; // idempotente
  }
  
  await db.transaction(async (tx) => {
    // Registrar el evento
    await tx.query(
      'INSERT INTO webhook_events (id, payment_intent_id, type) VALUES ($1, $2, $3)',
      [event.id, event.paymentIntentId, event.type]
    );
    
    // Actualizar el PaymentIntent si la transición es válida
    if (canTransition(event.currentStatus, event.newStatus)) {
      await tx.query(
        'UPDATE payment_intents SET status = $1, updated_at = NOW() WHERE id = $2',
        [event.newStatus, event.paymentIntentId]
      );
    }
  });
}
```

### Respuesta rápida al procesador

Los procesadores de pagos esperan una respuesta `200` en menos de 30 segundos. Si no llega, asumen que el webhook falló y lo reintentarán.

El patrón correcto: aceptar el webhook inmediatamente, procesarlo en background.

```typescript
app.post('/webhooks/payment-processor', async (req, res) => {
  if (!verifyWebhookSignature(req.rawBody, req.headers['x-signature'], WEBHOOK_SECRET)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Encolar para procesamiento asíncrono
  await queue.push({ type: 'webhook', event: req.body });
  
  // Responder inmediatamente
  res.status(200).json({ received: true });
});
```

## Resultado

El sistema procesa sesiones de checkout con garantías de exactamente-una-vez en condiciones normales. Los escenarios probados:

- ✅ Cliente reintenta la misma solicitud 10 veces → un solo cobro
- ✅ Webhook duplicado → procesado una sola vez
- ✅ Webhooks fuera de orden → estado final correcto
- ✅ Timeout de red durante el pago → recuperación via webhook
- ✅ Ataque de replay → signature inválida, rechazado

## Lecciones aprendidas

**La idempotencia es la feature más importante de un sistema de pagos.** No es opcional y hay que diseñarla desde el principio.

**Los webhooks no son confiables.** Stripe reintenta durante 72 horas. El sistema debe asumir que cualquier webhook puede llegar tarde, duplicado, o nunca. Diseña para eso.

**Maneja el dinero en enteros.** `0.1 + 0.2 = 0.30000000000000004` en JavaScript. Siempre en centavos como `INTEGER`. Sin excepción.

**Los timing attacks son reales.** Comparaciones de strings regulares pueden filtrar información sobre el secret via diferencias de tiempo. `crypto.timingSafeEqual` es la única forma correcta de comparar signatures.
