const platformHosts = new Set([
  "shackmenu.com",
  "www.shackmenu.com",
  "app.shackmenu.com",
  "customers.shackmenu.com",
  "proxy-fallback.shackmenu.com",
  "shackmenu-axb.pages.dev",
]);

const defaultSeo = {
  title: "Shack Menu | Menu digital para vender online",
  description: "Crie um menu digital para sua loja em poucos minutos com pedidos online, pagamento via Mercado Pago, link personalizado e personalização visual.",
  image: "https://shackmenu.com/assets/logo/og.png",
  url: "https://shackmenu.com/",
};

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isPlatformHost(hostname) {
  return platformHosts.has(hostname) || hostname.endsWith(".pages.dev") || hostname === "localhost" || hostname === "127.0.0.1";
}

function publicRequestUrl(request) {
  const internalUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host")
    || request.headers.get("host")
    || internalUrl.host;
  const protocol = request.headers.get("x-forwarded-proto")
    || (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? internalUrl.protocol.replace(":", "") : "https");
  return new URL(`${internalUrl.pathname}${internalUrl.search}`, `${protocol}://${host}`);
}

function getMenuLookup(url) {
  const hostname = url.hostname.toLowerCase();
  const slugMatch = url.pathname.match(/^\/m\/([^/]+)\/?$/);
  if (slugMatch) return { slug: decodeURIComponent(slugMatch[1]) };
  if (!isPlatformHost(hostname) && url.pathname === "/") return { domain: hostname };
  return null;
}

function publicOrigin(url) {
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  return `${local ? url.protocol : "https:"}//${url.host}`;
}

function publicUrl(url) {
  const current = new URL(url.href.split("#")[0]);
  if (current.hostname !== "localhost" && current.hostname !== "127.0.0.1") current.protocol = "https:";
  return current.href;
}

async function fetchPublicMenu(env, lookup) {
  const supabaseUrl = env.SUPABASE_URL || env.project_url;
  const anonKey = env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const rpcName = lookup.domain ? "get_public_menu_by_domain" : "get_public_menu";
  const body = lookup.domain
    ? { menu_domain: lookup.domain }
    : { menu_slug: lookup.slug };

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error("Could not fetch menu SEO data", response.status, await response.text());
    return null;
  }

  return response.json();
}

function menuSeo(menu, requestUrl) {
  const restaurant = menu?.restaurant;
  if (!restaurant?.name) return null;

  const title = restaurant.name;
  const description = restaurant.menu_tagline
    || `${restaurant.name}: menu digital com produtos, pedidos online e informações de contato.`;
  const hasLogo = Boolean(restaurant.logo_key);
  const image = hasLogo
    ? `${publicOrigin(requestUrl)}/api/media?key=${encodeURIComponent(restaurant.logo_key)}`
    : defaultSeo.image;

  return {
    title,
    description,
    image,
    imageWidth: hasLogo ? 512 : 1200,
    imageHeight: hasLogo ? 512 : 630,
    url: publicUrl(requestUrl),
  };
}

function replaceOrInsertMeta(html, selector, replacement) {
  const match = html.match(selector);
  if (match) return html.replace(match[0], replacement);
  return html.replace("</head>", `  ${replacement}\n</head>`);
}

function injectSeo(html, seo) {
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const image = escapeHtml(seo.image);
  const imageWidth = escapeHtml(seo.imageWidth || 1200);
  const imageHeight = escapeHtml(seo.imageHeight || 630);
  const url = escapeHtml(seo.url);

  let next = html.replace(/<title>.*?<\/title>/s, `<title>${title}</title>`);
  next = replaceOrInsertMeta(next, /<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${description}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${description}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+property="og:image"[^>]*>/i, `<meta property="og:image" content="${image}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+property="og:image:width"[^>]*>/i, `<meta property="og:image:width" content="${imageWidth}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+property="og:image:height"[^>]*>/i, `<meta property="og:image:height" content="${imageHeight}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${url}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${title}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${description}" />`);
  next = replaceOrInsertMeta(next, /<meta\s+name="twitter:image"[^>]*>/i, `<meta name="twitter:image" content="${image}" />`);
  next = replaceOrInsertMeta(next, /<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}" />`);

  return next;
}

export async function onRequest(context) {
  if (context.request.method !== "GET") return context.next();

  const url = publicRequestUrl(context.request);
  const lookup = getMenuLookup(url);
  if (!lookup) return context.next();

  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const menu = await fetchPublicMenu(context.env, lookup);
  const seo = menuSeo(menu, url);
  if (!seo) return response;

  const html = await response.text();
  const headers = new Headers(response.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("cache-control", "public, max-age=60");

  return new Response(injectSeo(html, seo), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
