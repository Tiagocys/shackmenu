import { adminError, isAdmin, listAdminCustomers } from "../../_lib/admin.js";
import { authenticate, json } from "../../_lib/http.js";

export async function onRequestGet({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;
  if (!isAdmin(env, authentication.user.id)) return json({ error: "Acesso negado." }, 403);
  try {
    return json({ customers: await listAdminCustomers(env) });
  } catch (error) {
    const result = adminError(error);
    return json({ error: result.message }, result.status);
  }
}
