import { authenticate, json } from "../../_lib/http.js";
import { listOwnerOrders } from "../../_lib/orders.js";

export async function onRequestGet({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    return json({ orders: await listOwnerOrders(env, authentication.user.id) });
  } catch (error) {
    console.error("Could not list orders", error);
    return json({ error: "Não foi possível carregar os pedidos." }, 500);
  }
}
