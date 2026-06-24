const SUPPORT_EMAIL = "support@shackmenu.com";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrice(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(cents || 0) / 100);
}

function getOrderLines(order) {
  return Array.isArray(order.items) ? order.items : [];
}

function getLogoUrl(env, order) {
  if (!order.logo_key) return null;
  const baseUrl = env.PUBLIC_APP_URL || "https://shackmenu.com";
  return `${baseUrl}/api/media?key=${encodeURIComponent(order.logo_key)}`;
}

function getRestaurantContact(order) {
  const lines = [];
  if (order.whatsapp_number) lines.push(`WhatsApp: +${order.whatsapp_number}`);
  if (order.instagram_username) lines.push(`Instagram: @${order.instagram_username}`);
  if (order.contact_email) lines.push(`E-mail: ${order.contact_email}`);
  return lines;
}

function getRestaurantBackground(order) {
  const color = String(order.background_color || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#f6f2ea";
}

function buildItemsHtml(order) {
  return getOrderLines(order).map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;">${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.subtotal_cents)}</td>
    </tr>
  `).join("");
}

function buildItemsText(order) {
  return getOrderLines(order)
    .map((item) => `- ${item.quantity}x ${item.name}: ${formatPrice(item.subtotal_cents)}`)
    .join("\n");
}

function buildCustomerEmail(env, order) {
  const logoUrl = getLogoUrl(env, order);
  const contact = getRestaurantContact(order);
  const background = getRestaurantBackground(order);
  const subject = `Pedido #${order.order_number} recebido`;
  const text = [
    "Não responda a este e-mail.",
    "",
    `Pedido #${order.order_number} recebido por ${order.restaurant_name}.`,
    "",
    "Itens:",
    buildItemsText(order),
    "",
    `Subtotal: ${formatPrice(order.subtotal_cents)}`,
    order.notes ? `Observações: ${order.notes}` : "",
    "",
    "Contato do restaurante:",
    contact.length ? contact.join("\n") : "O restaurante entrará em contato pelos dados informados no pedido.",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:${escapeHtml(background)};padding:24px;color:#2d2922;">
      <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:18px;padding:28px;">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(order.restaurant_name)}" style="max-width:96px;max-height:96px;border-radius:18px;object-fit:cover;margin-bottom:18px;" />` : ""}
        <p style="margin:0 0 14px;color:#9a3324;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Não responda a este e-mail</p>
        <p style="margin:0 0 8px;color:#7a6d5d;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">Pedido recebido</p>
        <h1 style="margin:0 0 12px;font-size:26px;">Pedido #${escapeHtml(order.order_number)}</h1>
        <p style="margin:0 0 22px;font-size:16px;line-height:1.5;">Já recebemos seu pedido em <strong>${escapeHtml(order.restaurant_name)}</strong>. O restaurante vai trabalhar nele em breve.</p>
        <table style="width:100%;border-collapse:collapse;margin:8px 0 18px;">${buildItemsHtml(order)}</table>
        <p style="font-size:18px;margin:0 0 20px;text-align:right;"><strong>Subtotal: ${formatPrice(order.subtotal_cents)}</strong></p>
        ${order.notes ? `<p style="background:#f6f2ea;border-radius:12px;padding:14px;"><strong>Observações:</strong><br>${escapeHtml(order.notes)}</p>` : ""}
        <div style="border-top:1px solid #eee;margin-top:22px;padding-top:18px;">
          <p style="margin:0 0 8px;"><strong>Contato do restaurante</strong></p>
          <p style="margin:0;color:#5d5245;line-height:1.5;">${contact.length ? contact.map(escapeHtml).join("<br>") : "O restaurante entrará em contato pelos dados informados no pedido."}</p>
        </div>
      </div>
    </div>
  `;
  return { subject, text, html };
}

function buildMerchantEmail(order) {
  const background = getRestaurantBackground(order);
  const subject = `Novo pedido pago #${order.order_number}`;
  const customerLines = [
    `Cliente: ${order.customer_name}`,
    `E-mail: ${order.customer_email}`,
    order.customer_phone ? `Telefone: ${order.customer_phone}` : "",
  ].filter(Boolean);
  const text = [
    `Novo pedido pago no ${order.restaurant_name}.`,
    "",
    `Pedido #${order.order_number}`,
    ...customerLines,
    "",
    "Itens:",
    buildItemsText(order),
    "",
    `Subtotal: ${formatPrice(order.subtotal_cents)}`,
    order.platform_fee_percent > 0 ? `Taxa Shack Menu (${order.platform_fee_percent}%): ${formatPrice(order.platform_fee_cents)}` : "Sem taxa Shack Menu",
    order.notes ? `Observações: ${order.notes}` : "",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:${escapeHtml(background)};padding:24px;color:#2d2922;">
      <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:18px;padding:28px;">
        <p style="margin:0 0 8px;color:#7a6d5d;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">Novo pedido pago</p>
        <h1 style="margin:0 0 12px;font-size:26px;">Pedido #${escapeHtml(order.order_number)}</h1>
        <p style="margin:0 0 18px;line-height:1.5;"><strong>Cliente:</strong> ${escapeHtml(order.customer_name)}<br><strong>E-mail:</strong> ${escapeHtml(order.customer_email)}${order.customer_phone ? `<br><strong>Telefone:</strong> ${escapeHtml(order.customer_phone)}` : ""}</p>
        <table style="width:100%;border-collapse:collapse;margin:8px 0 18px;">${buildItemsHtml(order)}</table>
        <p style="font-size:18px;margin:0 0 8px;text-align:right;"><strong>Subtotal: ${formatPrice(order.subtotal_cents)}</strong></p>
        <p style="margin:0 0 20px;text-align:right;color:#7a6d5d;">${order.platform_fee_percent > 0 ? `Taxa Shack Menu (${order.platform_fee_percent}%): ${formatPrice(order.platform_fee_cents)}` : "Sem taxa Shack Menu"}</p>
        ${order.notes ? `<p style="background:#f6f2ea;border-radius:12px;padding:14px;"><strong>Observações:</strong><br>${escapeHtml(order.notes)}</p>` : ""}
      </div>
    </div>
  `;
  return { subject, text, html };
}

async function sendEmail(env, { to, subject, text, html, replyTo, fromName }) {
  if (!to) return null;
  const message = {
    to,
    from: { email: SUPPORT_EMAIL, name: fromName || "Shack Menu" },
    replyTo: replyTo || SUPPORT_EMAIL,
    subject,
    text,
    html,
  };

  const supabaseUrl = env.SUPABASE_URL || env.project_url;
  const emailSecret = env.SHACKMENU_EMAIL_SECRET;
  if (supabaseUrl && emailSecret) {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-order-emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-shackmenu-email-secret": emailSecret,
      },
      body: JSON.stringify(message),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase email function failed (${response.status}): ${body}`);
    }
    return response.json();
  }

  if (env.EMAIL?.send) {
    return env.EMAIL.send(message);
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID || env.CF_ACCOUNT_ID;
  const token = env.CLOUDFLARE_EMAIL_API_TOKEN || env.CF_EMAIL_API_TOKEN;
  if (!accountId || !token) {
    console.warn("Email provider not configured; skipping notification", { to, subject });
    return null;
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to,
      from: { address: SUPPORT_EMAIL, name: fromName || "Shack Menu" },
      reply_to: replyTo || SUPPORT_EMAIL,
      subject,
      text,
      html,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Cloudflare Email API failed (${response.status}): ${body}`);
  }
  return response.json();
}

export async function sendOrderPaymentConfirmedEmails(env, order) {
  const tasks = [];
  if (order.customer_email) {
    tasks.push(sendEmail(env, {
      to: order.customer_email,
      replyTo: order.contact_email || SUPPORT_EMAIL,
      fromName: order.restaurant_name || "Restaurante",
      ...buildCustomerEmail(env, order),
    }));
  }
  if (order.contact_email) {
    tasks.push(sendEmail(env, {
      to: order.contact_email,
      replyTo: order.customer_email || SUPPORT_EMAIL,
      ...buildMerchantEmail(order),
    }));
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((result) => {
    if (result.status === "rejected") console.error("Order email notification failed", result.reason);
  });
}
