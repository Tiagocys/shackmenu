import { authenticate, json } from "../../_lib/http.js";
import {
  getOwnerRestaurant,
} from "../../_lib/connect.js";
import { createMercadoPagoOnboardingUrl } from "../../_lib/mercadopago.js";

export async function onRequestPost({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    const restaurant = await getOwnerRestaurant(env, authentication.user.id);
    if (!restaurant) return json({ error: "Loja não encontrada." }, 404);

    const url = await createMercadoPagoOnboardingUrl(
      env,
      authentication.user,
      restaurant,
      env.PUBLIC_APP_URL || new URL(request.url).origin,
    );
    return json({ url });
  } catch (error) {
    console.error("Could not create Mercado Pago onboarding", error);
    return json({ error: error.message || "Não foi possível comunicar com o Mercado Pago." }, 500);
  }
}
