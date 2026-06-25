import { stripeJsonRequest } from "./stripe.js";
import { supabaseAdminRequest } from "./supabase.js";

export const connectStatusLabels = {
  not_started: "Não iniciado",
  pending: "Onboarding pendente",
  active: "Pagamentos ativos",
  restricted: "Ação necessária",
};

function getMerchantCapability(account) {
  return account.configuration?.merchant?.capabilities || {};
}

export function parseStripeAccountStatus(account) {
  const capabilities = getMerchantCapability(account);
  const cardPayments = capabilities.card_payments?.status;
  const payouts = capabilities.stripe_balance?.payouts?.status;
  const active = cardPayments === "active" && payouts === "active";
  const restricted = [cardPayments, payouts].some((status) => status && !["active", "pending"].includes(status));
  return {
    status: active ? "active" : restricted ? "restricted" : "pending",
    chargesEnabled: cardPayments === "active",
    payoutsEnabled: payouts === "active",
    onboardingRequired: !active,
  };
}

export async function getOwnerRestaurant(env, ownerId) {
  const restaurants = await supabaseAdminRequest(
    env,
    `rest/v1/restaurants?select=id,owner_id,name,slug,whatsapp_number,delivery_fee_cents&owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`,
  );
  return restaurants[0] || null;
}

export async function getPaymentSettings(env, restaurantId) {
  const records = await supabaseAdminRequest(
    env,
    `rest/v1/restaurant_payment_settings?select=*&restaurant_id=eq.${encodeURIComponent(restaurantId)}&limit=1`,
  );
  return records[0] || null;
}

export async function upsertPaymentSettings(env, record) {
  const rows = await supabaseAdminRequest(env, "rest/v1/restaurant_payment_settings?on_conflict=restaurant_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(record),
  });
  return rows[0];
}

export async function retrieveStripeConnectAccount(env, accountId) {
  const query = new URLSearchParams([
    ["include[]", "configuration.merchant"],
    ["include[]", "defaults"],
    ["include[]", "identity"],
  ]);
  return stripeJsonRequest(env, `/v2/core/accounts/${accountId}?${query.toString()}`, null);
}

export async function syncPaymentSettingsFromStripe(env, settings) {
  if (!settings?.stripe_account_id) return settings;
  const account = await retrieveStripeConnectAccount(env, settings.stripe_account_id);
  const status = parseStripeAccountStatus(account);
  return upsertPaymentSettings(env, {
    restaurant_id: settings.restaurant_id,
    owner_id: settings.owner_id,
    stripe_account_id: settings.stripe_account_id,
    stripe_account_status: status.status,
    charges_enabled: status.chargesEnabled,
    payouts_enabled: status.payoutsEnabled,
    onboarding_required: status.onboardingRequired,
    last_synced_at: new Date().toISOString(),
  });
}

export async function ensureStripeConnectAccount(env, user, restaurant) {
  const current = await getPaymentSettings(env, restaurant.id);
  if (current?.stripe_account_id) return current;

  const account = await stripeJsonRequest(env, "/v2/core/accounts", {
    contact_email: user.email,
    display_name: restaurant.name,
    identity: {
      country: "br",
      entity_type: "company",
      business_details: { registered_name: restaurant.name },
    },
    configuration: {
      merchant: {
        capabilities: {
          card_payments: { requested: true },
        },
      },
    },
    defaults: {
      currency: "brl",
      locales: ["pt-BR"],
      responsibilities: {
        fees_collector: "stripe",
        losses_collector: "stripe",
      },
    },
    dashboard: "full",
    include: ["configuration.merchant", "defaults", "identity"],
  });
  const status = parseStripeAccountStatus(account);
  return upsertPaymentSettings(env, {
    restaurant_id: restaurant.id,
    owner_id: restaurant.owner_id,
    stripe_account_id: account.id,
    stripe_account_status: status.status,
    charges_enabled: status.chargesEnabled,
    payouts_enabled: status.payoutsEnabled,
    onboarding_required: status.onboardingRequired,
    last_synced_at: new Date().toISOString(),
  });
}

export async function createStripeOnboardingLink(env, accountId, origin) {
  const returnUrl = `${origin}/?connect=return`;
  const refreshUrl = `${origin}/?connect=refresh`;
  return stripeJsonRequest(env, "/v2/core/account_links", {
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["merchant"],
        collection_options: {
          fields: "eventually_due",
          future_requirements: "include",
        },
        return_url: returnUrl,
        refresh_url: refreshUrl,
      },
    },
  });
}

export function publicPaymentSettings(settings) {
  const status = settings?.stripe_account_status || "not_started";
  return {
    status,
    label: connectStatusLabels[status] || status,
    chargesEnabled: Boolean(settings?.charges_enabled),
    payoutsEnabled: Boolean(settings?.payouts_enabled),
    onboardingRequired: settings?.onboarding_required !== false,
  };
}
