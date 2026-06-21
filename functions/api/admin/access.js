import { isAdmin } from "../../_lib/admin.js";
import { authenticate, json } from "../../_lib/http.js";

export async function onRequestGet({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;
  return json({ isAdmin: isAdmin(env, authentication.user.id) });
}
