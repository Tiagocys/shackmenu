import { json } from "../../../_lib/http.js";
import { getMercadoPagoPaymentForOrder, syncMercadoPagoPayment } from "../../../_lib/mercadopago.js";
import { getOrderNotificationDetails } from "../../../_lib/orders.js";
import { sendOrderPaymentConfirmedEmails } from "../../../_lib/email.js";

function getPaymentId(url, payload) {
  const params = new URL(url).searchParams;
  return payload?.data?.id
    || payload?.id
    || params.get("data.id")
    || params.get("id");
}

function isPaymentNotification(url, payload) {
  const params = new URL(url).searchParams;
  return payload?.type === "payment"
    || payload?.topic === "payment"
    || params.get("type") === "payment"
    || params.get("topic") === "payment";
}

export async function onRequestPost({ request, env }) {
  let payload = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  try {
    if (!isPaymentNotification(request.url, payload)) return json({ received: true });
    const paymentId = getPaymentId(request.url, payload);
    if (!paymentId) return json({ error: "Pagamento não informado." }, 400);
    const payment = await getMercadoPagoPaymentForOrder(env, paymentId);
    const order = await syncMercadoPagoPayment(env, payment);
    if (order?.status === "payment_confirmed" && !order.was_already_confirmed) {
      const details = await getOrderNotificationDetails(env, order.id);
      await sendOrderPaymentConfirmedEmails(env, details);
    }
    return json({ received: true });
  } catch (error) {
    console.error("Mercado Pago webhook processing failed", error);
    return json({ error: "Falha ao processar webhook do Mercado Pago." }, 500);
  }
}
