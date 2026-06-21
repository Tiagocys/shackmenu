import { json } from "../_lib/http.js";

export function onRequestGet({ env }) {
  const supabaseUrl = env.SUPABASE_URL || env.project_url;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Configure SUPABASE_URL e SUPABASE_ANON_KEY no Pages." }, 503);
  }

  return json({
    supabaseUrl,
    supabaseAnonKey,
    appUrl: env.PUBLIC_APP_URL || new URL("https://shackmenu.com").origin,
  });
}
