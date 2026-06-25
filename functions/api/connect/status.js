import { authenticate, json } from "../../_lib/http.js";
import {
  getOwnerRestaurant,
} from "../../_lib/connect.js";
import { getOwnerMercadoPagoAccount, publicMercadoPagoStatus } from "../../_lib/mercadopago.js";

export async function onRequestGet({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    const restaurant = await getOwnerRestaurant(env, authentication.user.id);
    if (!restaurant) return json({ error: "Loja não encontrada." }, 404);

    const account = await getOwnerMercadoPagoAccount(env, authentication.user.id);
    return json({ payment: publicMercadoPagoStatus(account) });
  } catch (error) {
    console.error("Could not read Mercado Pago status", error);
    return json({ error: "Não foi possível comunicar com o Mercado Pago." }, 500);
  }
}
