import { createMercadoPagoFullRefund, createMercadoPagoPreference } from "./mercadopago.js";
import { stripeRequest } from "./stripe.js";
import { supabaseAdminRequest } from "./supabase.js";
import { validateRestaurantDeliveryAddress } from "./delivery.js";

function sanitizeLine(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return normalized.length >= 10 && normalized.length <= 15 ? `+${normalized}` : null;
}

function normalizeCpf(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 11 ? digits : null;
}

function getOrderReturnUrl(returnUrl, fallbackOrigin, slug, status) {
  const url = new URL(returnUrl || `/m/${slug}`, fallbackOrigin);
  url.searchParams.set("order", status);
  return url.toString();
}

async function getPublicRestaurantForOrder(env, restaurantId) {
  const records = await supabaseAdminRequest(
    env,
    `rest/v1/restaurants?select=id,owner_id,name,slug,published_at,whatsapp_number,delivery_fee_cents&published_at=not.is.null&id=eq.${encodeURIComponent(restaurantId)}&limit=1`,
  );
  return records[0] || null;
}

async function getActiveProducts(env, restaurantId, ids) {
  const uniqueIds = [...new Set(ids)];
  if (!uniqueIds.length) return [];
  return supabaseAdminRequest(
    env,
    `rest/v1/products?select=id,name,price_cents&active=eq.true&restaurant_id=eq.${encodeURIComponent(restaurantId)}&id=in.(${uniqueIds.map(encodeURIComponent).join(",")})`,
  );
}

async function getActivePaymentSettings(env, restaurantId) {
  const records = await supabaseAdminRequest(
    env,
    `rest/v1/restaurant_payment_settings?select=*&restaurant_id=eq.${encodeURIComponent(restaurantId)}&stripe_account_status=eq.active&charges_enabled=eq.true&limit=1`,
  );
  return records[0] || null;
}

async function createOrderRecord(env, body) {
  const restaurantId = sanitizeLine(body.restaurantId, 80);
  const restaurant = await getPublicRestaurantForOrder(env, restaurantId);
  if (!restaurant) throw new Error("Cardápio não encontrado.");

  const requestedItems = Array.isArray(body.items) ? body.items : [];
  if (!requestedItems.length || requestedItems.length > 50) throw new Error("Pedido vazio.");

  const productIds = requestedItems.map((item) => sanitizeLine(item.productId, 80)).filter(Boolean);
  const products = await getActiveProducts(env, restaurant.id, productIds);
  const productsById = new Map(products.map((product) => [product.id, product]));

  const items = requestedItems.flatMap((item) => {
    const product = productsById.get(sanitizeLine(item.productId, 80));
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return [];
    return [{
      product_id: product.id,
      name: product.name,
      unit_amount_cents: product.price_cents,
      quantity,
      subtotal_cents: product.price_cents * quantity,
    }];
  });
  if (!items.length) throw new Error("Nenhum produto válido encontrado.");

  const subtotal = items.reduce((total, item) => total + item.subtotal_cents, 0);
  const deliveryFee = Math.max(0, Number(restaurant.delivery_fee_cents || 0));
  const payableTotal = subtotal + deliveryFee;
  const customerName = sanitizeLine(body.customerName, 100);
  const customerEmail = sanitizeLine(body.customerEmail, 120).toLowerCase();
  if (customerName.length < 2) throw new Error("Informe o nome para o pedido.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customerEmail)) throw new Error("Informe um e-mail válido.");
  const deliveryAddress = await validateRestaurantDeliveryAddress(env, restaurant.id, {
    cep: body.deliveryCep,
    complement: body.deliveryComplement,
  });

  const feePercent = 0;
  const platformFee = Math.round((payableTotal * feePercent) / 100);

  const orderRows = await supabaseAdminRequest(env, "rest/v1/orders", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      restaurant_id: restaurant.id,
      owner_id: restaurant.owner_id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: normalizePhone(body.customerPhone),
      delivery_cep: deliveryAddress.cep,
      delivery_city: deliveryAddress.city,
      delivery_state: deliveryAddress.state,
      delivery_address: deliveryAddress.address,
      delivery_neighborhood: deliveryAddress.neighborhood,
      delivery_complement: deliveryAddress.complement,
      delivery_fee_cents: deliveryFee,
      notes: sanitizeLine(body.notes, 500) || null,
      items,
      subtotal_cents: subtotal,
      platform_fee_cents: platformFee,
      platform_fee_percent: feePercent,
      payment_provider: body.paymentProvider || "mercado_pago",
    }),
  });
  const order = orderRows[0];
  return {
    restaurant,
    items,
    order,
    customerName,
    customerEmail,
    customerPhone: body.customerPhone,
    customerDocument: normalizeCpf(body.customerDocument),
    subtotal,
    deliveryFee,
    platformFee,
  };
}

export async function createMercadoPagoOrderCheckoutSession(env, body, origin) {
  const {
    restaurant,
    items,
    order,
    customerName,
    customerEmail,
    customerPhone,
    customerDocument,
  } = await createOrderRecord(env, {
    ...body,
    paymentProvider: "mercado_pago",
  });
  const preference = await createMercadoPagoPreference(env, {
    order,
    restaurant,
    items,
    customerName,
    customerEmail,
    customerPhone,
    customerDocument,
    origin,
    returnUrl: body.returnUrl,
  });
  return {
    url: preference.url,
    orderId: order.id,
    orderNumber: order.order_number,
    provider: "mercado_pago",
  };
}

export async function createOrderCheckoutSession(env, body, origin) {
  const { restaurant, items, order, customerEmail, platformFee, deliveryFee } = await createOrderRecord(env, {
    ...body,
    paymentProvider: "stripe",
  });

  const settings = await getActivePaymentSettings(env, restaurant.id);
  if (!settings?.stripe_account_id) {
    throw new Error("Esta loja ainda não liberou pagamento online.");
  }

  await supabaseAdminRequest(
    env,
    `rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        stripe_connected_account_id: settings.stripe_account_id,
        payment_provider: "stripe",
      }),
    },
  );

  const parameters = {
    mode: "payment",
    locale: "pt-BR",
    customer_email: customerEmail,
    client_reference_id: order.id,
    success_url: getOrderReturnUrl(body.returnUrl, origin, restaurant.slug, "success"),
    cancel_url: getOrderReturnUrl(body.returnUrl, origin, restaurant.slug, "cancelled"),
    "metadata[order_id]": order.id,
    "metadata[restaurant_id]": restaurant.id,
    "metadata[owner_id]": restaurant.owner_id,
    "payment_intent_data[transfer_data][destination]": settings.stripe_account_id,
    "payment_intent_data[metadata][order_id]": order.id,
  };
  if (platformFee > 0) parameters["payment_intent_data[application_fee_amount]"] = String(platformFee);

  items.forEach((item, index) => {
    parameters[`line_items[${index}][quantity]`] = String(item.quantity);
    parameters[`line_items[${index}][price_data][currency]`] = "brl";
    parameters[`line_items[${index}][price_data][unit_amount]`] = String(item.unit_amount_cents);
    parameters[`line_items[${index}][price_data][product_data][name]`] = item.name;
  });
  if (deliveryFee > 0) {
    const index = items.length;
    parameters[`line_items[${index}][quantity]`] = "1";
    parameters[`line_items[${index}][price_data][currency]`] = "brl";
    parameters[`line_items[${index}][price_data][unit_amount]`] = String(deliveryFee);
    parameters[`line_items[${index}][price_data][product_data][name]`] = "Taxa de entrega";
  }

  const session = await stripeRequest(env, "/checkout/sessions", parameters);
  await supabaseAdminRequest(
    env,
    `rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ stripe_checkout_session_id: session.id }),
    },
  );
  return { url: session.url, orderId: order.id, provider: "stripe" };
}

export async function markOrderPaymentConfirmed(env, session) {
  const orderId = session.metadata?.order_id || session.client_reference_id;
  if (!orderId) return null;
  const rows = await supabaseAdminRequest(
    env,
    `rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "payment_confirmed",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id,
        paid_at: new Date().toISOString(),
      }),
    },
  );
  return rows[0] || null;
}

export async function markOrderPaymentFailed(env, session) {
  const orderId = session.metadata?.order_id || session.client_reference_id;
  if (!orderId) return null;
  await supabaseAdminRequest(
    env,
    `rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "payment_failed",
        stripe_checkout_session_id: session.id,
      }),
    },
  );
  return true;
}

export async function listOwnerOrders(env, ownerId) {
  return supabaseAdminRequest(
    env,
    `rest/v1/orders?select=id,order_number,status,payment_provider,customer_name,customer_email,customer_phone,delivery_cep,delivery_city,delivery_state,delivery_address,delivery_neighborhood,delivery_complement,delivery_fee_cents,notes,items,subtotal_cents,platform_fee_cents,platform_fee_percent,currency,paid_at,created_at,mercado_pago_payment_id,mercado_pago_refund_id,mercado_pago_refund_status,refunded_at&owner_id=eq.${encodeURIComponent(ownerId)}&order=created_at.desc&limit=50`,
  );
}

export async function refundMercadoPagoOrder(env, ownerId, orderId) {
  const id = sanitizeLine(orderId, 80);
  if (!id) throw new Error("Pedido não informado.");

  const rows = await supabaseAdminRequest(
    env,
    `rest/v1/orders?select=id,owner_id,restaurant_id,order_number,status,payment_provider,mercado_pago_payment_id,mercado_pago_refund_id&owner_id=eq.${encodeURIComponent(ownerId)}&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  const order = rows[0];
  if (!order) {
    const error = new Error("Pedido não encontrado.");
    error.status = 404;
    throw error;
  }
  if (order.status !== "payment_confirmed") {
    throw new Error("Apenas pedidos pagos podem ser reembolsados.");
  }
  if (order.payment_provider !== "mercado_pago" || !order.mercado_pago_payment_id) {
    throw new Error("Este pedido não possui pagamento Mercado Pago para reembolso.");
  }
  if (order.mercado_pago_refund_id) {
    throw new Error("Este pedido já foi reembolsado.");
  }

  let refund;
  try {
    refund = await createMercadoPagoFullRefund(env, order);
  } catch (error) {
    const message = error.status === 404
      ? "Pagamento Mercado Pago não encontrado com as credenciais atuais. Esse pedido pode ter sido criado com chaves antigas ou outra conta Mercado Pago."
      : error.message || "Não foi possível reembolsar este pedido no Mercado Pago.";
    const refundError = new Error(message);
    refundError.status = error.status || 400;
    throw refundError;
  }
  const updateRows = await supabaseAdminRequest(
    env,
    `rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "refunded",
        mercado_pago_refund_id: refund.id ? String(refund.id) : null,
        mercado_pago_refund_status: refund.status || "approved",
        refunded_at: new Date().toISOString(),
      }),
    },
  );
  return updateRows[0] || null;
}

export async function getOrderNotificationDetails(env, orderId) {
  const orders = await supabaseAdminRequest(
    env,
    `rest/v1/orders?select=id,order_number,status,customer_name,customer_email,customer_phone,delivery_cep,delivery_city,delivery_state,delivery_address,delivery_neighborhood,delivery_complement,delivery_fee_cents,notes,items,subtotal_cents,platform_fee_cents,platform_fee_percent,created_at,restaurants(name,logo_key,background_color,contact_email,whatsapp_number,instagram_username)&id=eq.${encodeURIComponent(orderId)}&limit=1`,
  );
  const order = orders[0];
  if (!order) throw new Error("Pedido não encontrado para notificação.");
  const restaurant = order.restaurants || {};
  return {
    ...order,
    restaurant_name: restaurant.name,
    logo_key: restaurant.logo_key,
    background_color: restaurant.background_color,
    contact_email: restaurant.contact_email,
    whatsapp_number: restaurant.whatsapp_number,
    instagram_username: restaurant.instagram_username,
  };
}
