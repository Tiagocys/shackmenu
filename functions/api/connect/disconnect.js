import { authenticate, json } from "../../_lib/http.js";
import {
  getOwnerRestaurant,
} from "../../_lib/connect.js";
import { disconnectOwnerMercadoPagoAccount, publicMercadoPagoStatus } from "../../_lib/mercadopago.js";

export async function onRequestPost({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    const restaurant = await getOwnerRestaurant(env, authentication.user.id);
    if (!restaurant) return json({ error: "Loja não encontrada." }, 404);

    const account = await disconnectOwnerMercadoPagoAccount(env, authentication.user.id);
    return json({ payment: publicMercadoPagoStatus(account) });
  } catch (error) {
    console.error("Could not disconnect Mercado Pago", error);
    return json({ error: "Não foi possível desconectar o Mercado Pago." }, 500);
  }
}
