import { createClient } from "@supabase/supabase-js";

const views = {
  loading: document.querySelector("#loading-view"),
  login: document.querySelector("#login-view"),
  restaurant: document.querySelector("#restaurant-view"),
  success: document.querySelector("#success-view"),
};

const loginButton = document.querySelector("#google-login");
const signOutButton = document.querySelector("#sign-out");
const form = document.querySelector("#restaurant-form");
const formError = document.querySelector("#form-error");
const submitButton = document.querySelector("#restaurant-submit");
const logoInput = document.querySelector("#restaurant-logo");
const logoPreview = document.querySelector("#logo-preview");

let supabase;
let currentUser;

function showView(name) {
  Object.entries(views).forEach(([viewName, element]) => {
    element.classList.toggle("hidden", viewName !== name);
  });
  signOutButton.classList.toggle("hidden", name === "loading" || name === "login");
}

function showError(message) {
  formError.textContent = message;
  formError.classList.remove("hidden");
}

function setSubmitting(submitting) {
  submitButton.disabled = submitting;
  submitButton.innerHTML = submitting
    ? '<span class="button-spinner"></span> Salvando...'
    : "Continuar para categorias <span>→</span>";
}

async function loadRestaurant() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, logo_key")
    .eq("owner_id", currentUser.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    document.querySelector("#success-title").textContent = `${data.name} está no Shack Menu.`;
    showView("success");
    return;
  }

  showView("restaurant");
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

logoInput.addEventListener("change", () => {
  const file = logoInput.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    logoInput.value = "";
    showError("A logo deve ter no máximo 5 MB.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    logoPreview.innerHTML = `<img src="${reader.result}" alt="Prévia da logo" />`;
  });
  reader.readAsDataURL(file);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.classList.add("hidden");
  setSubmitting(true);

  const name = new FormData(form).get("name").trim();
  const logo = logoInput.files[0];
  let logoKey = null;

  try {
    if (logo) {
      const { data: sessionData } = await supabase.auth.getSession();
      const uploadResponse = await fetch("/api/uploads/logo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({ contentType: logo.type, size: logo.size }),
      });
      const upload = await uploadResponse.json();

      if (!uploadResponse.ok) throw new Error(upload.error);

      const r2Response = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": logo.type },
        body: logo,
      });

      if (!r2Response.ok) throw new Error("O upload da logo para o R2 falhou.");
      logoKey = upload.key;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert({ owner_id: currentUser.id, name, logo_key: logoKey })
      .select("id, name")
      .single();

    if (error) throw error;

    document.querySelector("#success-title").textContent = `${data.name} está no Shack Menu.`;
    showView("success");
  } catch (error) {
    console.error(error);
    showError(error.message || "Não foi possível criar o restaurante.");
  } finally {
    setSubmitting(false);
  }
});

init();
