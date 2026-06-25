import { json } from "../../_lib/http.js";
import { mercadoPagoError } from "../../_lib/mercadopago.js";
import { createMercadoPagoOrderCheckoutSession } from "../../_lib/orders.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const result = await createMercadoPagoOrderCheckoutSession(env, body, new URL(request.url).origin);
    return json(result);
  } catch (error) {
    const expected = [
      "Cardápio não encontrado.",
      "Esta loja ainda não liberou pagamento online.",
      "Pedido vazio.",
      "Nenhum produto válido encontrado.",
      "Informe o nome para o pedido.",
      "Informe um e-mail válido.",
      "Informe um CEP com 8 dígitos.",
      "CEP não encontrado.",
      "Não foi possível consultar o CEP.",
      "Informe o número ou complemento da entrega.",
      "Esta loja ainda não configurou as cidades de entrega.",
      "Mercado Pago não está configurado.",
    ];
    if (expected.includes(error.message) || error.message?.startsWith("Esta loja não entrega em ")) {
      return json({ error: error.message }, 400);
    }
    const result = mercadoPagoError(error);
    return json({ error: result.message }, result.status);
  }
}
