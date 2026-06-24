export function getSupabaseAdminCredentials(env) {
  const baseUrl = env.SUPABASE_URL || env.project_url;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE;
  if (!baseUrl || !key) throw new Error("Supabase admin credentials are not configured");
  return { baseUrl, key };
}

export async function supabaseAdminRequest(env, path, options = {}) {
  const { baseUrl, key } = getSupabaseAdminCredentials(env);
  const response = await fetch(`${baseUrl}/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase admin request failed (${response.status}): ${body}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
