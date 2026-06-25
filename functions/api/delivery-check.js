import { validateCepForRestaurant } from "../_lib/delivery.js";
import { json } from "../_lib/http.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const restaurantId = String(body.restaurantId || "").trim();
    if (!restaurantId) return json({ error: "Restaurante não informado." }, 400);
    const address = await validateCepForRestaurant(env, restaurantId, body.cep);
    return json({ address });
  } catch (error) {
    const expected = [
      "Informe um CEP com 8 dígitos.",
      "CEP não encontrado.",
      "Não foi possível consultar o CEP.",
      "Este restaurante ainda não configurou as cidades de entrega.",
    ];
    if (expected.includes(error.message) || error.message?.startsWith("Este restaurante não entrega em ")) {
      return json({ error: error.message }, 400);
    }
    console.error("Could not validate delivery CEP", error);
    return json({ error: "Não foi possível validar a entrega." }, 500);
  }
}
