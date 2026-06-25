import { supabaseAdminRequest } from "./supabase.js";

export function normalizeCity(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function sanitizeState(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
}

export function sanitizeCep(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 8);
}

export function sanitizeAddressComplement(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 120);
}

export async function lookupCep(cep) {
  const cleanCep = sanitizeCep(cep);
  if (cleanCep.length !== 8) throw new Error("Informe um CEP com 8 dígitos.");

  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Não foi possível consultar o CEP.");

  const data = await response.json();
  if (data.erro) throw new Error("CEP não encontrado.");
  return {
    cep: cleanCep,
    city: data.localidade,
    state: data.uf,
    address: data.logradouro || null,
    neighborhood: data.bairro || null,
  };
}

export async function getOwnerDeliveryCities(env, ownerId) {
  return supabaseAdminRequest(
    env,
    `rest/v1/restaurant_delivery_cities?select=id,city,state,cep,normalized_city,created_at&owner_id=eq.${encodeURIComponent(ownerId)}&order=state.asc,city.asc`,
  );
}

export async function replaceOwnerDeliveryCeps(env, ownerId, restaurantId, ceps) {
  const normalized = new Map();
  const addresses = await Promise.all((Array.isArray(ceps) ? ceps : []).map(async (entry) => {
    const cep = typeof entry === "string" ? entry : entry.cep;
    try {
      return await lookupCep(cep);
    } catch {
      return null;
    }
  }));

  addresses.filter(Boolean).forEach((address) => {
    const city = String(address.city || "").trim().replace(/\s+/g, " ").slice(0, 100);
    const state = sanitizeState(address.state);
    const normalizedCity = normalizeCity(city);
    normalized.set(`${normalizedCity}:${state}`, {
      restaurant_id: restaurantId,
      owner_id: ownerId,
      cep: address.cep,
      city,
      state,
      normalized_city: normalizedCity,
    });
  });

  await supabaseAdminRequest(
    env,
    `rest/v1/restaurant_delivery_cities?owner_id=eq.${encodeURIComponent(ownerId)}`,
    { method: "DELETE", headers: { Prefer: "return=minimal" } },
  );

  const records = [...normalized.values()];
  if (records.length) {
    await supabaseAdminRequest(env, "rest/v1/restaurant_delivery_cities", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(records),
    });
  }
  return getOwnerDeliveryCities(env, ownerId);
}

export async function replaceOwnerDeliveryCities(env, ownerId, restaurantId, cities) {
  const normalized = new Map();
  (Array.isArray(cities) ? cities : []).forEach((entry) => {
    const city = String(entry.city || "").trim().replace(/\s+/g, " ").slice(0, 100);
    const state = sanitizeState(entry.state);
    const normalizedCity = normalizeCity(city);
    if (city.length < 2 || state.length !== 2 || !normalizedCity) return;
    normalized.set(`${normalizedCity}:${state}`, {
      restaurant_id: restaurantId,
      owner_id: ownerId,
      cep: null,
      city,
      state,
      normalized_city: normalizedCity,
    });
  });

  await supabaseAdminRequest(
    env,
    `rest/v1/restaurant_delivery_cities?owner_id=eq.${encodeURIComponent(ownerId)}`,
    { method: "DELETE", headers: { Prefer: "return=minimal" } },
  );

  const records = [...normalized.values()];
  if (records.length) {
    await supabaseAdminRequest(env, "rest/v1/restaurant_delivery_cities", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(records),
    });
  }
  return getOwnerDeliveryCities(env, ownerId);
}

export async function validateCepForRestaurant(env, restaurantId, cep) {
  const address = await lookupCep(cep);
  const cities = await supabaseAdminRequest(
    env,
    `rest/v1/restaurant_delivery_cities?select=city,state,normalized_city&restaurant_id=eq.${encodeURIComponent(restaurantId)}`,
  );
  if (!cities.length) {
    throw new Error("Este restaurante ainda não configurou as cidades de entrega.");
  }

  const normalizedCepCity = normalizeCity(address.city);
  const match = cities.find((city) => (
    city.state === address.state && city.normalized_city === normalizedCepCity
  ));
  if (!match) {
    throw new Error(`Este restaurante não entrega em ${address.city}/${address.state}.`);
  }
  return address;
}

export async function validateRestaurantDeliveryAddress(env, restaurantId, { cep, complement }) {
  const cleanComplement = sanitizeAddressComplement(complement);
  if (cleanComplement.length < 1) {
    throw new Error("Informe o número ou complemento da entrega.");
  }

  const address = await validateCepForRestaurant(env, restaurantId, cep);

  return {
    ...address,
    complement: cleanComplement,
  };
}
