import "dotenv/config";

import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express from "express";
import {
  adminError,
  isAdmin,
  listAdminCustomers,
  refundAndCancel,
} from "../functions/_lib/admin.js";
import {
  connectCustomDomain,
  customDomainError,
  refreshCustomDomain,
} from "../functions/_lib/domains.js";
import {
  getOwnerRestaurant,
} from "../functions/_lib/connect.js";
import {
  getOwnerDeliveryCities,
  replaceOwnerDeliveryCities,
  validateCepForRestaurant,
} from "../functions/_lib/delivery.js";
import {
  createMercadoPagoOrderCheckoutSession,
  listOwnerOrders,
  markOrderPaymentConfirmed,
  markOrderPaymentFailed,
  refundMercadoPagoOrder,
} from "../functions/_lib/orders.js";
import {
  getMercadoPagoPaymentForOrder,
  completeMercadoPagoOnboarding,
  createMercadoPagoOnboardingUrl,
  getOwnerMercadoPagoAccount,
  publicMercadoPagoStatus,
  saveMercadoPagoOauthError,
  syncMercadoPagoPayment,
} from "../functions/_lib/mercadopago.js";
import {
  getUserSubscription,
  stripeRequest,
  syncSubscription,
  verifyStripeWebhook,
} from "../functions/_lib/stripe.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isDevelopment = process.env.NODE_ENV === "development";
const port = Number(process.env.PORT || (isDevelopment ? 8788 : 3000));

const supabaseUrl = process.env.SUPABASE_URL || process.env.project_url;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const r2Bucket = process.env.R2_BUCKET || "shackmenu";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials:
    process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
      : undefined,
});

app.use(express.json({
  limit: "1mb",
  verify: (request, _response, buffer) => {
    if (request.originalUrl === "/api/billing/webhook") request.rawBody = buffer.toString("utf8");
  },
}));

app.get("/api/config", (_request, response) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return response.status(503).json({
      error: "Configure SUPABASE_URL e SUPABASE_ANON_KEY no arquivo .env.",
    });
  }

  return response.json({
    supabaseUrl,
    supabaseAnonKey,
    appUrl: process.env.PUBLIC_APP_URL || `${_request.protocol}://${_request.get("host")}`,
    mercadoPagoTestMode: String(process.env.MP_CHECKOUT_TEST_MODE || process.env.MP_USE_TEST_KEYS || "").toLowerCase() === "true",
  });
});

async function authenticate(request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return response.status(401).json({ error: "Sessão inválida." });
  }

  try {
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!authResponse.ok) {
      return response.status(401).json({ error: "Sessão expirada. Entre novamente com o Google." });
    }

    const user = await authResponse.json();
    if (!user.id) {
      return response.status(401).json({ error: "Sessão inválida." });
    }

    request.user = user;
    return next();
  } catch (error) {
    console.error("Could not validate Supabase session", error);
    return response.status(503).json({
      error: "Não foi possível validar sua sessão com o Supabase. Tente novamente.",
    });
  }
}

function createImageUploadHandler(getKey) {
  return async (request, response) => {
    const contentType = request.get("content-type")?.split(";")[0];
    const size = request.body?.length || 0;
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (!allowedTypes.has(contentType)) {
      return response.status(400).json({ error: "Use uma imagem JPG, PNG ou WebP." });
    }

    if (!Number.isInteger(size) || size <= 0 || size > 5 * 1024 * 1024) {
      return response.status(400).json({ error: "A imagem deve ter no máximo 5 MB." });
    }

    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return response.status(503).json({ error: "As credenciais do Cloudflare R2 não estão configuradas." });
    }

    const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[contentType];
    const key = getKey(request.user.id, extension);

    try {
      await r2.send(new PutObjectCommand({
        Bucket: r2Bucket,
        Key: key,
        Body: request.body,
        ContentType: contentType,
        ContentLength: size,
      }));
      return response.json({ key });
    } catch (error) {
      console.error("Could not create R2 upload URL", error);
      return response.status(500).json({ error: "Não foi possível preparar o upload da imagem." });
    }
  };
}

const parseImage = express.raw({
  type: ["image/jpeg", "image/png", "image/webp"],
  limit: "5mb",
});

app.post(
  "/api/uploads/logo",
  authenticate,
  parseImage,
  createImageUploadHandler((userId, extension) =>
    `restaurants/${userId}/logo-${crypto.randomUUID()}.${extension}`),
);

app.post(
  "/api/uploads/product",
  authenticate,
  parseImage,
  createImageUploadHandler((userId, extension) =>
    `restaurants/${userId}/products/product-${crypto.randomUUID()}.${extension}`),
);

app.delete("/api/uploads", authenticate, async (request, response) => {
  const key = typeof request.query.key === "string" ? request.query.key : "";
  const userPrefix = `restaurants/${request.user.id}/`;

  if (!key.startsWith(userPrefix) || key.includes("..")) {
    return response.status(400).json({ error: "Arquivo inválido." });
  }

  try {
    await r2.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }));
    return response.status(204).end();
  } catch (error) {
    console.error("Could not delete R2 object", error);
    return response.status(500).json({ error: "Não foi possível remover a imagem." });
  }
});

function toWebRequest(request) {
  return new Request(`${request.protocol}://${request.get("host")}${request.originalUrl}`, {
    headers: request.headers,
  });
}

app.post("/api/billing/checkout", authenticate, async (request, response) => {
  try {
    const webRequest = toWebRequest(request);
    const existing = await getUserSubscription(webRequest, process.env, request.user.id);
    if (["active", "trialing"].includes(existing?.status)) {
      return response.status(409).json({ error: "Sua assinatura Pro já está ativa." });
    }

    if (!process.env.STRIPE_PRO_PRICE_ID) {
      return response.status(503).json({ error: "O preço do plano Pro não está configurado." });
    }

    const origin = process.env.PUBLIC_APP_URL || `${request.protocol}://${request.get("host")}`;
    const parameters = {
      mode: "subscription",
      "line_items[0][price]": process.env.STRIPE_PRO_PRICE_ID,
      "line_items[0][quantity]": "1",
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancelled`,
      client_reference_id: request.user.id,
      "metadata[owner_id]": request.user.id,
      "subscription_data[metadata][owner_id]": request.user.id,
      allow_promotion_codes: "true",
      locale: "pt-BR",
    };
    if (existing?.stripe_customer_id) parameters.customer = existing.stripe_customer_id;
    else parameters.customer_email = request.user.email;

    const session = await stripeRequest(process.env, "/checkout/sessions", parameters);
    return response.json({ url: session.url });
  } catch (error) {
    console.error("Could not create Stripe Checkout", error);
    return response.status(500).json({ error: "Não foi possível comunicar com a Stripe." });
  }
});

app.post("/api/billing/portal", authenticate, async (request, response) => {
  try {
    const subscription = await getUserSubscription(toWebRequest(request), process.env, request.user.id);
    if (!subscription?.stripe_customer_id) {
      return response.status(404).json({ error: "Assinatura não encontrada." });
    }

    const parameters = {
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.PUBLIC_APP_URL || `${request.protocol}://${request.get("host")}`}/`,
    };
    if (process.env.STRIPE_PORTAL_CONFIGURATION_ID) {
      parameters.configuration = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
    }
    const session = await stripeRequest(
      process.env,
      "/billing_portal/sessions",
      parameters,
      { priceId: subscription.stripe_price_id },
    );
    return response.json({ url: session.url });
  } catch (error) {
    console.error("Could not create Stripe portal", error);
    return response.status(500).json({ error: "Não foi possível comunicar com a Stripe." });
  }
});

app.post("/api/billing/webhook", async (request, response) => {
  const payload = request.rawBody || JSON.stringify(request.body);
  const valid = await verifyStripeWebhook(
    payload,
    request.get("stripe-signature"),
    process.env.STRIPE_WEBHOOK_SECRET,
  );
  if (!valid) return response.status(400).json({ error: "Assinatura do webhook inválida." });

  try {
    const event = JSON.parse(payload);
    if (event.type === "checkout.session.completed") {
      if (event.data.object.subscription) {
        const subscription = await stripeRequest(process.env, `/subscriptions/${event.data.object.subscription}`);
        await syncSubscription(subscription, process.env);
      } else if (event.data.object.mode === "payment") {
        await markOrderPaymentConfirmed(process.env, event.data.object);
      }
    }
    if (event.type === "checkout.session.async_payment_failed") {
      await markOrderPaymentFailed(process.env, event.data.object);
    }
    if ([
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ].includes(event.type)) {
      await syncSubscription(event.data.object, process.env);
    }
    return response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return response.status(500).json({ error: "Falha ao processar webhook." });
  }
});

app.get("/api/connect/status", authenticate, async (request, response) => {
  try {
    const restaurant = await getOwnerRestaurant(process.env, request.user.id);
    if (!restaurant) return response.status(404).json({ error: "Restaurante não encontrado." });
    const account = await getOwnerMercadoPagoAccount(process.env, request.user.id);
    return response.json({ payment: publicMercadoPagoStatus(account) });
  } catch (error) {
    console.error("Could not read Mercado Pago status", error);
    return response.status(500).json({ error: "Não foi possível comunicar com o Mercado Pago." });
  }
});

app.post("/api/connect/onboarding", authenticate, async (request, response) => {
  try {
    const restaurant = await getOwnerRestaurant(process.env, request.user.id);
    if (!restaurant) return response.status(404).json({ error: "Restaurante não encontrado." });
    const url = await createMercadoPagoOnboardingUrl(
      process.env,
      request.user,
      restaurant,
      process.env.PUBLIC_APP_URL || `${request.protocol}://${request.get("host")}`,
    );
    return response.json({ url });
  } catch (error) {
    console.error("Could not create Mercado Pago onboarding", error);
    return response.status(500).json({ error: error.message || "Não foi possível comunicar com o Mercado Pago." });
  }
});

app.get("/api/mercadopago/callback", async (request, response) => {
  const origin = process.env.PUBLIC_APP_URL || `${request.protocol}://${request.get("host")}`;
  const { code, state, error } = request.query;
  if (error || !code || !state) return response.redirect(302, `${origin}/?connect=refresh`);
  try {
    await completeMercadoPagoOnboarding(process.env, {
      code: String(code),
      state: String(state),
      origin,
    });
    return response.redirect(302, `${origin}/?connect=return`);
  } catch (callbackError) {
    console.error("Mercado Pago OAuth callback failed", callbackError);
    await saveMercadoPagoOauthError(process.env, {
      state: state ? String(state) : null,
      error: callbackError,
    }).catch((logError) => {
      console.error("Could not persist Mercado Pago OAuth error", logError);
    });
    return response.redirect(302, `${origin}/?connect=refresh`);
  }
});

app.post("/api/orders/checkout", async (request, response) => {
  try {
    const result = await createMercadoPagoOrderCheckoutSession(
      process.env,
      request.body,
      `${request.protocol}://${request.get("host")}`,
    );
    return response.json(result);
  } catch (error) {
    console.error("Could not create order checkout", error);
    const expected = [
      "Cardápio não encontrado.",
      "Este restaurante ainda não liberou pagamento online.",
      "Pedido vazio.",
      "Nenhum produto válido encontrado.",
      "Informe o nome para o pedido.",
      "Informe um e-mail válido.",
      "Informe um CEP com 8 dígitos.",
      "CEP não encontrado.",
      "Não foi possível consultar o CEP.",
      "Informe o número ou complemento da entrega.",
      "Este restaurante ainda não configurou as cidades de entrega.",
      "Mercado Pago não está configurado.",
    ];
    const expectedError = expected.includes(error.message) || error.message?.startsWith("Este restaurante não entrega em ");
    return response.status(expectedError ? 400 : 500).json({
      error: expectedError
        ? error.message
        : "Não foi possível comunicar com o Mercado Pago.",
    });
  }
});

app.post("/api/orders/mercadopago/webhook", async (request, response) => {
  const payload = request.body || {};
  const type = payload.type || payload.topic || request.query.type || request.query.topic;
  const paymentId = payload.data?.id || payload.id || request.query["data.id"] || request.query.id;
  try {
    if (type !== "payment") return response.json({ received: true });
    if (!paymentId) return response.status(400).json({ error: "Pagamento não informado." });
    const payment = await getMercadoPagoPaymentForOrder(process.env, paymentId);
    await syncMercadoPagoPayment(process.env, payment);
    return response.json({ received: true });
  } catch (error) {
    console.error("Mercado Pago webhook processing failed", error);
    return response.status(500).json({ error: "Falha ao processar webhook do Mercado Pago." });
  }
});

app.get("/api/orders", authenticate, async (request, response) => {
  try {
    return response.json({ orders: await listOwnerOrders(process.env, request.user.id) });
  } catch (error) {
    console.error("Could not list orders", error);
    return response.status(500).json({ error: "Não foi possível carregar os pedidos." });
  }
});

app.post("/api/orders/refund", authenticate, async (request, response) => {
  try {
    const order = await refundMercadoPagoOrder(process.env, request.user.id, request.body?.orderId);
    return response.json({ order });
  } catch (error) {
    const expectedError = error.status === 404
      || error.status === 400
      || /Pedido|pedido|Apenas|Mercado Pago/.test(error.message || "");
    if (!expectedError) console.error("Could not refund Mercado Pago order", error);
    return response.status(error.status || (expectedError ? 400 : 500)).json({
      error: expectedError
        ? error.message
        : "Não foi possível reembolsar este pedido no Mercado Pago.",
    });
  }
});

app.get("/api/delivery-cities", authenticate, async (request, response) => {
  try {
    return response.json({ cities: await getOwnerDeliveryCities(process.env, request.user.id) });
  } catch (error) {
    console.error("Could not read delivery cities", error);
    return response.status(500).json({ error: "Não foi possível carregar as cidades de entrega." });
  }
});

app.put("/api/delivery-cities", authenticate, async (request, response) => {
  try {
    const restaurant = await getOwnerRestaurant(process.env, request.user.id);
    if (!restaurant) return response.status(404).json({ error: "Restaurante não encontrado." });
    const cities = await replaceOwnerDeliveryCities(
      process.env,
      request.user.id,
      restaurant.id,
      request.body?.cities,
    );
    return response.json({ cities });
  } catch (error) {
    console.error("Could not save delivery cities", error);
    return response.status(500).json({ error: "Não foi possível salvar as cidades de entrega." });
  }
});

app.post("/api/delivery-check", async (request, response) => {
  try {
    const restaurantId = String(request.body?.restaurantId || "").trim();
    if (!restaurantId) return response.status(400).json({ error: "Restaurante não informado." });
    const address = await validateCepForRestaurant(process.env, restaurantId, request.body?.cep);
    return response.json({ address });
  } catch (error) {
    const expected = [
      "Informe um CEP com 8 dígitos.",
      "CEP não encontrado.",
      "Não foi possível consultar o CEP.",
      "Este restaurante ainda não configurou as cidades de entrega.",
    ];
    const expectedError = expected.includes(error.message) || error.message?.startsWith("Este restaurante não entrega em ");
    if (expectedError) return response.status(400).json({ error: error.message });
    console.error("Could not validate delivery CEP", error);
    return response.status(500).json({ error: "Não foi possível validar a entrega." });
  }
});

app.get("/api/domains", authenticate, async (request, response) => {
  try {
    return response.json(await refreshCustomDomain(process.env, request.user.id));
  } catch (error) {
    const result = customDomainError(error);
    return response.status(result.status).json({ error: result.message });
  }
});

app.post("/api/domains", authenticate, async (request, response) => {
  try {
    return response.json(await connectCustomDomain(process.env, request.user.id, request.body.domain));
  } catch (error) {
    const result = customDomainError(error);
    return response.status(result.status).json({ error: result.message });
  }
});

app.get("/api/admin/access", authenticate, (request, response) => {
  return response.json({ isAdmin: isAdmin(process.env, request.user.id) });
});

app.get("/api/admin/customers", authenticate, async (request, response) => {
  if (!isAdmin(process.env, request.user.id)) return response.status(403).json({ error: "Acesso negado." });
  try {
    return response.json({ customers: await listAdminCustomers(process.env) });
  } catch (error) {
    const result = adminError(error);
    return response.status(result.status).json({ error: result.message });
  }
});

app.post("/api/admin/refund", authenticate, async (request, response) => {
  if (!isAdmin(process.env, request.user.id)) return response.status(403).json({ error: "Acesso negado." });
  if (request.body.confirmation !== "REEMBOLSAR") {
    return response.status(400).json({ error: "Confirmação de reembolso inválida." });
  }
  try {
    return response.json(await refundAndCancel(process.env, request.body.ownerId, request.user.id));
  } catch (error) {
    const result = adminError(error);
    return response.status(result.status).json({ error: result.message });
  }
});

app.get("/api/media", async (request, response) => {
  const key = typeof request.query.key === "string" ? request.query.key : "";

  if (!key.startsWith("restaurants/") || key.includes("..")) {
    return response.status(400).send("Invalid media key");
  }

  try {
    const mediaUrl = await getSignedUrl(
      r2,
      new GetObjectCommand({ Bucket: r2Bucket, Key: key }),
      { expiresIn: 3600 },
    );
    return response.redirect(302, mediaUrl);
  } catch (error) {
    console.error("Could not read R2 object", error);
    return response.status(404).send("Media not found");
  }
});

app.use("/api", (error, _request, response, next) => {
  if (response.headersSent) return next(error);

  console.error("Unhandled API error", error);
  return response.status(500).json({ error: "Ocorreu um erro interno na API." });
});

if (isDevelopment) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "../vite.config.js"),
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, "../dist");
  app.use(express.static(distPath));
  app.get("/{*path}", (_request, response) => response.sendFile(path.join(distPath, "index.html")));
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Shack Menu running on http://localhost:${port}`);
});
