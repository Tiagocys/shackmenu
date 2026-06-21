import { authenticate, json } from "../../_lib/http.js";
import { getUserSubscription, stripeError, stripeRequest } from "../../_lib/stripe.js";

export async function onRequestPost({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    const subscription = await getUserSubscription(request, env, authentication.user.id);
    if (!subscription?.stripe_customer_id) {
      return json({ error: "Assinatura não encontrada." }, 404);
    }

    const parameters = {
      customer: subscription.stripe_customer_id,
      return_url: `${env.PUBLIC_APP_URL || new URL(request.url).origin}/`,
    };
    if (env.STRIPE_PORTAL_CONFIGURATION_ID) {
      parameters.configuration = env.STRIPE_PORTAL_CONFIGURATION_ID;
    }
    const session = await stripeRequest(env, "/billing_portal/sessions", parameters);
    return json({ url: session.url });
  } catch (error) {
    return stripeError(error);
  }
}
