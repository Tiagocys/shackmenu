// @ts-nocheck
import nodemailer from "npm:nodemailer@6.9.16";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shackmenu-email-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getEnv(name: string, required = true) {
  const value = Deno.env.get(name);
  if (required && !value) throw new Error(`${name} não configurado.`);
  return value || "";
}

function isSecureSmtp() {
  const configured = Deno.env.get("SMTP_SECURE");
  if (configured) return configured.toLowerCase() === "true";
  return Number(Deno.env.get("SMTP_PORT") || 0) === 465;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: getEnv("SMTP_HOST"),
    port: Number(getEnv("SMTP_PORT") || 587),
    secure: isSecureSmtp(),
    auth: {
      user: getEnv("SMTP_USER"),
      pass: getEnv("SMTP_PASS"),
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const expectedSecret = getEnv("SHACKMENU_EMAIL_SECRET");
    const receivedSecret = request.headers.get("x-shackmenu-email-secret");
    if (!receivedSecret || receivedSecret !== expectedSecret) {
      return json({ error: "Não autorizado." }, 401);
    }

    const payload = await request.json();
    const to = String(payload.to || "").trim();
    const subject = String(payload.subject || "").trim();
    const text = String(payload.text || "").trim();
    const html = String(payload.html || "").trim();
    const replyTo = String(payload.replyTo || "").trim();
    const fromName = String(payload.from?.name || "Shack Menu").trim();

    if (!to || !subject || (!text && !html)) {
      return json({ error: "Payload de e-mail inválido." }, 400);
    }

    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: {
        name: fromName,
        address: Deno.env.get("SMTP_USER") || Deno.env.get("SMTP_FROM"),
      },
      to,
      replyTo: replyTo || undefined,
      subject,
      text: text || undefined,
      html: html || undefined,
    });

    return json({ ok: true, messageId: info.messageId });
  } catch (error) {
    console.error("send-order-emails failed", error);
    return json({ error: "Falha ao enviar e-mail." }, 500);
  }
});
