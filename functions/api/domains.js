import { connectCustomDomain, customDomainError, refreshCustomDomain } from "../_lib/domains.js";
import { authenticate, json } from "../_lib/http.js";

export async function onRequestGet({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;
  try {
    return json(await refreshCustomDomain(env, authentication.user.id));
  } catch (error) {
    const result = customDomainError(error);
    return json({ error: result.message }, result.status);
  }
}

export async function onRequestPost({ request, env }) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;
  try {
    const body = await request.json();
    return json(await connectCustomDomain(env, authentication.user.id, body.domain));
  } catch (error) {
    const result = customDomainError(error);
    return json({ error: result.message }, result.status);
  }
}
