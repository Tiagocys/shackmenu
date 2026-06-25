import { authenticate, json } from "../../_lib/http.js";
import { refundMercadoPagoOrder } from "../../_lib/orders.js";

export async function onRequestPost({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  try {
    const body = await request.json();
    const order = await refundMercadoPagoOrder(env, authentication.user.id, body?.orderId);
    return json({ order });
  } catch (error) {
    const expectedError = error.status === 404
      || error.status === 400
      || /Pedido|pedido|Apenas|Mercado Pago/.test(error.message || "");
    if (!expectedError) console.error("Could not refund Mercado Pago order", error);
    return json({
      error: expectedError
        ? error.message
        : "Não foi possível reembolsar este pedido no Mercado Pago.",
    }, error.status || (expectedError ? 400 : 500));
  }
}
