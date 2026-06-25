import { json } from "./http.js";

export const stripeApiVersion = "2026-05-27.dahlia";

export function getStripeSecret(env, { priceId, testMode = false } = {}) {
  if (testMode || (priceId && priceId === env.STRIPE_PRO_PRICE_ID_TEST)) {
    return env.STRIPE_SECRET_TEST || env.STRIPE_SECRET;
  }
  if (priceId && priceId === env.STRIPE_PRO_PRICE_ID) {
    return env.STRIPE_SECRET_LIVE || env.STRIPE_SECRET;
  }
  return env.STRIPE_SECRET || env.STRIPE_SECRET_LIVE || env.STRIPE_SECRET_TEST;
}

export async function stripeRequest(env, path, parameters, options = {}) {
  const secret = getStripeSecret(env, options);
  if (!secret) throw new Error("STRIPE_SECRET is not configured");

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: parameters ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Stripe-Version": stripeApiVersion,
    },
    body: parameters ? new URLSearchParams(parameters) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Stripe request failed");
  return data;
}

export async function stripeJsonRequest(env, path, body, options = {}) {
  const secret = env.STRIPE_SECRET;
  if (!secret) throw new Error("STRIPE_SECRET is not configured");

  const response = await fetch(`https://api.stripe.com${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Stripe-Version": options.apiVersion || "2026-05-27.preview",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Stripe request failed");
  return data;
}

export async function getUserSubscription(request, env, ownerId) {
  const supabaseUrl = env.SUPABASE_URL || env.project_url;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const response = await fetch(
    `${supabaseUrl}/rest/v1/subscriptions?select=stripe_customer_id,stripe_subscription_id,stripe_price_id,status,cancel_at_period_end&owner_id=eq.${ownerId}`,
    {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!response.ok) throw new Error("Could not read subscription");
  return (await response.json())[0] || null;
}

function hexToBytes(value) {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null;
  return Uint8Array.from(value.match(/.{2}/g), (byte) => Number.parseInt(byte, 16));
}

function timingSafeEqual(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function verifyStripeWebhook(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  ));
  return signatures.some((signature) => timingSafeEqual(digest, hexToBytes(signature)));
}

export async function syncSubscription(subscription, env) {
  const ownerId = subscription.metadata?.owner_id;
  if (!ownerId) throw new Error("Subscription owner metadata is missing");

  const periodEnd = subscription.current_period_end
    || subscription.items?.data?.[0]?.current_period_end;
  const record = {
    owner_id: ownerId,
    stripe_customer_id: typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: subscription.items?.data?.[0]?.price?.id || null,
    status: subscription.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
  };

  const supabaseUrl = env.SUPABASE_URL || env.project_url;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

  const response = await fetch(`${supabaseUrl}/rest/v1/subscriptions?on_conflict=owner_id`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(record),
  });
  if (!response.ok) throw new Error(`Could not sync subscription (${response.status})`);
}

export function stripeError(error) {
  console.error("Stripe integration error", error);
  return json({ error: "Não foi possível comunicar com a Stripe." }, 500);
}
