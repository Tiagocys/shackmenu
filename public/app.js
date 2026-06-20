import { createClient } from "@supabase/supabase-js";

const views = {
  loading: document.querySelector("#loading-view"),
  login: document.querySelector("#login-view"),
  restaurant: document.querySelector("#restaurant-view"),
  categories: document.querySelector("#categories-view"),
  items: document.querySelector("#items-view"),
  complete: document.querySelector("#complete-view"),
  publicMenu: document.querySelector("#public-menu-view"),
};

const loginButton = document.querySelector("#google-login");
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
const finishMenu = document.querySelector("#finish-menu");
const publishMenu = document.querySelector("#publish-menu");
const publishError = document.querySelector("#publish-error");
const sharePanel = document.querySelector("#share-panel");
const publicMenuUrl = document.querySelector("#public-menu-url");
const copyMenuUrl = document.querySelector("#copy-menu-url");
const openPublicMenu = document.querySelector("#open-public-menu");
const publicRestaurantLogo = document.querySelector("#public-restaurant-logo");
const publicRestaurantName = document.querySelector("#public-restaurant-name");
const publicCategoryNav = document.querySelector("#public-category-nav");
const publicMenuContent = document.querySelector("#public-menu-content");

let supabase;
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

function showView(name) {
  Object.entries(views).forEach(([viewName, element]) => {
    element.classList.toggle("hidden", viewName !== name);
  });
  signOutButton.classList.toggle("hidden", ["loading", "login", "publicMenu"].includes(name));
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
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const upload = await readApiResponse(uploadResponse);
  if (!uploadResponse.ok) throw new Error(upload.error);

  const r2Response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!r2Response.ok) throw new Error("O upload da imagem para o R2 falhou.");

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

async function optimizeImage(file, { maxDimension, targetSize, outputName }) {
  const image = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext("2d", { alpha: true });
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
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
  });
}

function formatFileSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadRestaurant() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, logo_key, slug, published_at")
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

function renderSharePanel() {
  const isPublished = Boolean(currentRestaurant?.slug && currentRestaurant?.published_at);
  publishMenu.classList.toggle("hidden", isPublished);
  sharePanel.classList.toggle("hidden", !isPublished);

  if (!isPublished) return;
  const url = `${window.location.origin}/m/${currentRestaurant.slug}`;
  publicMenuUrl.value = url;
  openPublicMenu.href = url;
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

  card.append(body);
  return card;
}

function renderPublicMenu(menu) {
  const visibleCategories = menu.categories.filter((category) => category.products.length > 0);
  publicRestaurantName.textContent = menu.restaurant.name;
  publicCategoryNav.replaceChildren();
  publicMenuContent.replaceChildren();

  if (menu.restaurant.logo_key) {
    publicRestaurantLogo.src = `/api/media?key=${encodeURIComponent(menu.restaurant.logo_key)}`;
    publicRestaurantLogo.alt = `Logo do ${menu.restaurant.name}`;
    publicRestaurantLogo.classList.remove("hidden");
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
}

async function loadPublicMenu(slug) {
  showView("loading");
  const { data, error } = await supabase.rpc("get_public_menu", { menu_slug: slug });

  if (error || !data) {
    views.loading.innerHTML = '<div class="setup-error"><strong>Cardápio não encontrado</strong><p>Confira o endereço ou tente novamente mais tarde.</p></div>';
    return;
  }

  renderPublicMenu(data);
  showView("publicMenu");
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

function renderProducts() {
  productList.replaceChildren();
  productEmpty.classList.toggle("hidden", products.length > 0);
  finishMenu.disabled = products.length === 0;
  productCount.textContent = `${products.length} ${products.length === 1 ? "produto" : "produtos"}`;

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
    showView("login");
    return;
  }

  try {
    await loadRestaurant();
  } catch (error) {
    console.error(error);
    showView("restaurant");
    showError("Não foi possível consultar o restaurante. Confira se a migration do Supabase foi executada.");
  }
}

async function init() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();

    if (!response.ok) {
      throw new Error(config.error);
    }

    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const publicSlug = getPublicMenuPath();
    if (publicSlug) {
      await loadPublicMenu(publicSlug);
      return;
    }

    const { data } = await supabase.auth.getSession();
    await handleSession(data.session);

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
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
    options: { redirectTo: window.location.origin },
  });

  if (error) {
    loginButton.disabled = false;
    alert(`Não foi possível entrar com Google: ${error.message}`);
  }
});

signOutButton.addEventListener("click", () => supabase.auth.signOut());

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
  productUploadHint.textContent = "Redimensionando e convertendo para WebP";
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
    productUploadHint.textContent = "JPG, PNG ou WebP, até 10 MB";
    showProductError("Não foi possível processar essa imagem. Tente outro arquivo.");
  } finally {
    if (productImageInput.files[0] === file) productSubmit.disabled = false;
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
      .select("id, name, logo_key, slug, published_at")
      .single();

    if (error) throw error;

    currentRestaurant = data;
    categories = [];
    renderCategories();
    showView("categories");
  } catch (error) {
    console.error(error);
    await deleteStoredImage(logoKey);
    showError(error.message || "Não foi possível criar o restaurante.");
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
  productUploadHint.textContent = "JPG, PNG ou WebP, até 10 MB. Otimizamos antes do envio.";
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  productError.classList.add("hidden");

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
    showProductError(error.message || "Não foi possível adicionar o produto.");
  } finally {
    productSubmit.disabled = false;
    productSubmit.textContent = "Adicionar produto";
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

init();
