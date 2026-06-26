import { createClient } from "@supabase/supabase-js";

const defaultDocumentTitle = "Shack Menu";
const defaultMetaTitle = "Shack Menu | Menu digital para vender online";
const defaultMetaDescription = "Crie um menu digital para sua loja em poucos minutos com pedidos online, pagamento via Mercado Pago, link personalizado e personalização visual no Shack Menu.";
const defaultMetaImage = "https://shackmenu.com/assets/logo/og.png";
const defaultMetaUrl = "https://shackmenu.com/";
const metaDescription = document.querySelector('meta[name="description"]');
const canonicalLink = document.querySelector('link[rel="canonical"]');
const openGraphTitle = document.querySelector('meta[property="og:title"]');
const openGraphDescription = document.querySelector('meta[property="og:description"]');
const openGraphImage = document.querySelector('meta[property="og:image"]');
const openGraphImageWidth = document.querySelector('meta[property="og:image:width"]');
const openGraphImageHeight = document.querySelector('meta[property="og:image:height"]');
const openGraphUrl = document.querySelector('meta[property="og:url"]');
const twitterTitle = document.querySelector('meta[name="twitter:title"]');
const twitterDescription = document.querySelector('meta[name="twitter:description"]');
const twitterImage = document.querySelector('meta[name="twitter:image"]');

const views = {
  loading: document.querySelector("#loading-view"),
  login: document.querySelector("#login-view"),
  restaurant: document.querySelector("#restaurant-view"),
  categories: document.querySelector("#categories-view"),
  items: document.querySelector("#items-view"),
  complete: document.querySelector("#complete-view"),
  settings: document.querySelector("#settings-view"),
  upgrade: document.querySelector("#upgrade-view"),
  admin: document.querySelector("#admin-view"),
  orders: document.querySelector("#orders-view"),
  terms: document.querySelector("#terms-view"),
  publicMenu: document.querySelector("#public-menu-view"),
};

const loginButton = document.querySelector("#google-login");
const siteHeader = document.querySelector(".site-header");
const supportFooter = document.querySelector("#platform-support-footer");
const supportEmail = document.querySelector("#support-email");
const copySupportEmail = document.querySelector("#copy-support-email");
const termsLinks = document.querySelectorAll("[data-open-terms]");
const termsBack = document.querySelector("#terms-back");
const adminButton = document.querySelector("#admin-menu");
const ordersButton = document.querySelector("#orders-menu");
const ordersBadge = document.querySelector("#orders-badge");
const upgradeButton = document.querySelector("#upgrade-menu");
const customizeButton = document.querySelector("#customize-menu");
const signOutButton = document.querySelector("#sign-out");
const form = document.querySelector("#restaurant-form");
const formError = document.querySelector("#form-error");
const submitButton = document.querySelector("#restaurant-submit");
const logoInput = document.querySelector("#restaurant-logo");
const logoPreview = document.querySelector("#logo-preview");
const logoUploadTitle = document.querySelector("#logo-upload-title");
const logoUploadHint = document.querySelector("#logo-upload-hint");
const categoryForm = document.querySelector("#category-form");
const categoryInput = document.querySelector("#category-name");
const categorySubmit = document.querySelector("#category-submit");
const categoryError = document.querySelector("#category-error");
const categoryList = document.querySelector("#category-list");
const categoryEmpty = document.querySelector("#category-empty");
const categoryCount = document.querySelector("#category-count");
const categoriesContinue = document.querySelector("#categories-continue");
const itemsBack = document.querySelector("#items-back");
const productForm = document.querySelector("#product-form");
const productName = document.querySelector("#product-name");
const productPrice = document.querySelector("#product-price");
const productCategory = document.querySelector("#product-category");
const productDescription = document.querySelector("#product-description");
const productImageInput = document.querySelector("#product-image");
const productImagePreview = document.querySelector("#product-image-preview");
const productUploadTitle = document.querySelector("#product-upload-title");
const productUploadHint = document.querySelector("#product-upload-hint");
const productError = document.querySelector("#product-error");
const productSubmit = document.querySelector("#product-submit");
const productList = document.querySelector("#product-list");
const productEmpty = document.querySelector("#product-empty");
const productCount = document.querySelector("#product-count");
const productQuotaWarning = document.querySelector("#product-quota-warning");
const quotaUpgrade = document.querySelector("#quota-upgrade");
const finishMenu = document.querySelector("#finish-menu");
const publishMenu = document.querySelector("#publish-menu");
const publishError = document.querySelector("#publish-error");
const sharePanel = document.querySelector("#share-panel");
const publicMenuUrl = document.querySelector("#public-menu-url");
const copyMenuUrl = document.querySelector("#copy-menu-url");
const openPublicMenu = document.querySelector("#open-public-menu");
const publicRestaurantLogo = document.querySelector("#public-restaurant-logo");
const publicRestaurantName = document.querySelector("#public-restaurant-name");
const publicMenuTagline = document.querySelector("#public-menu-tagline");
const publicCategoryNav = document.querySelector("#public-category-nav");
const publicMenuContent = document.querySelector("#public-menu-content");
const publicWhatsapp = document.querySelector("#public-whatsapp");
const publicInstagram = document.querySelector("#public-instagram");
const publicInstagramLabel = document.querySelector("#public-instagram-label");
const publicCartButton = document.querySelector("#public-cart-button");
const publicCartCount = document.querySelector("#public-cart-count");
const publicCartOverlay = document.querySelector("#public-cart-overlay");
const publicCartClose = document.querySelector("#public-cart-close");
const publicCartItems = document.querySelector("#public-cart-items");
const publicCartEmpty = document.querySelector("#public-cart-empty");
const publicCartSummary = document.querySelector("#public-cart-summary");
const publicCartSubtotal = document.querySelector("#public-cart-subtotal");
const publicCartDelivery = document.querySelector("#public-cart-delivery");
const publicCartTotal = document.querySelector("#public-cart-total");
const publicCustomerName = document.querySelector("#public-customer-name");
const publicCustomerEmail = document.querySelector("#public-customer-email");
const publicCustomerPhone = document.querySelector("#public-customer-phone");
const publicCustomerDocument = document.querySelector("#public-customer-document");
const publicOrderNotes = document.querySelector("#public-order-notes");
const publicCartCheckout = document.querySelector("#public-cart-checkout");
const publicCartSend = document.querySelector("#public-cart-send");
const publicAddressGate = document.querySelector("#public-address-gate");
const publicAddressForm = document.querySelector("#public-address-form");
const publicAddressCopy = document.querySelector("#public-address-copy");
const publicAddressError = document.querySelector("#public-address-error");
const publicAddressStepCep = document.querySelector("#public-address-step-cep");
const publicAddressStepDetails = document.querySelector("#public-address-step-details");
const publicAddressCep = document.querySelector("#public-address-cep");
const publicAddressLookup = document.querySelector("#public-address-lookup");
const publicAddressStreet = document.querySelector("#public-address-street");
const publicAddressNeighborhood = document.querySelector("#public-address-neighborhood");
const publicAddressCity = document.querySelector("#public-address-city");
const publicAddressState = document.querySelector("#public-address-state");
const publicAddressComplement = document.querySelector("#public-address-complement");
const publicAddressChangeCep = document.querySelector("#public-address-change-cep");
const publicAddressSummary = document.querySelector("#public-address-summary");
const settingsBack = document.querySelector("#settings-back");
const settingsForm = document.querySelector("#settings-form");
const settingsRestaurantName = document.querySelector("#settings-restaurant-name");
const settingsMenuTagline = document.querySelector("#settings-menu-tagline");
const themeColor = document.querySelector("#theme-color");
const themeColorText = document.querySelector("#theme-color-text");
const whatsappNumber = document.querySelector("#whatsapp-number");
const instagramUsername = document.querySelector("#instagram-username");
const customDomainGroup = document.querySelector("#custom-domain-group");
const customDomainInput = document.querySelector("#custom-domain");
const customDomainStatus = document.querySelector("#custom-domain-status");
const customDomainStatusTitle = document.querySelector("#custom-domain-status-title");
const customDomainStatusCopy = document.querySelector("#custom-domain-status-copy");
const customDomainLink = document.querySelector("#custom-domain-link");
const customDomainCname = document.querySelector("#custom-domain-cname");
const customDomainCnameName = document.querySelector("#custom-domain-cname-name");
const customDomainCnameTarget = document.querySelector("#custom-domain-cname-target");
const copyDomainTarget = document.querySelector("#copy-domain-target");
const settingsLogoInput = document.querySelector("#settings-logo");
const settingsLogoPreview = document.querySelector("#settings-logo-preview");
const settingsLogoTitle = document.querySelector("#settings-logo-title");
const settingsLogoHint = document.querySelector("#settings-logo-hint");
const settingsError = document.querySelector("#settings-error");
const settingsSuccess = document.querySelector("#settings-success");
const settingsSubmit = document.querySelector("#settings-submit");
const themePreview = document.querySelector("#theme-preview");
const themePreviewLogo = document.querySelector("#theme-preview-logo");
const themePreviewName = document.querySelector("#theme-preview-name");
const themePreviewTagline = document.querySelector("#theme-preview-tagline");
const upgradeBack = document.querySelector("#upgrade-back");
const upgradeMessage = document.querySelector("#upgrade-message");
const upgradeError = document.querySelector("#upgrade-error");
const proPlanAction = document.querySelector("#pro-plan-action");
const freePlanCurrent = document.querySelector(".button-plan-current");
const publicMenuFooter = document.querySelector(".public-menu-footer");
const billingNotice = document.querySelector("#billing-notice");
const adminBack = document.querySelector("#admin-back");
const adminRefresh = document.querySelector("#admin-refresh");
const adminCustomers = document.querySelector("#admin-customers");
const adminError = document.querySelector("#admin-error");
const adminSuccess = document.querySelector("#admin-success");
const ordersBack = document.querySelector("#orders-back");
const ordersRefresh = document.querySelector("#orders-refresh");
const ordersError = document.querySelector("#orders-error");
const ordersSuccess = document.querySelector("#orders-success");
const deliveryCityForm = document.querySelector("#delivery-city-form");
const deliveryCityName = document.querySelector("#delivery-city-name");
const deliveryCityState = document.querySelector("#delivery-city-state");
const deliveryCitiesList = document.querySelector("#delivery-cities-list");
const deliveryCitiesEmpty = document.querySelector("#delivery-cities-empty");
const deliveryCitiesSave = document.querySelector("#delivery-cities-save");
const deliveryFee = document.querySelector("#delivery-fee");
const connectCard = document.querySelector("#connect-card");
const connectTitle = document.querySelector("#connect-title");
const connectCopy = document.querySelector("#connect-copy");
const connectOnboarding = document.querySelector("#connect-onboarding");
const ordersList = document.querySelector("#orders-list");
const ordersCount = document.querySelector("#orders-count");
const ordersNotice = document.querySelector("#orders-notice");
const ordersTabs = document.querySelector("#orders-tabs");
const ordersSectionTitle = document.querySelector("#orders-section-title");

let supabase;
let applicationUrl = window.location.origin;
let mercadoPagoTestMode = false;
let currentUser;
let currentRestaurant;
let categories = [];
let products = [];
let optimizedLogo = null;
let logoProcessingPromise = Promise.resolve(null);
let logoPreviewUrl = null;
let optimizedProductImage = null;
let productImageProcessingPromise = Promise.resolve(null);
let productImagePreviewUrl = null;
let optimizedSettingsLogo = null;
let settingsLogoProcessingPromise = Promise.resolve(null);
let settingsLogoPreviewUrl = null;
let activeViewName = "loading";
let settingsReturnView = "items";
let upgradeReturnView = "items";
let adminReturnView = "items";
let ordersReturnView = "items";
let adminAccess = false;
let planUsage = { plan: "free", product_count: 0, product_limit: 200 };
let activePublicMenu = null;
let publicCart = [];
let deliveryCities = [];
let deliveryFeeCents = 0;
let ibgeStates = [];
let ibgeCitiesByState = new Map();
let publicDeliveryAddress = null;
let pendingPublicAddress = null;
let allOrders = [];
let activeOrdersTab = "paid";
let lastPaidOrderId = null;
let ordersPollTimer = null;
let notificationAudioContext = null;

const pendingPublicOrderKey = "shackmenu:pending-public-order";

function setMetaContent(element, content) {
  if (element) element.content = content;
}

function setCanonicalUrl(url) {
  if (canonicalLink) canonicalLink.href = url;
}

function updateDefaultSeoMeta() {
  document.title = defaultDocumentTitle;
  setMetaContent(metaDescription, defaultMetaDescription);
  setMetaContent(openGraphTitle, defaultMetaTitle);
  setMetaContent(openGraphDescription, defaultMetaDescription);
  setMetaContent(openGraphImage, defaultMetaImage);
  setMetaContent(openGraphImageWidth, "1200");
  setMetaContent(openGraphImageHeight, "630");
  setMetaContent(openGraphUrl, defaultMetaUrl);
  setMetaContent(twitterTitle, defaultMetaTitle);
  setMetaContent(twitterDescription, defaultMetaDescription);
  setMetaContent(twitterImage, defaultMetaImage);
  setCanonicalUrl(defaultMetaUrl);
}

function updatePublicMenuSeoMeta(menu) {
  const title = menu.restaurant.name;
  const description = menu.restaurant.menu_tagline
    || `${menu.restaurant.name}: menu digital com produtos, pedidos online e informações de contato.`;
  const hasLogo = Boolean(menu.restaurant.logo_key);
  const image = hasLogo
    ? `${window.location.origin}/api/media?key=${encodeURIComponent(menu.restaurant.logo_key)}`
    : defaultMetaImage;
  const url = window.location.href.split("#")[0];
  document.title = title;
  setMetaContent(metaDescription, description);
  setMetaContent(openGraphTitle, title);
  setMetaContent(openGraphDescription, description);
  setMetaContent(openGraphImage, image);
  setMetaContent(openGraphImageWidth, hasLogo ? "512" : "1200");
  setMetaContent(openGraphImageHeight, hasLogo ? "512" : "630");
  setMetaContent(openGraphUrl, url);
  setMetaContent(twitterTitle, title);
  setMetaContent(twitterDescription, description);
  setMetaContent(twitterImage, image);
  setCanonicalUrl(url);
}

function showView(name) {
  Object.entries(views).forEach(([viewName, element]) => {
    element.classList.toggle("hidden", viewName !== name);
  });
  const publicView = ["loading", "login", "terms", "publicMenu"].includes(name);
  siteHeader.classList.toggle("hidden", name === "publicMenu");
  signOutButton.classList.toggle("hidden", publicView);
  supportFooter.classList.toggle("hidden", name === "loading" || name === "publicMenu");
  adminButton.classList.toggle("hidden", publicView || name === "admin" || !adminAccess);
  ordersButton.classList.toggle("hidden", publicView || name === "orders" || name === "restaurant" || !currentRestaurant);
  customizeButton.classList.toggle("hidden", publicView || name === "restaurant" || name === "settings" || !currentRestaurant);
  upgradeButton.classList.toggle("hidden", publicView || name === "restaurant" || name === "upgrade" || !currentRestaurant);
  upgradeButton.textContent = planUsage.plan === "pro" ? "Gerenciar plano" : "Upgrade";
  if (name !== "publicMenu") {
    updateDefaultSeoMeta();
  }
  activeViewName = name;
}

function getPaidOrders(orders) {
  return orders.filter((order) => order.status === "payment_confirmed");
}

function getOrdersSeenStorageKey() {
  return currentUser && currentRestaurant
    ? `shackmenu:orders-seen:${currentUser.id}:${currentRestaurant.id}`
    : null;
}

function getLastSeenPaidOrderTime() {
  const key = getOrdersSeenStorageKey();
  if (!key) return 0;
  return Number(localStorage.getItem(key) || 0);
}

function markPaidOrdersSeen(orders = []) {
  const key = getOrdersSeenStorageKey();
  if (!key) return;
  const latestTime = Math.max(
    0,
    ...getPaidOrders(orders).map((order) => new Date(order.created_at || 0).getTime()),
  );
  if (latestTime) localStorage.setItem(key, String(latestTime));
  updateOrdersBadge(orders);
}

function getOrdersForTab(orders, tab) {
  if (tab === "paid") return orders.filter((order) => order.status === "payment_confirmed");
  if (tab === "pending") return orders.filter((order) => order.status === "awaiting_payment");
  if (tab === "cancelled") return orders.filter((order) => ["cancelled", "payment_failed", "refunded"].includes(order.status));
  return orders;
}

function getOrdersTabLabel(tab) {
  return {
    paid: "Pedidos pagos",
    pending: "Pedidos pendentes",
    cancelled: "Pedidos cancelados",
  }[tab] || "Pedidos";
}

function updateOrdersTabs(orders) {
  const counts = {
    paid: getOrdersForTab(orders, "paid").length,
    pending: getOrdersForTab(orders, "pending").length,
    cancelled: getOrdersForTab(orders, "cancelled").length,
  };
  ordersTabs.querySelectorAll("[data-order-tab]").forEach((button) => {
    const tab = button.dataset.orderTab;
    button.classList.toggle("orders-tab-active", tab === activeOrdersTab);
    button.setAttribute("aria-selected", tab === activeOrdersTab ? "true" : "false");
    button.querySelector("span").textContent = String(counts[tab] || 0);
  });
}

function updateOrdersBadge(orders = []) {
  const lastSeenTime = getLastSeenPaidOrderTime();
  const count = getPaidOrders(orders).filter((order) => (
    new Date(order.created_at || 0).getTime() > lastSeenTime
  )).length;
  ordersBadge.textContent = String(Math.min(count, 99));
  ordersBadge.classList.toggle("hidden", count === 0);
}

function playOrderNotificationSound() {
  try {
    notificationAudioContext ||= new AudioContext();
    const oscillator = notificationAudioContext.createOscillator();
    const gain = notificationAudioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, notificationAudioContext.currentTime);
    oscillator.frequency.setValueAtTime(660, notificationAudioContext.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, notificationAudioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, notificationAudioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, notificationAudioContext.currentTime + 0.28);
    oscillator.connect(gain).connect(notificationAudioContext.destination);
    oscillator.start();
    oscillator.stop(notificationAudioContext.currentTime + 0.3);
  } catch (error) {
    console.error("Could not play notification sound", error);
  }
}

async function requestOrderNotificationPermission() {
  if (!("Notification" in window) || Notification.permission !== "default") return;
  try {
    await Notification.requestPermission();
  } catch (error) {
    console.error("Could not request notification permission", error);
  }
}

function notifyNewPaidOrder(order) {
  playOrderNotificationSound();
  if ("Notification" in window && Notification.permission === "granted") {
    const totalCents = Number(order.subtotal_cents || 0) + Number(order.delivery_fee_cents || 0);
    new Notification(`Pedido pago #${order.order_number}`, {
      body: `${order.customer_name} - ${formatPrice(totalCents)}`,
      icon: "/assets/icons/bell.svg",
    });
  }
}

async function authenticatedApi(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sua sessão expirou.");
  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await readApiResponse(response);
  if (!response.ok) throw new Error(result.error || "A API não concluiu a operação.");
  return result;
}

async function loadAdminAccess() {
  try {
    const result = await authenticatedApi("/api/admin/access");
    adminAccess = Boolean(result.isAdmin);
  } catch (error) {
    console.error(error);
    adminAccess = false;
  }
}

function formatAdminDate(value) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

function formatAdminAmount(amount, currency = "brl") {
  if (!Number.isInteger(amount)) return "Sem pagamento";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function renderAdminCustomers(customers) {
  adminCustomers.replaceChildren();
  if (!customers.length) {
    const empty = document.createElement("p");
    empty.className = "category-empty";
    empty.textContent = "Nenhuma assinatura encontrada.";
    adminCustomers.append(empty);
    return;
  }

  customers.forEach((customer) => {
    const item = document.createElement("article");
    item.className = "admin-customer";

    const info = document.createElement("div");
    info.className = "admin-customer-info";
    const name = document.createElement("strong");
    name.textContent = customer.restaurant;
    const email = document.createElement("small");
    email.textContent = customer.email;
    info.append(name, email);

    const subscription = document.createElement("div");
    subscription.className = "admin-customer-data";
    const subscriptionLabel = document.createElement("span");
    subscriptionLabel.textContent = "Assinatura";
    const subscriptionStatus = document.createElement("strong");
    subscriptionStatus.textContent = customer.subscriptionStatus;
    const subscriptionPeriod = document.createElement("span");
    subscriptionPeriod.textContent = `Até ${formatAdminDate(customer.currentPeriodEnd)}`;
    subscription.append(subscriptionLabel, subscriptionStatus, subscriptionPeriod);

    const payment = document.createElement("div");
    payment.className = "admin-customer-data";
    const paymentLabel = document.createElement("span");
    paymentLabel.textContent = "Última fatura";
    const paymentAmount = document.createElement("strong");
    paymentAmount.textContent = formatAdminAmount(customer.latestInvoice?.amountPaid, customer.latestInvoice?.currency);
    const paymentStatus = document.createElement("span");
    paymentStatus.textContent = customer.latestInvoice?.status || "Não encontrada";
    payment.append(paymentLabel, paymentAmount, paymentStatus);

    const refund = document.createElement("button");
    refund.className = "button button-danger";
    refund.type = "button";
    refund.dataset.refundOwner = customer.ownerId;
    refund.dataset.refundLabel = `${customer.restaurant} (${customer.email})`;
    refund.disabled = !["active", "trialing"].includes(customer.subscriptionStatus)
      || customer.latestInvoice?.status !== "paid";
    refund.textContent = customer.subscriptionStatus === "canceled" ? "Cancelada" : "Reembolsar";

    item.append(info, subscription, payment, refund);
    adminCustomers.append(item);
  });
}

async function loadAdminCustomers() {
  adminError.classList.add("hidden");
  adminRefresh.disabled = true;
  adminRefresh.textContent = "Atualizando...";
  try {
    const result = await authenticatedApi("/api/admin/customers");
    renderAdminCustomers(result.customers);
  } catch (error) {
    console.error(error);
    adminError.textContent = error.message;
    adminError.classList.remove("hidden");
  } finally {
    adminRefresh.disabled = false;
    adminRefresh.textContent = "Atualizar";
  }
}

async function openAdmin() {
  if (!adminAccess) return;
  adminReturnView = activeViewName === "admin" ? "items" : activeViewName;
  adminSuccess.classList.add("hidden");
  showView("admin");
  await loadAdminCustomers();
}

function renderConnectStatus(payment = {}) {
  connectOnboarding.classList.remove("hidden");
  const status = payment.status || "not_started";
  const active = status === "active" && payment.chargesEnabled;
  const isPro = planUsage.plan === "pro";
  const checkoutFee = isPro ? "0%" : "12%";
  connectCard.classList.toggle("connect-card-active", active);
  connectCard.classList.toggle("connect-card-pending", !active);
  connectTitle.textContent = active ? "Pagamento online ativo" : payment.label || "Onboarding pendente";
  connectCopy.textContent = active
    ? `Seu cardápio recebe Pix, cartão e outros meios via Mercado Pago. Taxa Shack Menu no checkout: ${checkoutFee}. ${isPro ? "Plano Pro ativo: sem taxa Shack Menu." : "Assine o Pro para remover essa taxa."}`
    : `Conecte a conta Mercado Pago para liberar pagamento online. No plano gratuito, a taxa Shack Menu é de ${checkoutFee} por pagamento confirmado. O plano Pro remove essa taxa.`;
  connectOnboarding.textContent = active ? "Reconectar Mercado Pago" : "Conectar Mercado Pago";
}

function renderDeliveryCities() {
  deliveryCitiesList.replaceChildren();
  deliveryCitiesEmpty.classList.toggle("hidden", deliveryCities.length > 0);
  deliveryCities.forEach((entry, index) => {
    const item = document.createElement("span");
    item.className = "delivery-city-chip";
    const label = document.createElement("strong");
    label.textContent = `${entry.city}/${entry.state}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remover ${entry.city}/${entry.state}`);
    remove.addEventListener("click", () => {
      deliveryCities.splice(index, 1);
      renderDeliveryCities();
      saveDeliveryCities();
    });
    item.append(label, remove);
    deliveryCitiesList.append(item);
  });
}

async function loadDeliveryCities() {
  const result = await authenticatedApi("/api/delivery-cities");
  deliveryCities = result.cities || [];
  deliveryFeeCents = Number(result.deliveryFeeCents || 0);
  deliveryFee.value = deliveryFeeCents ? String((deliveryFeeCents / 100).toFixed(2)).replace(".", ",") : "0";
  renderDeliveryCities();
}

async function loadBrazilianStates() {
  if (ibgeStates.length) return;
  const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
  if (!response.ok) throw new Error("Não foi possível carregar os estados.");
  ibgeStates = await response.json();
  deliveryCityState.replaceChildren(new Option("Estado", ""));
  ibgeStates.forEach((state) => {
    const option = new Option(state.nome, state.sigla);
    option.dataset.id = state.id;
    deliveryCityState.append(option);
  });
}

async function loadBrazilianCitiesForState(state) {
  const uf = normalizeDeliveryState(state);
  if (!uf) {
    deliveryCityName.replaceChildren(new Option("Cidade", ""));
    deliveryCityName.disabled = true;
    return;
  }
  if (!ibgeCitiesByState.has(uf)) {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
    if (!response.ok) throw new Error("Não foi possível carregar as cidades.");
    ibgeCitiesByState.set(uf, await response.json());
  }
  deliveryCityName.replaceChildren(new Option("Cidade", ""));
  ibgeCitiesByState.get(uf).forEach((city) => {
    deliveryCityName.append(new Option(city.nome, city.nome));
  });
  deliveryCityName.disabled = false;
}

async function saveDeliveryCities() {
  deliveryCitiesSave.disabled = true;
  deliveryCitiesSave.textContent = "Salvando...";
  ordersError.classList.add("hidden");
  ordersSuccess.classList.add("hidden");
  try {
    const result = await authenticatedApi("/api/delivery-cities", {
      method: "PUT",
      body: JSON.stringify({
        cities: deliveryCities,
        deliveryFeeCents: parseOptionalPriceToCents(deliveryFee.value),
      }),
    });
    deliveryCities = result.cities || [];
    deliveryFeeCents = Number(result.deliveryFeeCents || 0);
    deliveryFee.value = deliveryFeeCents ? String((deliveryFeeCents / 100).toFixed(2)).replace(".", ",") : "0";
    renderDeliveryCities();
    ordersSuccess.textContent = "Cidades de entrega salvas.";
    ordersSuccess.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    ordersError.textContent = error.message;
    ordersError.classList.remove("hidden");
  } finally {
    deliveryCitiesSave.disabled = false;
    deliveryCitiesSave.textContent = "Salvar novamente";
  }
}

function getPublicAddressStorageKey() {
  return activePublicMenu ? `shackmenu:delivery-address:${activePublicMenu.restaurant.id}` : null;
}

function savePublicDeliveryAddress() {
  const key = getPublicAddressStorageKey();
  if (!key || !publicDeliveryAddress) return;
  try {
    localStorage.setItem(key, JSON.stringify(publicDeliveryAddress));
  } catch (error) {
    console.error("Could not save delivery address", error);
  }
}

function loadPublicDeliveryAddress() {
  publicDeliveryAddress = null;
  const key = getPublicAddressStorageKey();
  if (!key) return;
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "null");
    if (stored?.cep && stored?.city && stored?.state && stored?.complement) {
      publicDeliveryAddress = stored;
    }
  } catch (error) {
    console.error("Could not load delivery address", error);
  }
}

function formatPublicAddress(address) {
  return [
    address.address,
    address.neighborhood,
    `${address.city}/${address.state}`,
    `CEP ${address.cep}`,
    `Complemento: ${address.complement}`,
  ].filter(Boolean).join(" - ");
}

function updatePublicStickyOffsets() {
  const addressOffset = publicAddressSummary.classList.contains("hidden")
    ? 0
    : publicAddressSummary.offsetHeight;
  const categoryHeight = publicCategoryNav.offsetHeight || 0;
  views.publicMenu.style.setProperty("--public-sticky-offset", `${addressOffset}px`);
  views.publicMenu.style.setProperty("--public-scroll-offset", `${addressOffset + categoryHeight + 18}px`);
}

function renderPublicAddressState() {
  const canOrder = Boolean(activePublicMenu?.restaurant.whatsapp_number || activePublicMenu?.restaurant.payment_online_active || mercadoPagoTestMode);
  if (!canOrder) {
    publicAddressGate.classList.add("hidden");
    publicAddressSummary.classList.add("hidden");
    document.body.classList.remove("address-gate-open");
    publicMenuContent.classList.remove("menu-blurred");
    publicCategoryNav.classList.remove("menu-blurred");
    updatePublicStickyOffsets();
    return;
  }
  const hasAddress = Boolean(publicDeliveryAddress);
  publicAddressGate.classList.toggle("hidden", hasAddress);
  publicAddressSummary.classList.toggle("hidden", !hasAddress);
  document.body.classList.toggle("address-gate-open", !hasAddress && activeViewName === "publicMenu");
  publicMenuContent.classList.toggle("menu-blurred", !hasAddress);
  publicCategoryNav.classList.toggle("menu-blurred", !hasAddress);
  publicCartButton.disabled = !hasAddress;
  publicAddressError.classList.add("hidden");
  if (hasAddress) {
    publicAddressSummary.textContent = `Entrega em: ${formatPublicAddress(publicDeliveryAddress)} • Alterar`;
  } else {
    publicAddressStepCep.classList.remove("hidden");
    publicAddressStepDetails.classList.add("hidden");
    publicAddressCep.focus();
  }
  window.requestAnimationFrame(updatePublicStickyOffsets);
}

async function lookupPublicAddress() {
  const cep = normalizeCep(publicAddressCep.value);
  if (cep.length !== 8) {
    publicAddressError.textContent = "Informe um CEP com 8 dígitos.";
    publicAddressError.classList.remove("hidden");
    publicAddressCep.focus();
    return;
  }

  publicAddressLookup.disabled = true;
  publicAddressLookup.innerHTML = '<span class="button-spinner"></span> Verificando...';
  publicAddressError.classList.add("hidden");
  try {
    const response = await fetch("/api/delivery-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: activePublicMenu.restaurant.id,
        cep,
      }),
    });
    const result = await readApiResponse(response);
    if (!response.ok) throw new Error(result.error || "Não foi possível validar o CEP.");
    pendingPublicAddress = result.address;
    publicAddressStreet.value = result.address.address || "";
    publicAddressNeighborhood.value = result.address.neighborhood || "";
    publicAddressCity.value = result.address.city || "";
    publicAddressState.value = result.address.state || "";
    publicAddressComplement.value = "";
    publicAddressStepCep.classList.add("hidden");
    publicAddressStepDetails.classList.remove("hidden");
    publicAddressCopy.textContent = "Confira o endereço e informe número ou complemento.";
    publicAddressComplement.focus();
  } catch (error) {
    publicAddressError.textContent = error.message;
    publicAddressError.classList.remove("hidden");
  } finally {
    publicAddressLookup.disabled = false;
    publicAddressLookup.textContent = "Verificar CEP";
  }
}

function renderOrderStatus(status) {
  const labels = {
    awaiting_payment: "Aguardando pagamento",
    payment_confirmed: "Pago",
    payment_failed: "Pagamento falhou",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
  };
  return labels[status] || status;
}

function canRefundOrder(order) {
  return order.status === "payment_confirmed"
    && order.payment_provider === "mercado_pago"
    && order.mercado_pago_payment_id
    && !order.mercado_pago_refund_id;
}

async function refundOrder(order, button) {
  const confirmed = window.confirm(
    `Reembolsar integralmente o pedido #${order.order_number}? Esta ação será enviada ao Mercado Pago.`,
  );
  if (!confirmed) return;

  ordersError.classList.add("hidden");
  ordersSuccess.classList.add("hidden");
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Reembolsando...";
  try {
    await authenticatedApi("/api/orders/refund", {
      method: "POST",
      body: JSON.stringify({ orderId: order.id }),
    });
    ordersSuccess.textContent = `Pedido #${order.order_number} reembolsado integralmente.`;
    ordersSuccess.classList.remove("hidden");
    await loadOrders();
  } catch (error) {
    console.error(error);
    ordersError.textContent = error.message;
    ordersError.classList.remove("hidden");
    button.disabled = false;
    button.textContent = originalText;
  }
}

function renderOrders(orders) {
  allOrders = orders;
  const visibleOrders = getOrdersForTab(orders, activeOrdersTab);
  ordersList.replaceChildren();
  ordersSectionTitle.textContent = getOrdersTabLabel(activeOrdersTab);
  ordersCount.textContent = `${visibleOrders.length} ${visibleOrders.length === 1 ? "pedido" : "pedidos"}`;
  updateOrdersBadge(orders);
  updateOrdersTabs(orders);
  ordersNotice.classList.add("hidden");
  ordersNotice.replaceChildren();

  const paidOrders = getPaidOrders(orders);
  if (paidOrders.length) {
    const latest = paidOrders[0];
    ordersNotice.classList.remove("hidden");
    const title = document.createElement("strong");
    title.textContent = `Pedido pago recebido #${latest.order_number}`;
    const copy = document.createElement("p");
    copy.textContent = paidOrders.length === 1
      ? "Você tem 1 pedido pago no painel. Confira os itens abaixo para iniciar o preparo."
      : `Você tem ${paidOrders.length} pedidos pagos no painel. Confira os itens abaixo para iniciar o preparo.`;
    ordersNotice.append(title, copy);
  }

  if (!visibleOrders.length) {
    const empty = document.createElement("p");
    empty.className = "category-empty";
    empty.textContent = `Nenhum pedido em "${getOrdersTabLabel(activeOrdersTab).toLowerCase()}" no momento.`;
    ordersList.append(empty);
    return;
  }

  visibleOrders.forEach((order) => {
    const item = document.createElement("article");
    item.className = "order-card";

    const header = document.createElement("div");
    header.className = "order-card-header";
    const title = document.createElement("strong");
    title.textContent = `Pedido #${order.order_number}`;
    const status = document.createElement("span");
    status.className = `order-status order-status-${order.status}`;
    status.textContent = renderOrderStatus(order.status);
    header.append(title, status);

    const customer = document.createElement("p");
    customer.textContent = `${order.customer_name} • ${order.customer_email || "sem e-mail"}`;
    const delivery = document.createElement("p");
    delivery.textContent = order.delivery_city
      ? `Entrega: ${[
        order.delivery_address,
        order.delivery_neighborhood,
        `${order.delivery_city}/${order.delivery_state}`,
        order.delivery_cep ? `CEP ${order.delivery_cep}` : null,
        order.delivery_complement ? `Complemento: ${order.delivery_complement}` : null,
      ].filter(Boolean).join(" - ")}`
      : "Entrega não informada";

    const products = document.createElement("ul");
    products.className = "order-items";
    (order.items || []).forEach((entry) => {
      const line = document.createElement("li");
      line.textContent = `${entry.quantity}x ${entry.name} — ${formatPrice(entry.subtotal_cents)}`;
      products.append(line);
    });

    const totals = document.createElement("div");
    totals.className = "order-totals";
    const deliveryFeeValue = Number(order.delivery_fee_cents || 0);
    const totalCents = Number(order.subtotal_cents || 0) + deliveryFeeValue;
    const subtotal = document.createElement("span");
    subtotal.textContent = `Subtotal ${formatPrice(order.subtotal_cents)}`;
    const deliveryFeeLine = document.createElement("span");
    deliveryFeeLine.textContent = `Entrega ${deliveryFeeValue > 0 ? formatPrice(deliveryFeeValue) : "grátis"}`;
    const total = document.createElement("span");
    total.textContent = `Total ${formatPrice(totalCents)}`;
    const fee = document.createElement("span");
    fee.textContent = order.platform_fee_percent > 0
      ? `Taxa Shack Menu ${order.platform_fee_percent}%: ${formatPrice(order.platform_fee_cents)}`
      : "Sem taxa Shack Menu";
    totals.append(subtotal, deliveryFeeLine, total, fee);

    const actions = document.createElement("div");
    actions.className = "order-actions";
    if (canRefundOrder(order)) {
      const refundButton = document.createElement("button");
      refundButton.type = "button";
      refundButton.className = "button-secondary button-danger";
      refundButton.textContent = "Reembolsar integralmente";
      refundButton.addEventListener("click", () => refundOrder(order, refundButton));
      actions.append(refundButton);
    }

    if (order.notes) {
      const notes = document.createElement("p");
      notes.className = "order-notes";
      notes.textContent = `Observações: ${order.notes}`;
      item.append(header, customer, delivery, products, totals);
      if (actions.childElementCount) item.append(actions);
      item.append(notes);
    } else {
      item.append(header, customer, delivery, products, totals);
      if (actions.childElementCount) item.append(actions);
    }
    ordersList.append(item);
  });
}

async function loadOrders() {
  ordersError.classList.add("hidden");
  ordersRefresh.disabled = true;
  ordersRefresh.textContent = "Atualizando...";
  try {
    await loadPlanUsage();
    await loadBrazilianStates();
    const [connectResult, ordersResult] = await Promise.all([
      authenticatedApi("/api/connect/status"),
      authenticatedApi("/api/orders"),
      loadDeliveryCities(),
    ]);
    renderConnectStatus(connectResult.payment);
    renderOrders(ordersResult.orders || []);
    if (activeViewName === "orders") markPaidOrdersSeen(ordersResult.orders || []);
    const latestPaidOrder = getPaidOrders(ordersResult.orders || [])[0];
    if (latestPaidOrder) lastPaidOrderId = latestPaidOrder.id;
  } catch (error) {
    console.error(error);
    ordersError.textContent = error.message;
    ordersError.classList.remove("hidden");
  } finally {
    ordersRefresh.disabled = false;
    ordersRefresh.textContent = "Atualizar";
  }
}

async function openOrders() {
  await requestOrderNotificationPermission();
  ordersReturnView = activeViewName === "orders" ? "items" : activeViewName;
  ordersError.classList.add("hidden");
  ordersSuccess.classList.add("hidden");
  showView("orders");
  await loadOrders();
}

async function refreshOrdersBadge({ notify = false } = {}) {
  if (!currentUser || !currentRestaurant) return;
  try {
    const result = await authenticatedApi("/api/orders");
    const orders = result.orders || [];
    if (activeViewName !== "orders") updateOrdersBadge(orders);
    const latestPaidOrder = getPaidOrders(orders)[0];
    if (notify && latestPaidOrder && lastPaidOrderId && latestPaidOrder.id !== lastPaidOrderId) {
      notifyNewPaidOrder(latestPaidOrder);
    }
    if (latestPaidOrder) lastPaidOrderId = latestPaidOrder.id;
    if (activeViewName === "orders") {
      renderOrders(orders);
      markPaidOrdersSeen(orders);
    }
  } catch (error) {
    console.error("Could not refresh order notifications", error);
  }
}

function startOrdersPolling() {
  window.clearInterval(ordersPollTimer);
  if (!currentUser || !currentRestaurant) return;
  refreshOrdersBadge();
  ordersPollTimer = window.setInterval(() => refreshOrdersBadge({ notify: true }), 30000);
}

function stopOrdersPolling() {
  window.clearInterval(ordersPollTimer);
  ordersPollTimer = null;
  ordersBadge.classList.add("hidden");
}

function showError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function showCategoryError(message) {
  categoryError.textContent = message;
  categoryError.classList.remove("hidden");
}

function showProductError(message) {
  productError.textContent = message;
  productError.classList.remove("hidden");
}

function setSubmitting(submitting) {
  submitButton.disabled = submitting;
  submitButton.innerHTML = submitting
    ? '<span class="button-spinner"></span> Salvando...'
    : "Continuar para categorias <span>→</span>";
}

async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const body = await response.text();
  console.error("Unexpected API response", response.status, body);
  throw new Error(`A API retornou uma resposta inválida (${response.status}).`);
}

async function uploadImage(file, endpoint) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Sua sessão expirou. Entre novamente.");

  const uploadResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": file.type,
      Authorization: `Bearer ${sessionData.session.access_token}`,
      "X-File-Size": String(file.size),
    },
    body: file,
  });
  const upload = await readApiResponse(uploadResponse);
  if (!uploadResponse.ok) throw new Error(upload.error);

  return upload.key;
}

async function deleteStoredImage(key) {
  if (!key) return;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return;

  const response = await fetch(`/api/uploads?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });
  if (!response.ok) console.error("Could not remove stored image", response.status);
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível converter a imagem."))),
      "image/webp",
      quality,
    );
  });
}

async function optimizeImage(file, { maxDimension, targetSize, outputName, aspectRatio = null }) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.width;
  let sourceHeight = image.height;

  if (aspectRatio) {
    const imageRatio = image.width / image.height;
    if (imageRatio > aspectRatio) {
      sourceWidth = Math.round(image.height * aspectRatio);
      sourceX = Math.round((image.width - sourceWidth) / 2);
    } else if (imageRatio < aspectRatio) {
      sourceHeight = Math.round(image.width / aspectRatio);
      sourceY = Math.round((image.height - sourceHeight) / 2);
    }
  }

  const outputLongSide = Math.min(maxDimension, Math.max(sourceWidth, sourceHeight));
  const scale = Math.min(1, outputLongSide / Math.max(sourceWidth, sourceHeight));
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const context = canvas.getContext("2d", { alpha: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  image.close();

  let blob;
  for (const quality of [0.86, 0.76, 0.66, 0.56]) {
    blob = await canvasToBlob(canvas, quality);
    if (blob.size <= targetSize) break;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || outputName;
  return new File([blob], `${baseName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

function optimizeLogo(file) {
  return optimizeImage(file, {
    maxDimension: 800,
    targetSize: 500 * 1024,
    outputName: "logo",
  });
}

function optimizeProductImage(file) {
  return optimizeImage(file, {
    maxDimension: 1200,
    targetSize: 700 * 1024,
    outputName: "produto",
    aspectRatio: 4 / 5,
  });
}

function formatFileSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeWhatsapp(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return /^[1-9][0-9]{9,14}$/.test(normalized) ? normalized : undefined;
}

function normalizeInstagram(value) {
  let username = value.trim().toLowerCase();
  if (!username) return null;
  username = username
    .replace(/^https?:\/\/(?:www\.)?instagram\.com\//, "")
    .replace(/^@/, "")
    .replace(/\/$/, "")
    .split(/[?#]/)[0];
  return /^[a-z0-9._]{1,30}$/.test(username) ? username : undefined;
}

function normalizeDeliveryCity(value) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeDeliveryState(value) {
  return value.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
}

function normalizeCep(value) {
  return value.replace(/\D/g, "").slice(0, 8);
}

function getContrastColor(hexColor) {
  const channels = hexColor.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16));
  const luminance = (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000;
  return luminance > 145 ? "#1b1a17" : "#ffffff";
}

function updateThemePreview() {
  const color = /^#[0-9a-fA-F]{6}$/.test(themeColorText.value)
    ? themeColorText.value
    : themeColor.value;
  themePreview.style.backgroundColor = color;
  themePreviewName.textContent = settingsRestaurantName.value.trim() || currentRestaurant?.name || "Sua loja";
  themePreviewTagline.textContent = settingsMenuTagline.value.trim() || "Escolha seus favoritos.";
}

function setSettingsLogoPreview(source) {
  settingsLogoPreview.replaceChildren();
  themePreviewLogo.replaceChildren();

  if (!source) {
    settingsLogoPreview.innerHTML = "<strong>+</strong>";
    themePreviewLogo.textContent = "S";
    return;
  }

  const settingsImage = document.createElement("img");
  settingsImage.src = source;
  settingsImage.alt = "Prévia da logo";
  const previewImage = settingsImage.cloneNode();
  previewImage.alt = "";
  settingsLogoPreview.append(settingsImage);
  themePreviewLogo.append(previewImage);
}

async function openSettings() {
  settingsReturnView = activeViewName;
  settingsError.classList.add("hidden");
  settingsSuccess.classList.add("hidden");
  settingsForm.reset();
  optimizedSettingsLogo = null;
  settingsLogoProcessingPromise = Promise.resolve(null);

  try {
    await loadPlanUsage();
  } catch (error) {
    console.error(error);
  }

  const color = currentRestaurant.background_color || "#f4f1e9";
  settingsRestaurantName.value = currentRestaurant.name;
  settingsMenuTagline.value = currentRestaurant.menu_tagline || "Escolha seus favoritos.";
  themeColor.value = color;
  themeColorText.value = color;
  whatsappNumber.value = currentRestaurant.whatsapp_number ? `+${currentRestaurant.whatsapp_number}` : "";
  instagramUsername.value = currentRestaurant.instagram_username ? `@${currentRestaurant.instagram_username}` : "";
  customDomainGroup.classList.toggle("hidden", planUsage.plan !== "pro");
  customDomainInput.value = currentRestaurant.custom_domain?.replace(/^menu\./, "") || "";
  renderCustomDomainStatus({
    domain: currentRestaurant.custom_domain,
    status: currentRestaurant.custom_domain_status,
    cname: currentRestaurant.custom_domain ? {
      name: currentRestaurant.custom_domain,
      target: "proxy-fallback.shackmenu.com",
    } : null,
  });
  settingsLogoTitle.textContent = currentRestaurant.logo_key ? "Alterar logo" : "Adicionar logo";
  settingsLogoHint.textContent = "JPG, PNG ou WebP, até 10 MB";
  const currentLogo = currentRestaurant.logo_key
    ? `/api/media?key=${encodeURIComponent(currentRestaurant.logo_key)}`
    : null;
  setSettingsLogoPreview(currentLogo);
  updateThemePreview();
  showView("settings");

  if (planUsage.plan === "pro" && currentRestaurant.custom_domain) {
    refreshCustomDomain().catch((error) => console.error(error));
  }
}

function renderCustomDomainStatus(result) {
  customDomainStatus.classList.toggle("hidden", !result?.domain);
  if (!result?.domain) return;

  const active = result.status === "active";
  customDomainStatus.classList.toggle("domain-status-active", active);
  customDomainStatus.classList.toggle("domain-status-pending", !active);
  customDomainStatusTitle.textContent = active ? "Domínio ativo" : "Aguardando configuração do DNS";
  customDomainStatusCopy.textContent = active
    ? "Seu cardápio está disponível neste endereço:"
    : "No provedor do seu domínio, crie o seguinte registro CNAME:";
  customDomainLink.classList.toggle("hidden", !active);
  customDomainLink.href = active ? `https://${result.domain}` : "#";
  customDomainLink.textContent = active ? `https://${result.domain}` : "";
  customDomainCname.classList.toggle("hidden", active);
  customDomainCnameName.textContent = "menu";
  customDomainCnameTarget.textContent = result.cname?.target?.replace(/\.$/, "") || "";
}

async function requestCustomDomain(domain, method = "POST") {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sua sessão expirou.");
  const response = await fetch("/api/domains", {
    method,
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "POST" ? JSON.stringify({ domain }) : undefined,
  });
  const result = await readApiResponse(response);
  if (!response.ok) throw new Error(result.error);
  return result;
}

async function refreshCustomDomain() {
  const result = await requestCustomDomain(null, "GET");
  currentRestaurant = {
    ...currentRestaurant,
    custom_domain: result.domain,
    custom_domain_status: result.status,
  };
  renderCustomDomainStatus(result);
  renderSharePanel();
}

async function openUpgrade() {
  upgradeReturnView = activeViewName === "upgrade" ? "items" : activeViewName;
  upgradeError.classList.add("hidden");

  try {
    await loadPlanUsage();
  } catch (error) {
    console.error(error);
  }

  renderUpgradePlanState();
  showView("upgrade");
}

function renderUpgradePlanState() {
  const isPro = planUsage.plan === "pro";
  freePlanCurrent.textContent = isPro ? "Plano incluído" : "Plano atual";
  proPlanAction.textContent = isPro ? "Gerenciar assinatura" : "Assinar o Pro";
  upgradeButton.textContent = isPro ? "Gerenciar plano" : "Upgrade";
}

async function waitForProActivation() {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    await loadPlanUsage();
    if (planUsage.plan === "pro") {
      renderUpgradePlanState();
      upgradeMessage.textContent = "Plano Pro ativado. A taxa Shack Menu foi removida dos pedidos pagos.";
      billingNotice.textContent = "Plano Pro ativado. A taxa Shack Menu foi removida dos pedidos pagos.";
      billingNotice.classList.remove("hidden");
      window.setTimeout(() => billingNotice.classList.add("hidden"), 5000);
      return;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 2000));
  }

  upgradeMessage.textContent = "Pagamento recebido. A confirmação está demorando mais que o esperado; atualize a página em alguns instantes.";
  billingNotice.textContent = upgradeMessage.textContent;
}

async function createBillingSession(endpoint) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Sua sessão expirou.");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
  });
  const result = await readApiResponse(response);
  if (!response.ok) throw new Error(result.error);
  return result;
}

async function handlePlanButton() {
  if (planUsage.plan !== "pro") {
    await openUpgrade();
    return;
  }

  upgradeButton.disabled = true;
  upgradeButton.textContent = "Abrindo...";
  try {
    const session = await createBillingSession("/api/billing/portal");
    window.location.assign(session.url);
  } catch (error) {
    console.error(error);
    upgradeButton.textContent = "Tente novamente";
    window.setTimeout(() => {
      upgradeButton.disabled = false;
      upgradeButton.textContent = "Gerenciar plano";
    }, 1800);
  }
}

async function loadRestaurant() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, logo_key, slug, published_at, background_color, menu_tagline, whatsapp_number, instagram_username, custom_domain, custom_domain_status")
    .eq("owner_id", currentUser.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    currentRestaurant = data;
    showView("categories");

    try {
      await loadCategories();
      if (categories.length > 0) await openItems();
    } catch (error) {
      console.error(error);
      showCategoryError("Não foi possível carregar as categorias. Execute a nova migration do Supabase.");
    }
    return;
  }

  showView("restaurant");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "cardapio";
}

function getPublicMenuPath() {
  const match = window.location.pathname.match(/^\/m\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getCustomMenuDomain() {
  const hostname = window.location.hostname.toLowerCase();
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const isPagesHost = hostname === "shackmenu-axb.pages.dev" || hostname.endsWith(".pages.dev");
  const isPlatformHost = [
    "shackmenu.com",
    "www.shackmenu.com",
    "app.shackmenu.com",
    "customers.shackmenu.com",
    "proxy-fallback.shackmenu.com",
  ].includes(hostname);
  return !isLocal && !isPagesHost && !isPlatformHost && window.location.pathname === "/" ? hostname : null;
}

function normalizeCustomDomain(value) {
  const normalized = value.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  if (!normalized) return null;
  if (normalized.includes("/") || normalized.includes(":") || normalized.includes("?") || normalized.includes("#")) return undefined;
  if (normalized.length > 253 || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(normalized)) return undefined;
  return normalized;
}

function renderSharePanel() {
  const isPublished = Boolean(currentRestaurant?.slug && currentRestaurant?.published_at);
  publishMenu.classList.toggle("hidden", isPublished);
  sharePanel.classList.toggle("hidden", !isPublished);

  if (!isPublished) return;
  const url = currentRestaurant.custom_domain && currentRestaurant.custom_domain_status === "active"
    ? `https://${currentRestaurant.custom_domain}/m/${currentRestaurant.slug}`
    : `${window.location.origin}/m/${currentRestaurant.slug}`;
  publicMenuUrl.value = url;
  openPublicMenu.href = url;
}

function getPublicCartStorageKey() {
  return activePublicMenu ? `shackmenu:cart:${activePublicMenu.restaurant.id}` : null;
}

function getPublicMenuProducts() {
  return activePublicMenu?.categories.flatMap((category) => category.products) || [];
}

function savePublicCart() {
  const key = getPublicCartStorageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(publicCart));
  } catch (error) {
    console.error("Could not save cart", error);
  }
}

function loadPublicCart() {
  const key = getPublicCartStorageKey();
  const availableIds = new Set(getPublicMenuProducts().map((product) => product.id));
  publicCart = [];
  if (!key) return;

  try {
    const storedCart = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(storedCart)) return;
    publicCart = storedCart
      .filter((item) => availableIds.has(item.productId) && Number.isInteger(item.quantity))
      .map((item) => ({ productId: item.productId, quantity: Math.min(99, Math.max(1, item.quantity)) }));
  } catch (error) {
    console.error("Could not load cart", error);
  }
}

function getPublicCartDetails() {
  const productsById = new Map(getPublicMenuProducts().map((product) => [product.id, product]));
  return publicCart.flatMap((item) => {
    const product = productsById.get(item.productId);
    return product ? [{ ...item, product, subtotal: product.price_cents * item.quantity }] : [];
  });
}

function getPublicDeliveryFee() {
  return Math.max(0, Number(activePublicMenu?.restaurant?.delivery_fee_cents || 0));
}

function updatePublicCartItem(productId, change) {
  const item = publicCart.find((cartItem) => cartItem.productId === productId);
  if (!item && change > 0) publicCart.push({ productId, quantity: 1 });
  if (item) item.quantity = Math.min(99, item.quantity + change);
  publicCart = publicCart.filter((cartItem) => cartItem.quantity > 0);
  savePublicCart();
  renderPublicCart();
}

function openPublicCart() {
  publicCartOverlay.classList.remove("hidden");
  document.body.classList.add("cart-open");
  publicCartClose.focus();
}

function closePublicCart() {
  publicCartOverlay.classList.add("hidden");
  document.body.classList.remove("cart-open");
  publicCartButton.focus();
}

function renderPublicCart() {
  const details = getPublicCartDetails();
  const itemCount = details.reduce((total, item) => total + item.quantity, 0);
  const subtotal = details.reduce((total, item) => total + item.subtotal, 0);
  const deliveryFeeValue = getPublicDeliveryFee();
  const total = subtotal + deliveryFeeValue;
  publicCartCount.textContent = `${itemCount} ${itemCount === 1 ? "item" : "itens"}`;
  publicCartItems.replaceChildren();
  publicCartEmpty.classList.toggle("hidden", details.length > 0);
  publicCartSummary.classList.toggle("hidden", details.length === 0);
  publicCartSubtotal.textContent = formatPrice(subtotal);
  publicCartDelivery.textContent = deliveryFeeValue > 0 ? formatPrice(deliveryFeeValue) : "Grátis";
  publicCartTotal.textContent = formatPrice(total);

  details.forEach(({ product, quantity, subtotal: itemSubtotal }) => {
    const item = document.createElement("article");
    item.className = "public-cart-item";
    const copy = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = product.name;
    const price = document.createElement("small");
    price.textContent = formatPrice(itemSubtotal);
    copy.append(name, price);

    const quantityControl = document.createElement("div");
    quantityControl.className = "public-cart-quantity";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", `Remover uma unidade de ${product.name}`);
    decrease.addEventListener("click", () => updatePublicCartItem(product.id, -1));
    const value = document.createElement("span");
    value.textContent = quantity;
    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", `Adicionar uma unidade de ${product.name}`);
    increase.addEventListener("click", () => updatePublicCartItem(product.id, 1));
    quantityControl.append(decrease, value, increase);
    item.append(copy, quantityControl);
    publicCartItems.append(item);
  });
}

function sendPublicCartToWhatsapp() {
  if (!activePublicMenu?.restaurant.whatsapp_number) return;
  const details = getPublicCartDetails();
  if (!details.length) return;

  const subtotal = details.reduce((total, item) => total + item.subtotal, 0);
  const deliveryFeeValue = getPublicDeliveryFee();
  const lines = [
    `Olá! Gostaria de fazer um pedido no ${activePublicMenu.restaurant.name}:`,
    "",
    ...details.map(({ product, quantity, subtotal: itemSubtotal }) => `• ${quantity}x ${product.name} — ${formatPrice(itemSubtotal)}`),
    "",
    `Subtotal: ${formatPrice(subtotal)}`,
    `Entrega: ${deliveryFeeValue > 0 ? formatPrice(deliveryFeeValue) : "Grátis"}`,
    `Total: ${formatPrice(subtotal + deliveryFeeValue)}`,
  ];
  const notes = publicOrderNotes.value.trim();
  if (notes) lines.push("", `Observações: ${notes}`);
  lines.push("", "Podemos combinar a entrega e o pagamento?");
  window.open(`https://wa.me/${activePublicMenu.restaurant.whatsapp_number}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
}

function getPublicCustomerPayload() {
  return {
    customerName: publicCustomerName.value.trim(),
    customerEmail: publicCustomerEmail.value.trim(),
    customerPhone: publicCustomerPhone.value.trim(),
    customerDocument: publicCustomerDocument.value.trim(),
    deliveryCep: publicDeliveryAddress?.cep || "",
    deliveryComplement: publicDeliveryAddress?.complement || "",
    notes: publicOrderNotes.value.trim(),
  };
}

async function checkoutPublicCart() {
  const details = getPublicCartDetails();
  if (!activePublicMenu?.restaurant?.id || !details.length) return;

  const customer = getPublicCustomerPayload();
  if (customer.customerName.length < 2) {
    publicCustomerName.focus();
    alert("Informe seu nome para identificar o pedido.");
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.customerEmail)) {
    publicCustomerEmail.focus();
    alert("Informe um e-mail válido para o pagamento online.");
    return;
  }
  if (customer.customerDocument && customer.customerDocument.replace(/\D/g, "").length !== 11) {
    publicCustomerDocument.focus();
    alert("Informe um CPF com 11 dígitos ou deixe o campo em branco.");
    return;
  }
  if (!publicDeliveryAddress) {
    closePublicCart();
    renderPublicAddressState();
    alert("Informe o endereço de entrega antes de finalizar o pedido.");
    return;
  }
  if (activePublicMenu.restaurant.delivery_cities?.length === 0) {
    alert("Esta loja ainda não configurou as cidades de entrega.");
    return;
  }

  publicCartCheckout.disabled = true;
  publicCartCheckout.innerHTML = '<span class="button-spinner"></span> Abrindo pagamento...';
  try {
    const response = await fetch("/api/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: activePublicMenu.restaurant.id,
        items: publicCart,
        returnUrl: window.location.href,
        ...customer,
      }),
    });
    const result = await readApiResponse(response);
    if (!response.ok) throw new Error(result.error || "Não foi possível iniciar o pagamento.");
    if (result.orderNumber) {
      try {
        localStorage.setItem(pendingPublicOrderKey, JSON.stringify({
          restaurantId: activePublicMenu.restaurant.id,
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          createdAt: Date.now(),
        }));
      } catch (error) {
        console.error("Could not save pending order confirmation", error);
      }
    }
    window.location.assign(result.url);
  } catch (error) {
    console.error(error);
    alert(error.message || "Não foi possível iniciar o pagamento.");
    publicCartCheckout.disabled = false;
    publicCartCheckout.textContent = "Pagar online";
  }
}

function createPublicProductCard(product) {
  const card = document.createElement("article");
  card.className = "public-product-card";

  if (product.image_key) {
    const image = document.createElement("img");
    image.src = `/api/media?key=${encodeURIComponent(product.image_key)}`;
    image.alt = product.name;
    image.loading = "lazy";
    card.append(image);
  }

  const body = document.createElement("div");
  body.className = "public-product-body";
  const heading = document.createElement("div");
  heading.className = "public-product-heading";
  const name = document.createElement("h3");
  name.textContent = product.name;
  const price = document.createElement("strong");
  price.textContent = formatPrice(product.price_cents);
  heading.append(name, price);
  body.append(heading);

  if (product.description) {
    const description = document.createElement("p");
    description.textContent = product.description;
    body.append(description);
  }

  if (activePublicMenu?.restaurant.whatsapp_number || activePublicMenu?.restaurant.payment_online_active) {
    const addButton = document.createElement("button");
    addButton.className = "public-product-add";
    addButton.type = "button";
    addButton.textContent = "Adicionar ao pedido";
    addButton.addEventListener("click", () => {
      updatePublicCartItem(product.id, 1);
      addButton.textContent = "Adicionado ✓";
      window.setTimeout(() => { addButton.textContent = "Adicionar ao pedido"; }, 1200);
    });
    body.append(addButton);
  }

  card.append(body);
  return card;
}

function renderPublicMenu(menu) {
  activePublicMenu = menu;
  loadPublicDeliveryAddress();
  loadPublicCart();
  const visibleCategories = menu.categories.filter((category) => category.products.length > 0);
  updatePublicMenuSeoMeta(menu);
  siteHeader.classList.add("hidden");
  const backgroundColor = menu.restaurant.background_color || "#f4f1e9";
  views.publicMenu.style.setProperty("--menu-background", backgroundColor);
  views.publicMenu.style.setProperty("--menu-foreground", getContrastColor(backgroundColor));
  publicRestaurantName.textContent = menu.restaurant.name;
  publicMenuTagline.textContent = menu.restaurant.menu_tagline || "Escolha seus favoritos.";
  publicCategoryNav.replaceChildren();
  publicMenuContent.replaceChildren();
  publicMenuFooter.classList.add("hidden");
  publicRestaurantLogo.classList.add("hidden");
  publicWhatsapp.classList.add("hidden");
  publicInstagram.classList.add("hidden");
  const onlineCheckoutActive = Boolean(menu.restaurant.payment_online_active || mercadoPagoTestMode);
  const canOrder = Boolean(menu.restaurant.whatsapp_number || onlineCheckoutActive);
  publicCartButton.classList.toggle("hidden", !canOrder);
  publicCartCheckout.classList.toggle("hidden", !onlineCheckoutActive);
  publicCartSend.classList.toggle("hidden", !menu.restaurant.whatsapp_number);

  if (menu.restaurant.logo_key) {
    publicRestaurantLogo.src = `/api/media?key=${encodeURIComponent(menu.restaurant.logo_key)}`;
    publicRestaurantLogo.alt = `Logo do ${menu.restaurant.name}`;
    publicRestaurantLogo.classList.remove("hidden");
  }

  if (menu.restaurant.whatsapp_number) {
    const message = encodeURIComponent(`Olá! Vim pelo cardápio do ${menu.restaurant.name}.`);
    publicWhatsapp.href = `https://wa.me/${menu.restaurant.whatsapp_number}?text=${message}`;
    publicWhatsapp.classList.remove("hidden");
  }

  if (menu.restaurant.instagram_username) {
    publicInstagram.href = `https://www.instagram.com/${menu.restaurant.instagram_username}/`;
    publicInstagramLabel.textContent = `@${menu.restaurant.instagram_username}`;
    publicInstagram.classList.remove("hidden");
  }

  visibleCategories.forEach((category) => {
    const anchor = document.createElement("a");
    anchor.href = `#category-${category.id}`;
    anchor.textContent = category.name;
    publicCategoryNav.append(anchor);

    const section = document.createElement("section");
    section.id = `category-${category.id}`;
    section.className = "public-category-section";
    const title = document.createElement("h2");
    title.textContent = category.name;
    const grid = document.createElement("div");
    grid.className = "public-products-grid";
    category.products.forEach((product) => grid.append(createPublicProductCard(product)));
    section.append(title, grid);
    publicMenuContent.append(section);
  });

  if (visibleCategories.length === 0) {
    const empty = document.createElement("p");
    empty.className = "public-menu-empty";
    empty.textContent = "Este cardápio ainda não possui produtos disponíveis.";
    publicMenuContent.append(empty);
  }

  const orderStatus = new URLSearchParams(window.location.search).get("order");
  if (orderStatus === "success") {
    let orderNumber = null;
    try {
      const pendingOrder = JSON.parse(localStorage.getItem(pendingPublicOrderKey) || "null");
      const isSameRestaurant = pendingOrder?.restaurantId === menu.restaurant.id;
      const isRecent = pendingOrder?.createdAt && Date.now() - pendingOrder.createdAt < 24 * 60 * 60 * 1000;
      if (isSameRestaurant && isRecent) orderNumber = pendingOrder.orderNumber;
      localStorage.removeItem(pendingPublicOrderKey);
    } catch (error) {
      console.error("Could not read pending order confirmation", error);
    }
    publicCart = [];
    savePublicCart();
    window.history.replaceState({}, "", window.location.pathname);
    const message = orderNumber
      ? `Pedido #${orderNumber} confirmado. Anote esse número para acompanhar com a loja. Também enviamos os detalhes por e-mail.`
      : "Pedido confirmado. Anote essa confirmação para acompanhar com a loja. Também enviamos os detalhes por e-mail.";
    window.setTimeout(() => alert(message), 200);
  } else if (orderStatus === "cancelled") {
    localStorage.removeItem(pendingPublicOrderKey);
    window.history.replaceState({}, "", window.location.pathname);
    window.setTimeout(() => alert("Pagamento não concluído. Seu pedido continua no carrinho."), 200);
  }
  renderPublicAddressState();
  renderPublicCart();
}

async function loadPublicMenu({ slug, domain }) {
  showView("loading");
  const { data, error } = domain
    ? await supabase.rpc("get_public_menu_by_domain", { menu_domain: domain })
    : await supabase.rpc("get_public_menu", { menu_slug: slug });

  if (error || !data) {
    views.loading.innerHTML = '<div class="setup-error"><strong>Cardápio não encontrado</strong><p>Confira o endereço ou tente novamente mais tarde.</p></div>';
    return;
  }

  if (slug && data.restaurant.slug && data.restaurant.slug !== slug) {
    window.history.replaceState({}, "", `/m/${data.restaurant.slug}`);
  }

  renderPublicMenu(data);
  showView("publicMenu");
  window.requestAnimationFrame(updatePublicStickyOffsets);
}

function renderCategories() {
  categoryList.replaceChildren();
  categoryEmpty.classList.toggle("hidden", categories.length > 0);
  categoriesContinue.disabled = categories.length === 0;
  categoryCount.textContent = `${categories.length} ${categories.length === 1 ? "categoria" : "categorias"}`;

  categories.forEach((category, index) => {
    const item = document.createElement("article");
    item.className = "category-item";

    const number = document.createElement("span");
    number.className = "category-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const name = document.createElement("strong");
    name.textContent = category.name;

    const remove = document.createElement("button");
    remove.className = "category-remove";
    remove.type = "button";
    remove.dataset.categoryId = category.id;
    remove.setAttribute("aria-label", `Remover categoria ${category.name}`);
    remove.textContent = "Remover";

    item.append(number, name, remove);
    categoryList.append(item);
  });
}

async function loadCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, position")
    .eq("restaurant_id", currentRestaurant.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  categories = data;
  renderCategories();
}

function populateProductCategories() {
  const selectedCategory = productCategory.value;
  productCategory.replaceChildren();

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    productCategory.append(option);
  });

  if (categories.some(({ id }) => id === selectedCategory)) {
    productCategory.value = selectedCategory;
  }
}

function formatPrice(priceCents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}

function parsePriceToCents(value) {
  const compact = value.trim().replace(/\s/g, "");
  const normalized = compact.includes(",")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact;

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function parseOptionalPriceToCents(value) {
  const compact = String(value || "").trim().replace(/\s/g, "");
  if (!compact) return 0;
  const normalized = compact.includes(",")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact;

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return 0;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : 0;
}

function applyProductQuota() {
  planUsage.product_count = products.length;
  const atLimit = products.length >= planUsage.product_limit;
  productQuotaWarning.classList.toggle("hidden", !atLimit);
  productForm.querySelectorAll("input, select, textarea").forEach((field) => {
    field.disabled = atLimit;
  });
  productSubmit.disabled = atLimit;
}

async function loadPlanUsage() {
  const { data, error } = await supabase.rpc("get_plan_usage");
  if (error) throw error;
  planUsage = data || { plan: "free", product_count: products.length, product_limit: 200 };
  upgradeButton.textContent = planUsage.plan === "pro" ? "Gerenciar plano" : "Upgrade";
}

function renderProducts() {
  productList.replaceChildren();
  productEmpty.classList.toggle("hidden", products.length > 0);
  finishMenu.disabled = products.length === 0;
  productCount.textContent = `${products.length} de ${planUsage.product_limit} produtos`;

  products.forEach((product) => {
    const item = document.createElement("article");
    item.className = "product-item";

    const image = document.createElement(product.image_key ? "img" : "span");
    image.className = "product-thumb";
    if (product.image_key) {
      image.src = `/api/media?key=${encodeURIComponent(product.image_key)}`;
      image.alt = "";
      image.loading = "lazy";
    } else {
      image.textContent = product.name.slice(0, 1).toUpperCase();
    }

    const details = document.createElement("div");
    details.className = "product-details";
    const name = document.createElement("strong");
    name.textContent = product.name;
    const category = document.createElement("small");
    category.textContent = categories.find(({ id }) => id === product.category_id)?.name || "Categoria";
    details.append(name, category);

    const price = document.createElement("strong");
    price.className = "product-item-price";
    price.textContent = formatPrice(product.price_cents);

    const remove = document.createElement("button");
    remove.className = "category-remove";
    remove.type = "button";
    remove.dataset.productId = product.id;
    remove.setAttribute("aria-label", `Remover produto ${product.name}`);
    remove.textContent = "Remover";

    item.append(image, details, price, remove);
    productList.append(item);
  });
  applyProductQuota();
}

async function loadProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, category_id, name, description, price_cents, image_key, position")
    .eq("restaurant_id", currentRestaurant.id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  products = data;
  renderProducts();
}

async function openItems() {
  populateProductCategories();
  showView("items");
  productError.classList.add("hidden");

  try {
    await loadPlanUsage();
    await loadProducts();
  } catch (error) {
    console.error(error);
    products = [];
    renderProducts();
    showProductError("Não foi possível carregar os produtos. Execute a nova migration do Supabase.");
  }
}

async function handleSession(session) {
  currentUser = session?.user ?? null;

  if (!currentUser) {
    stopOrdersPolling();
    showView("login");
    return;
  }

  try {
    await loadAdminAccess();
    await loadRestaurant();
    startOrdersPolling();
  } catch (error) {
    console.error(error);
    showView("restaurant");
    showError("Não foi possível consultar a loja. Confira se a migration do Supabase foi executada.");
  }
}

function openTerms() {
  showView("terms");
  window.history.replaceState({}, "", "#terms");
}

async function init() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();

    if (!response.ok) {
      throw new Error(config.error);
    }

    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    applicationUrl = config.appUrl || window.location.origin;
    mercadoPagoTestMode = Boolean(config.mercadoPagoTestMode);
    const publicSlug = getPublicMenuPath();
    const customMenuDomain = getCustomMenuDomain();
    if (publicSlug || customMenuDomain) {
      await loadPublicMenu({ slug: publicSlug, domain: customMenuDomain });
      return;
    }

    if (window.location.hash === "#terms") {
      showView("terms");
      return;
    }

    const { data } = await supabase.auth.getSession();
    await handleSession(data.session);

    const upgradeStatus = new URLSearchParams(window.location.search).get("upgrade");
    if (currentRestaurant && upgradeStatus) {
      if (upgradeStatus === "success") {
        billingNotice.textContent = planUsage.plan === "pro"
          ? "Plano Pro ativado. A taxa Shack Menu foi removida dos pedidos pagos."
          : "Pagamento recebido. Aguardando confirmação da Stripe...";
        billingNotice.classList.remove("hidden");
      } else {
        await openUpgrade();
        upgradeMessage.textContent = "Assinatura não concluída. Nenhuma cobrança foi realizada.";
        upgradeMessage.classList.remove("hidden");
      }
      window.history.replaceState({}, "", window.location.pathname);
      if (upgradeStatus === "success" && planUsage.plan !== "pro") {
        waitForProActivation().catch((error) => console.error("Could not confirm Pro activation", error));
      } else if (upgradeStatus === "success") {
        window.setTimeout(() => billingNotice.classList.add("hidden"), 5000);
      }
    }

    const connectStatus = new URLSearchParams(window.location.search).get("connect");
    if (currentRestaurant && connectStatus) {
      window.history.replaceState({}, "", window.location.pathname);
      await openOrders();
      ordersSuccess.textContent = connectStatus === "return"
        ? "Mercado Pago conectado. O status dos recebimentos foi atualizado."
        : "Link do Mercado Pago expirado. Gere um novo link para continuar o onboarding.";
      ordersSuccess.classList.remove("hidden");
    }

    supabase.auth.onAuthStateChange((event, session) => {
      const newLogin = event === "SIGNED_IN" && !currentUser;
      if (newLogin || event === "SIGNED_OUT") {
        window.setTimeout(() => handleSession(session), 0);
      }
    });
  } catch (error) {
    views.loading.innerHTML = `<div class="setup-error"><strong>Configuração pendente</strong><p>${error.message}</p></div>`;
  }
}

loginButton.addEventListener("click", async () => {
  loginButton.disabled = true;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${applicationUrl}/` },
  });

  if (error) {
    loginButton.disabled = false;
    alert(`Não foi possível entrar com Google: ${error.message}`);
  }
});

signOutButton.addEventListener("click", () => supabase.auth.signOut());
adminButton.addEventListener("click", openAdmin);
ordersButton.addEventListener("click", openOrders);
customizeButton.addEventListener("click", openSettings);
upgradeButton.addEventListener("click", handlePlanButton);
quotaUpgrade.addEventListener("click", openUpgrade);
settingsBack.addEventListener("click", () => showView(settingsReturnView));
adminBack.addEventListener("click", () => showView(adminReturnView));
adminRefresh.addEventListener("click", loadAdminCustomers);
ordersBack.addEventListener("click", () => showView(ordersReturnView));
ordersRefresh.addEventListener("click", loadOrders);
upgradeBack.addEventListener("click", () => showView(upgradeReturnView));
ordersTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-order-tab]");
  if (!button) return;
  activeOrdersTab = button.dataset.orderTab;
  renderOrders(allOrders);
});
deliveryCitiesSave.addEventListener("click", saveDeliveryCities);
deliveryCityState.addEventListener("change", async () => {
  ordersError.classList.add("hidden");
  deliveryCityName.disabled = true;
  deliveryCityName.replaceChildren(new Option("Carregando cidades...", ""));
  try {
    await loadBrazilianCitiesForState(deliveryCityState.value);
  } catch (error) {
    console.error(error);
    ordersError.textContent = error.message;
    ordersError.classList.remove("hidden");
    deliveryCityName.replaceChildren(new Option("Cidade", ""));
  }
});
deliveryCityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = deliveryCityName.value.trim();
  const state = normalizeDeliveryState(deliveryCityState.value);
  const normalizedCity = normalizeDeliveryCity(city);
  if (city.length < 2 || state.length !== 2 || !normalizedCity) {
    ordersError.textContent = "Selecione um estado e uma cidade válidos.";
    ordersError.classList.remove("hidden");
    return;
  }
  const exists = deliveryCities.some((entry) => (
    normalizeDeliveryCity(entry.city) === normalizedCity && entry.state === state
  ));
  if (!exists) deliveryCities.push({ city, state, normalized_city: normalizedCity });
  deliveryCityName.value = "";
  deliveryCityName.focus();
  ordersError.classList.add("hidden");
  renderDeliveryCities();
  saveDeliveryCities();
});
publicAddressLookup.addEventListener("click", lookupPublicAddress);
publicAddressChangeCep.addEventListener("click", () => {
  pendingPublicAddress = null;
  publicAddressCopy.textContent = "Informe seu CEP para verificar se a loja atende sua região.";
  publicAddressStepDetails.classList.add("hidden");
  publicAddressStepCep.classList.remove("hidden");
  publicAddressCep.focus();
});
publicAddressSummary.addEventListener("click", () => {
  publicDeliveryAddress = null;
  renderPublicAddressState();
});
window.addEventListener("resize", updatePublicStickyOffsets);
publicAddressForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const complement = publicAddressComplement.value.trim().replace(/\s+/g, " ");
  if (!pendingPublicAddress || !complement) {
    publicAddressError.textContent = "Informe o número ou complemento da entrega.";
    publicAddressError.classList.remove("hidden");
    publicAddressComplement.focus();
    return;
  }
  publicDeliveryAddress = {
    ...pendingPublicAddress,
    complement,
  };
  savePublicDeliveryAddress();
  renderPublicAddressState();
});

connectOnboarding.addEventListener("click", async () => {
  ordersError.classList.add("hidden");
  ordersSuccess.classList.add("hidden");
  connectOnboarding.disabled = true;
  connectOnboarding.innerHTML = '<span class="button-spinner"></span> Abrindo Mercado Pago...';
  try {
    const result = await authenticatedApi("/api/connect/onboarding", { method: "POST" });
    window.location.assign(result.url);
  } catch (error) {
    console.error(error);
    ordersError.textContent = error.message;
    ordersError.classList.remove("hidden");
    connectOnboarding.disabled = false;
    connectOnboarding.textContent = "Conectar Mercado Pago";
  }
});

adminCustomers.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-refund-owner]");
  if (!button) return;
  const confirmed = window.confirm(
    `Reembolsar integralmente a última fatura de ${button.dataset.refundLabel} e cancelar a assinatura imediatamente?`,
  );
  if (!confirmed) return;

  adminError.classList.add("hidden");
  adminSuccess.classList.add("hidden");
  button.disabled = true;
  button.textContent = "Processando...";
  try {
    const result = await authenticatedApi("/api/admin/refund", {
      method: "POST",
      body: JSON.stringify({
        ownerId: button.dataset.refundOwner,
        confirmation: "REEMBOLSAR",
      }),
    });
    adminSuccess.textContent = `Reembolso ${result.refundStatus} e assinatura ${result.subscriptionStatus}.`;
    adminSuccess.classList.remove("hidden");
    await loadAdminCustomers();
  } catch (error) {
    console.error(error);
    adminError.textContent = error.message;
    adminError.classList.remove("hidden");
    button.disabled = false;
    button.textContent = "Reembolsar";
  }
});

proPlanAction.addEventListener("click", async () => {
  upgradeError.classList.add("hidden");
  proPlanAction.disabled = true;
  proPlanAction.innerHTML = '<span class="button-spinner"></span> Redirecionando...';

  try {
    const endpoint = planUsage.plan === "pro" ? "/api/billing/portal" : "/api/billing/checkout";
    const session = await createBillingSession(endpoint);
    window.location.assign(session.url);
  } catch (error) {
    console.error(error);
    upgradeError.textContent = error.message || "Não foi possível iniciar a assinatura.";
    upgradeError.classList.remove("hidden");
    proPlanAction.disabled = false;
    proPlanAction.textContent = planUsage.plan === "pro" ? "Gerenciar assinatura" : "Assinar o Pro";
  }
});

themeColor.addEventListener("input", () => {
  themeColorText.value = themeColor.value;
  updateThemePreview();
});

themeColorText.addEventListener("input", () => {
  if (/^#[0-9a-fA-F]{6}$/.test(themeColorText.value)) {
    themeColor.value = themeColorText.value;
    updateThemePreview();
  }
});

settingsRestaurantName.addEventListener("input", updateThemePreview);
settingsMenuTagline.addEventListener("input", updateThemePreview);

publicCartButton.addEventListener("click", openPublicCart);
publicCartClose.addEventListener("click", closePublicCart);
publicCartOverlay.addEventListener("click", (event) => {
  if (event.target === publicCartOverlay) closePublicCart();
});
publicCartSend.addEventListener("click", sendPublicCartToWhatsapp);
publicCartCheckout.addEventListener("click", checkoutPublicCart);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !publicCartOverlay.classList.contains("hidden")) closePublicCart();
});

settingsLogoInput.addEventListener("change", async () => {
  const file = settingsLogoInput.files[0];
  optimizedSettingsLogo = null;
  if (!file) {
    settingsLogoProcessingPromise = Promise.resolve(null);
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    settingsLogoInput.value = "";
    settingsLogoProcessingPromise = Promise.resolve(null);
    settingsError.textContent = "A imagem original deve ter no máximo 10 MB.";
    settingsError.classList.remove("hidden");
    return;
  }

  settingsError.classList.add("hidden");
  settingsSuccess.classList.add("hidden");
  settingsLogoTitle.textContent = "Otimizando imagem...";
  settingsLogoHint.textContent = "Redimensionando e convertendo para WebP";
  settingsSubmit.disabled = true;
  settingsLogoProcessingPromise = optimizeLogo(file);

  try {
    const processedFile = await settingsLogoProcessingPromise;
    if (settingsLogoInput.files[0] !== file) return;

    optimizedSettingsLogo = processedFile;
    if (settingsLogoPreviewUrl) URL.revokeObjectURL(settingsLogoPreviewUrl);
    settingsLogoPreviewUrl = URL.createObjectURL(processedFile);
    setSettingsLogoPreview(settingsLogoPreviewUrl);
    settingsLogoTitle.textContent = "Imagem pronta";
    settingsLogoHint.textContent = `${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)} em WebP`;
  } catch (error) {
    console.error(error);
    settingsLogoInput.value = "";
    settingsLogoProcessingPromise = Promise.resolve(null);
    settingsError.textContent = "Não foi possível processar essa imagem.";
    settingsError.classList.remove("hidden");
  } finally {
    if (settingsLogoInput.files[0] === file) settingsSubmit.disabled = false;
  }
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  settingsError.classList.add("hidden");
  settingsSuccess.classList.add("hidden");

  const color = themeColorText.value.toLowerCase();
  const restaurantName = settingsRestaurantName.value.trim();
  const menuTagline = settingsMenuTagline.value.trim();
  if (restaurantName.length < 2 || restaurantName.length > 80) {
    settingsError.textContent = "O nome da loja deve ter entre 2 e 80 caracteres.";
    settingsError.classList.remove("hidden");
    return;
  }

  if (menuTagline.length < 1 || menuTagline.length > 120) {
    settingsError.textContent = "A frase de apresentação deve ter entre 1 e 120 caracteres.";
    settingsError.classList.remove("hidden");
    return;
  }

  if (!/^#[0-9a-f]{6}$/.test(color)) {
    settingsError.textContent = "Informe uma cor hexadecimal válida.";
    settingsError.classList.remove("hidden");
    return;
  }

  const normalizedWhatsapp = normalizeWhatsapp(whatsappNumber.value);
  if (normalizedWhatsapp === undefined) {
    settingsError.textContent = "Informe um WhatsApp válido com DDD.";
    settingsError.classList.remove("hidden");
    return;
  }

  const normalizedInstagram = normalizeInstagram(instagramUsername.value);
  if (normalizedInstagram === undefined) {
    settingsError.textContent = "Informe um usuário ou URL válida do Instagram.";
    settingsError.classList.remove("hidden");
    return;
  }

  const normalizedCustomDomain = planUsage.plan === "pro"
    ? normalizeCustomDomain(customDomainInput.value)
    : currentRestaurant.custom_domain;
  if (normalizedCustomDomain === undefined) {
    settingsError.textContent = "Informe apenas o domínio, por exemplo: menu.minhaloja.com.br.";
    settingsError.classList.remove("hidden");
    return;
  }

  settingsSubmit.disabled = true;
  settingsSubmit.innerHTML = '<span class="button-spinner"></span> Salvando...';
  const previousName = currentRestaurant.name;
  const oldLogoKey = currentRestaurant.logo_key;
  let newLogoKey = oldLogoKey;

  try {
    const newLogo = settingsLogoInput.files[0]
      ? optimizedSettingsLogo || await settingsLogoProcessingPromise
      : null;
    if (newLogo) newLogoKey = await uploadImage(newLogo, "/api/uploads/logo");

    const { data, error } = await supabase
      .from("restaurants")
      .update({
        name: restaurantName,
        background_color: color,
        menu_tagline: menuTagline,
        whatsapp_number: normalizedWhatsapp,
        instagram_username: normalizedInstagram,
        logo_key: newLogoKey,
      })
      .eq("id", currentRestaurant.id)
      .select("name, logo_key, background_color, menu_tagline, whatsapp_number, instagram_username")
      .single();

    if (error) throw error;
    currentRestaurant = { ...currentRestaurant, ...data };
    if (restaurantName !== previousName && currentRestaurant.published_at) {
      const { data: publishedRestaurant, error: slugError } = await supabase
        .rpc("publish_restaurant", { requested_slug: slugify(restaurantName) })
        .single();
      if (slugError) throw slugError;
      currentRestaurant = { ...currentRestaurant, ...publishedRestaurant };
    }
    updateThemePreview();
    if (planUsage.plan === "pro" && normalizedCustomDomain !== currentRestaurant.custom_domain) {
      const domainResult = await requestCustomDomain(normalizedCustomDomain);
      currentRestaurant = {
        ...currentRestaurant,
        custom_domain: domainResult.domain,
        custom_domain_status: domainResult.status,
      };
      customDomainInput.value = domainResult.domain?.replace(/^menu\./, "") || "";
      renderCustomDomainStatus(domainResult);
    }
    if (newLogoKey !== oldLogoKey) await deleteStoredImage(oldLogoKey);
    settingsLogoInput.value = "";
    optimizedSettingsLogo = null;
    settingsLogoProcessingPromise = Promise.resolve(null);
    settingsLogoTitle.textContent = "Alterar logo";
    settingsLogoHint.textContent = "JPG, PNG ou WebP, até 10 MB";
    renderSharePanel();
    settingsSuccess.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    if (newLogoKey !== oldLogoKey) await deleteStoredImage(newLogoKey);
    settingsError.textContent = "Não foi possível salvar a personalização.";
    settingsError.classList.remove("hidden");
  } finally {
    settingsSubmit.disabled = false;
    settingsSubmit.textContent = "Salvar personalização";
  }
});

logoInput.addEventListener("change", async () => {
  const file = logoInput.files[0];
  optimizedLogo = null;

  if (!file) {
    logoProcessingPromise = Promise.resolve(null);
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    logoInput.value = "";
    logoProcessingPromise = Promise.resolve(null);
    showError("A imagem original deve ter no máximo 10 MB.");
    return;
  }

  formError.classList.add("hidden");
  logoUploadTitle.textContent = "Otimizando imagem...";
  logoUploadHint.textContent = "Redimensionando e convertendo para WebP";
  submitButton.disabled = true;
  logoProcessingPromise = optimizeLogo(file);

  try {
    const processedFile = await logoProcessingPromise;
    if (logoInput.files[0] !== file) return;

    optimizedLogo = processedFile;
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = URL.createObjectURL(processedFile);
    logoPreview.innerHTML = `<img src="${logoPreviewUrl}" alt="Prévia da logo otimizada" />`;
    logoUploadTitle.textContent = "Imagem pronta";
    logoUploadHint.textContent = `${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)} em WebP`;
  } catch (error) {
    console.error(error);
    logoInput.value = "";
    logoProcessingPromise = Promise.resolve(null);
    logoUploadTitle.textContent = "Escolher uma imagem";
    logoUploadHint.textContent = "JPG, PNG ou WebP, até 10 MB";
    showError("Não foi possível processar essa imagem. Tente outro arquivo.");
  } finally {
    if (logoInput.files[0] === file) submitButton.disabled = false;
  }
});

productImageInput.addEventListener("change", async () => {
  const file = productImageInput.files[0];
  optimizedProductImage = null;

  if (!file) {
    productImageProcessingPromise = Promise.resolve(null);
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    productImageInput.value = "";
    productImageProcessingPromise = Promise.resolve(null);
    showProductError("A imagem original deve ter no máximo 10 MB.");
    return;
  }

  productError.classList.add("hidden");
  productUploadTitle.textContent = "Otimizando imagem...";
  productUploadHint.textContent = "Cortando em 4:5 e convertendo para WebP";
  productSubmit.disabled = true;
  productImageProcessingPromise = optimizeProductImage(file);

  try {
    const processedFile = await productImageProcessingPromise;
    if (productImageInput.files[0] !== file) return;

    optimizedProductImage = processedFile;
    if (productImagePreviewUrl) URL.revokeObjectURL(productImagePreviewUrl);
    productImagePreviewUrl = URL.createObjectURL(processedFile);
    productImagePreview.innerHTML = `<img src="${productImagePreviewUrl}" alt="Prévia da foto otimizada" />`;
    productUploadTitle.textContent = "Imagem pronta";
    productUploadHint.textContent = `${formatFileSize(file.size)} → ${formatFileSize(processedFile.size)} em WebP`;
  } catch (error) {
    console.error(error);
    productImageInput.value = "";
    productImageProcessingPromise = Promise.resolve(null);
    productUploadTitle.textContent = "Escolher uma imagem";
    productUploadHint.textContent = "JPG, PNG ou WebP, até 10 MB. Cortamos em retrato 4:5 antes do envio.";
    showProductError("Não foi possível processar essa imagem. Tente outro arquivo.");
  } finally {
    if (productImageInput.files[0] === file) applyProductQuota();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.classList.add("hidden");
  setSubmitting(true);

  const name = new FormData(form).get("name").trim();
  let logoKey = null;

  try {
    const logo = logoInput.files[0] ? optimizedLogo || await logoProcessingPromise : null;

    if (logo) {
      logoKey = await uploadImage(logo, "/api/uploads/logo");
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert({ owner_id: currentUser.id, name, logo_key: logoKey })
      .select("id, name, logo_key, slug, published_at, background_color, menu_tagline, whatsapp_number, instagram_username, custom_domain, custom_domain_status")
      .single();

    if (error) throw error;

    currentRestaurant = data;
    categories = [];
    renderCategories();
    showView("categories");
  } catch (error) {
    console.error(error);
    await deleteStoredImage(logoKey);
    showError(error.message || "Não foi possível criar a loja.");
  } finally {
    setSubmitting(false);
  }
});

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  categoryError.classList.add("hidden");
  categorySubmit.disabled = true;
  categorySubmit.textContent = "Adicionando...";

  const name = categoryInput.value.trim();
  try {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        restaurant_id: currentRestaurant.id,
        name,
        position: categories.length,
      })
      .select("id, name, position")
      .single();

    if (error) throw error;

    categories.push(data);
    categoryInput.value = "";
    renderCategories();
    categoryInput.focus();
  } catch (error) {
    console.error(error);
    const message = error.code === "23505"
      ? "Essa categoria já foi adicionada."
      : "Não foi possível adicionar a categoria.";
    showCategoryError(message);
  } finally {
    categorySubmit.disabled = false;
    categorySubmit.textContent = "Adicionar";
  }
});

categoryList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-category-id]");
  if (!button) return;

  const category = categories.find(({ id }) => id === button.dataset.categoryId);
  if (!category || !window.confirm(`Remover a categoria “${category.name}”?`)) return;

  button.disabled = true;
  const { error } = await supabase.from("categories").delete().eq("id", category.id);

  if (error) {
    console.error(error);
    button.disabled = false;
    showCategoryError("Não foi possível remover a categoria.");
    return;
  }

  categories = categories.filter(({ id }) => id !== category.id);
  renderCategories();
});

categoriesContinue.addEventListener("click", openItems);
itemsBack.addEventListener("click", () => showView("categories"));

productPrice.addEventListener("blur", () => {
  const cents = parsePriceToCents(productPrice.value);
  if (cents) productPrice.value = (cents / 100).toFixed(2).replace(".", ",");
});

function resetProductForm(categoryId) {
  productForm.reset();
  productCategory.value = categoryId;
  optimizedProductImage = null;
  productImageProcessingPromise = Promise.resolve(null);
  if (productImagePreviewUrl) URL.revokeObjectURL(productImagePreviewUrl);
  productImagePreviewUrl = null;
  productImagePreview.innerHTML = "<strong>+</strong>";
  productUploadTitle.textContent = "Escolher uma imagem";
  productUploadHint.textContent = "JPG, PNG ou WebP, até 10 MB. Cortamos em retrato 4:5 antes do envio.";
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  productError.classList.add("hidden");

  if (products.length >= planUsage.product_limit) {
    applyProductQuota();
    return;
  }

  const priceCents = parsePriceToCents(productPrice.value);
  if (!priceCents) {
    showProductError("Informe um preço válido, como 29,90.");
    productPrice.focus();
    return;
  }

  productSubmit.disabled = true;
  productSubmit.innerHTML = '<span class="button-spinner"></span> Adicionando...';
  const categoryId = productCategory.value;
  let imageKey = null;

  try {
    const image = productImageInput.files[0]
      ? optimizedProductImage || await productImageProcessingPromise
      : null;
    if (image) imageKey = await uploadImage(image, "/api/uploads/product");

    const { data, error } = await supabase
      .from("products")
      .insert({
        restaurant_id: currentRestaurant.id,
        category_id: categoryId,
        name: productName.value.trim(),
        description: productDescription.value.trim() || null,
        price_cents: priceCents,
        image_key: imageKey,
        position: products.filter((product) => product.category_id === categoryId).length,
      })
      .select("id, category_id, name, description, price_cents, image_key, position")
      .single();

    if (error) throw error;

    products.push(data);
    renderProducts();
    resetProductForm(categoryId);
    productName.focus();
  } catch (error) {
    console.error(error);
    await deleteStoredImage(imageKey);
    showProductError(error.message?.includes("PRODUCT_LIMIT_REACHED")
      ? "Você atingiu o limite máximo de produtos permitido por loja."
      : error.message || "Não foi possível adicionar o produto.");
  } finally {
    productSubmit.textContent = "Adicionar produto";
    applyProductQuota();
  }
});

productList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-product-id]");
  if (!button) return;

  const product = products.find(({ id }) => id === button.dataset.productId);
  if (!product || !window.confirm(`Remover o produto “${product.name}”?`)) return;

  button.disabled = true;
  const { error } = await supabase.from("products").delete().eq("id", product.id);

  if (error) {
    console.error(error);
    button.disabled = false;
    showProductError("Não foi possível remover o produto.");
    return;
  }

  products = products.filter(({ id }) => id !== product.id);
  renderProducts();
  await deleteStoredImage(product.image_key);
});

finishMenu.addEventListener("click", () => {
  publishError.classList.add("hidden");
  renderSharePanel();
  showView("complete");
});

publishMenu.addEventListener("click", async () => {
  publishError.classList.add("hidden");
  publishMenu.disabled = true;
  publishMenu.innerHTML = '<span class="button-spinner"></span> Publicando...';

  try {
    const { data, error } = await supabase
      .rpc("publish_restaurant", { requested_slug: slugify(currentRestaurant.name) })
      .single();

    if (error) throw error;
    currentRestaurant = { ...currentRestaurant, ...data };
    renderSharePanel();
  } catch (error) {
    console.error(error);
    publishError.textContent = "Não foi possível publicar o cardápio.";
    publishError.classList.remove("hidden");
  } finally {
    publishMenu.disabled = false;
    publishMenu.textContent = "Publicar cardápio";
  }
});

copyMenuUrl.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(publicMenuUrl.value);
    copyMenuUrl.textContent = "Copiado";
    window.setTimeout(() => { copyMenuUrl.textContent = "Copiar"; }, 1600);
  } catch {
    publicMenuUrl.select();
    document.execCommand("copy");
  }
});

copyDomainTarget.addEventListener("click", async () => {
  const target = customDomainCnameTarget.textContent.trim();
  if (!target) return;
  try {
    await navigator.clipboard.writeText(target);
    copyDomainTarget.textContent = "Destino copiado";
    window.setTimeout(() => { copyDomainTarget.textContent = "Copiar destino"; }, 1600);
  } catch {
    window.prompt("Copie o destino do CNAME:", target);
  }
});

copySupportEmail.addEventListener("click", async () => {
  const email = supportEmail.textContent.trim();
  try {
    await navigator.clipboard.writeText(email);
    copySupportEmail.textContent = "E-mail copiado";
    window.setTimeout(() => { copySupportEmail.textContent = "Copiar e-mail"; }, 1600);
  } catch {
    window.prompt("Copie o e-mail de suporte:", email);
  }
});
termsLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openTerms();
  });
});
termsBack.addEventListener("click", () => {
  window.history.replaceState({}, "", window.location.pathname);
  showView(currentUser ? "items" : "login");
});

init();
