import { completeMercadoPagoOnboarding } from "../../_lib/mercadopago.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const origin = env.PUBLIC_APP_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error || !code || !state) {
    return Response.redirect(`${origin}/?connect=refresh`, 302);
  }

  try {
    await completeMercadoPagoOnboarding(env, { code, state, origin });
    return Response.redirect(`${origin}/?connect=return`, 302);
  } catch (callbackError) {
    console.error("Mercado Pago OAuth callback failed", callbackError);
    return Response.redirect(`${origin}/?connect=refresh`, 302);
  }
}
