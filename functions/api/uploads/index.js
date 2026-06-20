import { authenticate, json } from "../../_lib/http.js";

export async function onRequestDelete({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  const key = new URL(request.url).searchParams.get("key") || "";
  const userPrefix = `restaurants/${authentication.user.id}/`;
  if (!key.startsWith(userPrefix) || key.includes("..")) {
    return json({ error: "Arquivo inválido." }, 400);
  }

  try {
    await env.SHACKMENU_BUCKET.delete(key);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Could not delete R2 object", error);
    return json({ error: "Não foi possível remover a imagem." }, 500);
  }
}
