import { authenticate, json } from "../../_lib/http.js";
import { getUserSubscription, stripeError, stripeRequest } from "../../_lib/stripe.js";

export async function onRequestPost({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    const existing = await getUserSubscription(request, env, authentication.user.id);
    if (["active", "trialing"].includes(existing?.status)) {
      return json({ error: "Sua assinatura Pro já está ativa." }, 409);
    }

    if (!env.STRIPE_PRO_PRICE_ID) {
      return json({ error: "O preço do plano Pro não está configurado." }, 503);
    }

    const origin = env.PUBLIC_APP_URL || new URL(request.url).origin;
    const parameters = {
      mode: "subscription",
      "line_items[0][price]": env.STRIPE_PRO_PRICE_ID,
      "line_items[0][quantity]": "1",
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancelled`,
      client_reference_id: authentication.user.id,
      "metadata[owner_id]": authentication.user.id,
      "subscription_data[metadata][owner_id]": authentication.user.id,
      allow_promotion_codes: "true",
      locale: "pt-BR",
    };

    if (existing?.stripe_customer_id) parameters.customer = existing.stripe_customer_id;
    else parameters.customer_email = authentication.user.email;

    const session = await stripeRequest(env, "/checkout/sessions", parameters);
    return json({ url: session.url });
  } catch (error) {
    return stripeError(error);
  }
}
