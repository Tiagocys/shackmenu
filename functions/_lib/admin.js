import { stripeApiVersion, syncSubscription } from "./stripe.js";

export function isAdmin(env, userId) {
  return String(env.ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .includes(userId);
}

async function supabaseAdminRequest(env, path, options = {}) {
  const baseUrl = env.SUPABASE_URL || env.project_url;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;
  if (!baseUrl || !key) throw new Error("Supabase admin credentials are not configured");
  const response = await fetch(`${baseUrl}/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`Supabase admin request failed (${response.status})`);
  if (response.status === 204) return null;
  return response.json();
}

async function stripeAdminRequest(env, path, { method = "GET", parameters, idempotencyKey } = {}) {
  if (!env.STRIPE_SECRET) throw new Error("Stripe is not configured");
  const query = method === "GET" && parameters ? `?${new URLSearchParams(parameters)}` : "";
  const response = await fetch(`https://api.stripe.com/v1${path}${query}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET}`,
      "Stripe-Version": stripeApiVersion,
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: method !== "GET" && parameters ? new URLSearchParams(parameters) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || `Stripe request failed (${response.status})`);
  return payload;
}

async function getLatestInvoicePayment(env, stripeSubscriptionId) {
  const subscription = await stripeAdminRequest(env, `/subscriptions/${stripeSubscriptionId}`);
  const invoiceId = typeof subscription.latest_invoice === "string"
    ? subscription.latest_invoice
    : subscription.latest_invoice?.id;
  if (!invoiceId) return { subscription, invoice: null, paymentIntentId: null };

  const invoice = await stripeAdminRequest(env, `/invoices/${invoiceId}`, {
    parameters: [["expand[]", "payments.data.payment.payment_intent"]],
  });
  const invoicePayment = invoice.payments?.data?.find((payment) =>
    payment.status === "paid" && payment.payment?.type === "payment_intent");
  const paymentIntent = invoicePayment?.payment?.payment_intent;
  const paymentIntentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
  return { subscription, invoice, paymentIntentId };
}

export async function listAdminCustomers(env) {
  const [subscriptions, restaurants, authUsers] = await Promise.all([
    supabaseAdminRequest(env, "rest/v1/subscriptions?select=owner_id,stripe_subscription_id,status,current_period_end,cancel_at_period_end&order=created_at.desc"),
    supabaseAdminRequest(env, "rest/v1/restaurants?select=owner_id,name,custom_domain"),
    supabaseAdminRequest(env, "auth/v1/admin/users?per_page=100"),
  ]);

  return Promise.all(subscriptions.map(async (subscription) => {
    const restaurant = restaurants.find((item) => item.owner_id === subscription.owner_id);
    const user = authUsers.users?.find((item) => item.id === subscription.owner_id);
    let invoice = null;
    try {
      ({ invoice } = await getLatestInvoicePayment(env, subscription.stripe_subscription_id));
    } catch (error) {
      console.error("Could not read latest Stripe invoice", error);
    }
    return {
      ownerId: subscription.owner_id,
      email: user?.email || "Email indisponível",
      restaurant: restaurant?.name || "Loja sem nome",
      customDomain: restaurant?.custom_domain || null,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      latestInvoice: invoice ? {
        id: invoice.id,
        status: invoice.status,
        amountPaid: invoice.amount_paid,
        currency: invoice.currency,
      } : null,
    };
  }));
}

export async function refundAndCancel(env, ownerId, adminUserId) {
  const records = await supabaseAdminRequest(
    env,
    `rest/v1/subscriptions?select=owner_id,stripe_subscription_id,status&owner_id=eq.${encodeURIComponent(ownerId)}`,
  );
  const record = records[0];
  if (!record?.stripe_subscription_id) throw new Error("Assinatura não encontrada");

  const { subscription, invoice, paymentIntentId } = await getLatestInvoicePayment(
    env,
    record.stripe_subscription_id,
  );
  if (invoice?.status !== "paid" || !paymentIntentId || !invoice.amount_paid) {
    throw new Error("A assinatura não possui uma última fatura paga reembolsável");
  }

  const refund = await stripeAdminRequest(env, "/refunds", {
    method: "POST",
    idempotencyKey: `shackmenu-refund-${invoice.id}`,
    parameters: {
      payment_intent: paymentIntentId,
      reason: "requested_by_customer",
      "metadata[owner_id]": ownerId,
      "metadata[invoice_id]": invoice.id,
    },
  });

  const canceledSubscription = subscription.status === "canceled"
    ? subscription
    : await stripeAdminRequest(env, `/subscriptions/${record.stripe_subscription_id}`, {
      method: "DELETE",
    });
  await syncSubscription(canceledSubscription, env);

  await supabaseAdminRequest(env, "rest/v1/admin_refunds?on_conflict=stripe_refund_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      owner_id: ownerId,
      admin_user_id: adminUserId,
      stripe_refund_id: refund.id,
      stripe_payment_intent_id: paymentIntentId,
      stripe_invoice_id: invoice.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status,
    }),
  });

  return {
    refundId: refund.id,
    refundStatus: refund.status,
    amount: refund.amount,
    currency: refund.currency,
    subscriptionStatus: canceledSubscription.status,
  };
}

export function adminError(error) {
  console.error("Admin operation failed", error);
  const expected = [
    "Assinatura não encontrada",
    "A assinatura não possui uma última fatura paga reembolsável",
  ];
  return expected.includes(error.message)
    ? { status: 400, message: error.message }
    : { status: 500, message: "Não foi possível concluir a operação administrativa." };
}
