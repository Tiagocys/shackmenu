const hostnamePattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

function configuration(env) {
  const token = env.CLOUDFLARE_API_TOKEN;
  const zoneId = env.CLOUDFLARE_SAAS_ZONE_ID;
  const cnameTarget = env.CLOUDFLARE_SAAS_CNAME_TARGET || "proxy-fallback.shackmenu.com";
  if (!token || !zoneId) throw new Error("CLOUDFLARE_SAAS_NOT_CONFIGURED");
  return { token, zoneId, cnameTarget };
}

function normalizeRequestedDomain(value) {
  const domain = String(value || "").trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (!domain || domain.includes("/") || domain.includes(":") || !hostnamePattern.test(domain)) {
    throw new Error("INVALID_CUSTOM_DOMAIN");
  }
  return domain.startsWith("menu.") ? domain : `menu.${domain}`;
}

async function cloudflareRequest(env, path, options = {}) {
  const { token, zoneId } = configuration(env);
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    const message = payload.errors?.[0]?.message || "Cloudflare request failed";
    throw new Error(`CLOUDFLARE_ERROR:${message}`);
  }
  return payload.result;
}

async function adminRequest(env, path, options = {}) {
  const baseUrl = env.SUPABASE_URL || env.project_url;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;
  if (!baseUrl || !key) throw new Error("SUPABASE_ADMIN_NOT_CONFIGURED");
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`SUPABASE_ADMIN_ERROR:${response.status}:${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
}

async function getAccount(env, ownerId) {
  const [restaurants, subscriptions] = await Promise.all([
    adminRequest(env, `restaurants?select=id,custom_domain,custom_domain_status,cloudflare_custom_hostname_id&owner_id=eq.${ownerId}`),
    adminRequest(env, `subscriptions?select=status&owner_id=eq.${ownerId}`),
  ]);
  const restaurant = restaurants[0];
  if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");
  const isPro = ["active", "trialing"].includes(subscriptions[0]?.status);
  return { restaurant, isPro };
}

function domainResult(restaurant, cnameTarget, cloudflareHostname) {
  const hostnameStatus = cloudflareHostname?.status || restaurant.custom_domain_status;
  const sslStatus = cloudflareHostname?.ssl?.status || null;
  const active = hostnameStatus === "active" && sslStatus === "active";
  return {
    domain: restaurant.custom_domain,
    status: active ? "active" : hostnameStatus || "pending",
    sslStatus,
    cname: restaurant.custom_domain ? {
      name: restaurant.custom_domain,
      target: cnameTarget,
    } : null,
  };
}

async function saveRestaurantDomain(env, restaurantId, values) {
  const [restaurant] = await adminRequest(env, `restaurants?id=eq.${restaurantId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(values),
  });
  return restaurant;
}

export async function connectCustomDomain(env, ownerId, requestedDomain) {
  const { cnameTarget } = configuration(env);
  const { restaurant, isPro } = await getAccount(env, ownerId);
  if (!isPro) throw new Error("CUSTOM_DOMAIN_REQUIRES_PRO");

  if (!requestedDomain) {
    if (restaurant.cloudflare_custom_hostname_id) {
      await cloudflareRequest(env, `/custom_hostnames/${restaurant.cloudflare_custom_hostname_id}`, { method: "DELETE" });
    }
    const disconnected = await saveRestaurantDomain(env, restaurant.id, {
      custom_domain: null,
      custom_domain_status: null,
      cloudflare_custom_hostname_id: null,
    });
    return domainResult(disconnected, cnameTarget);
  }

  const hostname = normalizeRequestedDomain(requestedDomain);
  if (restaurant.custom_domain === hostname && restaurant.cloudflare_custom_hostname_id) {
    return refreshCustomDomain(env, ownerId);
  }

  const created = await cloudflareRequest(env, "/custom_hostnames", {
    method: "POST",
    body: JSON.stringify({ hostname, ssl: { method: "http", type: "dv" } }),
  });

  try {
    const saved = await saveRestaurantDomain(env, restaurant.id, {
      custom_domain: hostname,
      custom_domain_status: "pending",
      cloudflare_custom_hostname_id: created.id,
    });
    if (restaurant.cloudflare_custom_hostname_id) {
      await cloudflareRequest(env, `/custom_hostnames/${restaurant.cloudflare_custom_hostname_id}`, { method: "DELETE" });
    }
    return domainResult(saved, cnameTarget, created);
  } catch (error) {
    await cloudflareRequest(env, `/custom_hostnames/${created.id}`, { method: "DELETE" }).catch(() => {});
    throw error;
  }
}

export async function refreshCustomDomain(env, ownerId) {
  const { cnameTarget } = configuration(env);
  const { restaurant, isPro } = await getAccount(env, ownerId);
  if (!isPro) throw new Error("CUSTOM_DOMAIN_REQUIRES_PRO");
  if (!restaurant.cloudflare_custom_hostname_id) return domainResult(restaurant, cnameTarget);

  let hostname = await cloudflareRequest(env, `/custom_hostnames/${restaurant.cloudflare_custom_hostname_id}`);
  if (hostname.status !== "active" || hostname.ssl?.status !== "active") {
    hostname = await cloudflareRequest(env, `/custom_hostnames/${restaurant.cloudflare_custom_hostname_id}`, {
      method: "PATCH",
      body: JSON.stringify({ ssl: { method: "http", type: "dv" } }),
    });
  }
  const active = hostname.status === "active" && hostname.ssl?.status === "active";
  const saved = await saveRestaurantDomain(env, restaurant.id, {
    custom_domain_status: active ? "active" : hostname.status || "pending",
  });
  return domainResult(saved, cnameTarget, hostname);
}

export function customDomainError(error) {
  const code = error.message || "";
  if (code === "INVALID_CUSTOM_DOMAIN") return { status: 400, message: "Informe um domínio válido." };
  if (code === "CUSTOM_DOMAIN_REQUIRES_PRO") return { status: 403, message: "O domínio próprio está disponível apenas no plano Pro." };
  if (code === "RESTAURANT_NOT_FOUND") return { status: 404, message: "Loja não encontrada." };
  if (code.includes("already exists") || code.includes("already been claimed")) {
    return { status: 409, message: "Este domínio já está conectado a outro serviço ou loja." };
  }
  if (code === "CLOUDFLARE_SAAS_NOT_CONFIGURED") return { status: 503, message: "A integração de domínios ainda não está configurada." };
  console.error("Custom domain integration error", error);
  return { status: 500, message: "Não foi possível configurar o domínio." };
}
