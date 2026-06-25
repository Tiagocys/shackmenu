import { getOwnerRestaurant } from "../_lib/connect.js";
import { getOwnerDeliveryCities, replaceOwnerDeliveryCities } from "../_lib/delivery.js";
import { authenticate, json } from "../_lib/http.js";

export async function onRequestGet({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    return json({ cities: await getOwnerDeliveryCities(env, authentication.user.id) });
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
    if (!restaurant) return json({ error: "Restaurante não encontrado." }, 404);
    const body = await request.json();
    const cities = await replaceOwnerDeliveryCities(
      env,
      authentication.user.id,
      restaurant.id,
      body.cities,
    );
    return json({ cities });
  } catch (error) {
    console.error("Could not save delivery cities", error);
    return json({ error: "Não foi possível salvar as cidades de entrega." }, 500);
  }
}
