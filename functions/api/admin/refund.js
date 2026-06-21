import { adminError, isAdmin, refundAndCancel } from "../../_lib/admin.js";
import { authenticate, json } from "../../_lib/http.js";

export async function onRequestPost({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;
  if (!isAdmin(env, authentication.user.id)) return json({ error: "Acesso negado." }, 403);

  try {
    const body = await request.json();
    if (body.confirmation !== "REEMBOLSAR") {
      return json({ error: "Confirmação de reembolso inválida." }, 400);
    }
    return json(await refundAndCancel(env, body.ownerId, authentication.user.id));
  } catch (error) {
    const result = adminError(error);
    return json({ error: result.message }, result.status);
  }
}
