import { supabaseAdminRequest } from "./supabase.js";

function getMercadoPagoToken(env) {
  const testMode = isMercadoPagoTestMode(env);
  const token = testMode
    ? env.MP_TOKEN
      || env.MERCADO_PAGO_ACCESS_TOKEN
      || env.MERCADOPAGO_ACCESS_TOKEN
      || env.MP_TOKEN_PROD
      || env.MERCADO_PAGO_ACCESS_TOKEN_PROD
      || env.MERCADOPAGO_ACCESS_TOKEN_PROD
    : env.MP_TOKEN_PROD
      || env.MERCADO_PAGO_ACCESS_TOKEN_PROD
      || env.MERCADOPAGO_ACCESS_TOKEN_PROD
      || env.MP_TOKEN
      || env.MERCADO_PAGO_ACCESS_TOKEN
      || env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Mercado Pago não está configurado.");
  return token;
}

export function isMercadoPagoTestMode(env) {
  return String(env.MP_CHECKOUT_TEST_MODE || env.MP_USE_TEST_KEYS || "").toLowerCase() === "true";
}

function getMercadoPagoClientId(env) {
  const clientId = env.MP_CLIENT_ID || env.MERCADO_PAGO_CLIENT_ID || env.MERCADOPAGO_CLIENT_ID;
  if (!clientId) throw new Error("MP_CLIENT_ID não está configurado.");
  return clientId;
}

function getMercadoPagoClientSecret(env) {
  const clientSecret = env.MP_CLIENT_SECRET
    || env.MERCADO_PAGO_CLIENT_SECRET
    || env.MERCADOPAGO_CLIENT_SECRET;
  if (!clientSecret) throw new Error("MP_CLIENT_SECRET não está configurado.");
  return clientSecret;
}

export function hasMercadoPago(env) {
  return Boolean(
    env.MP_TOKEN_PROD
      || env.MERCADO_PAGO_ACCESS_TOKEN_PROD
      || env.MERCADOPAGO_ACCESS_TOKEN_PROD
      || env.MP_TOKEN
      || env.MERCADO_PAGO_ACCESS_TOKEN
      || env.MERCADOPAGO_ACCESS_TOKEN,
  );
}

async function mercadoPagoRequest(env, path, { method = "GET", body, accessToken } = {}) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken || getMercadoPagoToken(env)}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Mercado Pago request failed (${response.status})`);
  }
  return data;
}

async function mercadoPagoFormRequest(env, path, body) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Mercado Pago request failed (${response.status})`);
  }
  return data;
}

export async function saveMercadoPagoOauthError(env, { state, error }) {
  let ownerId = null;
  let restaurantId = null;
  if (state) {
    try {
      const rows = await supabaseAdminRequest(
        env,
        `rest/v1/mercado_pago_oauth_states?select=owner_id,restaurant_id&state=eq.${encodeURIComponent(state)}&limit=1`,
      );
      ownerId = rows[0]?.owner_id || null;
      restaurantId = rows[0]?.restaurant_id || null;
    } catch (lookupError) {
      console.error("Could not lookup Mercado Pago OAuth state for error logging", lookupError);
    }
  }
  await supabaseAdminRequest(env, "rest/v1/mercado_pago_oauth_errors", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      state,
      owner_id: ownerId,
      restaurant_id: restaurantId,
      error_message: error?.message || String(error || "Erro desconhecido"),
      error_stack: error?.stack || null,
    }),
  });
}

function centsToAmount(cents) {
  return Number((cents / 100).toFixed(2));
}

function base64UrlEncode(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function createPkceChallenge() {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const verifier = base64UrlEncode(randomBytes);
  const digest = new Uint8Array(await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  ));
  return {
    verifier,
    challenge: base64UrlEncode(digest),
  };
}

function getMercadoPagoRedirectUri(env, origin) {
  const baseUrl = env.PUBLIC_APP_URL || "https://shackmenu.com";
  return `${baseUrl}/api/mercadopago/callback`;
}

function toIsoExpiry(expiresInSeconds) {
  const seconds = Number(expiresInSeconds || 0);
  return seconds > 0 ? new Date(Date.now() + seconds * 1000).toISOString() : null;
}

async function saveMercadoPagoAccount(env, restaurantId, ownerId, credentials) {
  const rows = await supabaseAdminRequest(env, "rest/v1/restaurant_mercado_pago_accounts?on_conflict=restaurant_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      restaurant_id: restaurantId,
      owner_id: ownerId,
      mercado_pago_user_id: credentials.user_id ? String(credentials.user_id) : null,
      public_key: credentials.public_key || null,
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || null,
      token_type: credentials.token_type || null,
      scope: credentials.scope || null,
      status: "active",
      expires_at: toIsoExpiry(credentials.expires_in),
      last_synced_at: new Date().toISOString(),
    }),
  });
  return rows[0];
}

export async function getMercadoPagoAccount(env, restaurantId) {
  const rows = await supabaseAdminRequest(
    env,
    `rest/v1/restaurant_mercado_pago_accounts?select=*&restaurant_id=eq.${encodeURIComponent(restaurantId)}&limit=1`,
  );
  return rows[0] || null;
}

export async function getOwnerMercadoPagoAccount(env, ownerId) {
  const rows = await supabaseAdminRequest(
    env,
    `rest/v1/restaurant_mercado_pago_accounts?select=restaurant_id,owner_id,mercado_pago_user_id,status,expires_at,last_synced_at&owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`,
  );
  return rows[0] || null;
}

async function getValidMercadoPagoAccount(env, restaurantId) {
  const account = await getMercadoPagoAccount(env, restaurantId);
  if (!account || account.status !== "active") throw new Error("Mercado Pago não conectado.");
  if (!account.expires_at || new Date(account.expires_at).getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    return account;
  }
  if (!account.refresh_token) throw new Error("Conexão Mercado Pago expirada.");
  const credentials = await mercadoPagoFormRequest(env, "/oauth/token", {
    client_id: getMercadoPagoClientId(env),
    client_secret: getMercadoPagoClientSecret(env),
    grant_type: "refresh_token",
    refresh_token: account.refresh_token,
  });
  return saveMercadoPagoAccount(env, account.restaurant_id, account.owner_id, credentials);
}

export async function createMercadoPagoOnboardingUrl(env, user, restaurant, origin) {
  const state = crypto.randomUUID();
  const pkce = await createPkceChallenge();
  await supabaseAdminRequest(env, "rest/v1/mercado_pago_oauth_states", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      state,
      owner_id: user.id,
      restaurant_id: restaurant.id,
      code_verifier: pkce.verifier,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    }),
  });

  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", getMercadoPagoClientId(env));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", getMercadoPagoRedirectUri(env, origin));
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function completeMercadoPagoOnboarding(env, { code, state, origin }) {
  const states = await supabaseAdminRequest(
    env,
    `rest/v1/mercado_pago_oauth_states?select=*&state=eq.${encodeURIComponent(state)}&limit=1`,
  );
  const record = states[0];
  if (!record || record.used_at || new Date(record.expires_at).getTime() < Date.now()) {
    throw new Error("Estado OAuth inválido ou expirado.");
  }

  const tokenBody = {
    client_id: getMercadoPagoClientId(env),
    client_secret: getMercadoPagoClientSecret(env),
    code,
    grant_type: "authorization_code",
    redirect_uri: getMercadoPagoRedirectUri(env, origin),
  };
  if (record.code_verifier) tokenBody.code_verifier = record.code_verifier;
  if (env.MP_OAUTH_TEST_TOKEN === "true") tokenBody.test_token = "true";

  const credentials = await mercadoPagoFormRequest(env, "/oauth/token", tokenBody);

  const account = await saveMercadoPagoAccount(env, record.restaurant_id, record.owner_id, credentials);
  await supabaseAdminRequest(
    env,
    `rest/v1/mercado_pago_oauth_states?state=eq.${encodeURIComponent(state)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ used_at: new Date().toISOString() }),
    },
  );
  return account;
}

export function publicMercadoPagoStatus(account) {
  if (!account) {
    return {
      status: "not_started",
      label: "Mercado Pago não conectado",
      chargesEnabled: false,
      payoutsEnabled: false,
      onboardingRequired: true,
      provider: "mercado_pago",
    };
  }
  const active = account.status === "active";
  return {
    status: active ? "active" : account.status,
    label: active ? "Mercado Pago conectado" : "Mercado Pago precisa de atenção",
    chargesEnabled: active,
    payoutsEnabled: active,
    onboardingRequired: !active,
    provider: "mercado_pago",
  };
}

export async function createMercadoPagoPreference(env, { order, restaurant, items, customerEmail, origin, returnUrl }) {
  const testMode = isMercadoPagoTestMode(env);
  const account = testMode ? null : await getValidMercadoPagoAccount(env, restaurant.id);
  const baseUrl = env.PUBLIC_APP_URL || origin;
  const backUrl = new URL(returnUrl || `/m/${restaurant.slug}`, baseUrl);
  const successUrl = new URL(backUrl);
  successUrl.searchParams.set("order", "success");
  const failureUrl = new URL(backUrl);
  failureUrl.searchParams.set("order", "cancelled");
  const pendingUrl = new URL(backUrl);
  pendingUrl.searchParams.set("order", "pending");

  const preference = await mercadoPagoRequest(env, "/checkout/preferences", {
    method: "POST",
    accessToken: testMode ? getMercadoPagoToken(env) : account.access_token,
    body: {
      external_reference: order.id,
      statement_descriptor: "SHACK MENU",
      notification_url: `${baseUrl}/api/orders/mercadopago/webhook`,
      back_urls: {
        success: successUrl.toString(),
        failure: failureUrl.toString(),
        pending: pendingUrl.toString(),
      },
      auto_return: "approved",
      marketplace_fee: !testMode && order.platform_fee_cents > 0
        ? centsToAmount(order.platform_fee_cents)
        : undefined,
      payer: { email: customerEmail },
      items: items.map((item) => ({
        id: item.product_id,
        title: item.name,
        currency_id: "BRL",
        quantity: item.quantity,
        unit_price: centsToAmount(item.unit_amount_cents),
      })),
      metadata: {
        order_id: order.id,
        restaurant_id: restaurant.id,
        owner_id: restaurant.owner_id,
      },
    },
  });

  await supabaseAdminRequest(
    env,
    `rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        mercado_pago_preference_id: preference.id,
        payment_provider: "mercado_pago",
      }),
    },
  );

  return {
    id: preference.id,
    url: preference.init_point || preference.sandbox_init_point,
  };
}

export async function getMercadoPagoPayment(env, paymentId) {
  return mercadoPagoRequest(env, `/v1/payments/${encodeURIComponent(paymentId)}`);
}

export async function getMercadoPagoPaymentForOrder(env, paymentId) {
  try {
    return await getMercadoPagoPayment(env, paymentId);
  } catch (error) {
    console.error("Could not read Mercado Pago payment with platform token", error);
  }

  const accounts = await supabaseAdminRequest(
    env,
    "rest/v1/restaurant_mercado_pago_accounts?select=access_token&status=eq.active&order=last_synced_at.desc&limit=100",
  );
  for (const account of accounts) {
    try {
      return await mercadoPagoRequest(env, `/v1/payments/${encodeURIComponent(paymentId)}`, {
        accessToken: account.access_token,
      });
    } catch {
      // Try the next seller token; Mercado Pago webhooks do not always include enough data to map first.
    }
  }
  throw new Error("Pagamento Mercado Pago não encontrado.");
}

export async function syncMercadoPagoPayment(env, payment) {
  const orderId = payment.external_reference || payment.metadata?.order_id;
  if (!orderId) return null;

  const status = payment.status === "approved"
    ? "payment_confirmed"
    : ["cancelled", "rejected"].includes(payment.status)
      ? "payment_failed"
      : "awaiting_payment";

  const rows = await supabaseAdminRequest(
    env,
    `rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        payment_provider: "mercado_pago",
        mercado_pago_payment_id: String(payment.id),
        paid_at: status === "payment_confirmed" ? new Date().toISOString() : null,
      }),
    },
  );
  return rows[0] || null;
}

export function mercadoPagoError(error) {
  console.error("Mercado Pago integration error", error);
  return { status: 500, message: "Não foi possível comunicar com o Mercado Pago." };
}
