import { getOwnerRestaurant } from "../_lib/connect.js";
import {
  getOwnerDeliveryCities,
  replaceOwnerDeliveryCities,
  updateOwnerDeliveryFee,
} from "../_lib/delivery.js";
import { authenticate, json } from "../_lib/http.js";

export async function onRequestGet({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    const restaurant = await getOwnerRestaurant(env, authentication.user.id);
    return json({
      cities: await getOwnerDeliveryCities(env, authentication.user.id),
      deliveryFeeCents: restaurant?.delivery_fee_cents || 0,
    });
  } catch (error) {
    console.error("Could not read delivery cities", error);
    return json({ error: "Não foi possível carregar as cidades de entrega." }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    const restaurant = await getOwnerRestaurant(env, authentication.user.id);
    if (!restaurant) return json({ error: "Loja não encontrada." }, 404);
    const body = await request.json();
    const [cities, updatedRestaurant] = await Promise.all([
      replaceOwnerDeliveryCities(
        env,
        authentication.user.id,
        restaurant.id,
        body.cities,
      ),
      updateOwnerDeliveryFee(env, authentication.user.id, restaurant.id, body.deliveryFeeCents),
    ]);
    return json({ cities, deliveryFeeCents: updatedRestaurant?.delivery_fee_cents || 0 });
  } catch (error) {
    console.error("Could not save delivery cities", error);
    return json({ error: "Não foi possível salvar as cidades de entrega." }, 500);
  }
}
