import { json } from "../../_lib/http.js";
import { stripeRequest, syncSubscription, verifyStripeWebhook } from "../../_lib/stripe.js";

export async function onRequestPost({ request, env }) {
  const payload = await request.text();
  const valid = await verifyStripeWebhook(
    payload,
    request.headers.get("stripe-signature"),
    env.STRIPE_WEBHOOK_SECRET,
  );
  if (!valid) return json({ error: "Assinatura do webhook inválida." }, 400);

  const event = JSON.parse(payload);
  try {
    if (event.type === "checkout.session.completed" && event.data.object.subscription) {
      const subscription = await stripeRequest(env, `/subscriptions/${event.data.object.subscription}`);
      await syncSubscription(subscription, env);
    }

    if ([
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ].includes(event.type)) {
      await syncSubscription(event.data.object, env);
    }

    return json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return json({ error: "Falha ao processar webhook." }, 500);
  }
}
