import { authenticate, json } from "./http.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSize = 5 * 1024 * 1024;

export async function uploadImage({ request, env }, folder) {
  const authentication = await authenticate(request, env);
  if (authentication.error) return authentication.error;

  const contentType = request.headers.get("content-type")?.split(";")[0];
  const size = Number(request.headers.get("x-file-size") || request.headers.get("content-length"));

  if (!allowedTypes.has(contentType)) {
    return json({ error: "Use uma imagem JPG, PNG ou WebP." }, 400);
  }

  if (!Number.isInteger(size) || size <= 0 || size > maxSize) {
    return json({ error: "A imagem deve ter no máximo 5 MB." }, 400);
  }

  if (!env.SHACKMENU_BUCKET) {
    return json({ error: "O bucket R2 não está vinculado à aplicação." }, 503);
  }

  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[contentType];
  const userId = authentication.user.id;
  const key = folder === "products"
    ? `restaurants/${userId}/products/product-${crypto.randomUUID()}.${extension}`
    : `restaurants/${userId}/logo-${crypto.randomUUID()}.${extension}`;

  try {
    await env.SHACKMENU_BUCKET.put(key, request.body, {
      httpMetadata: { contentType },
      customMetadata: { ownerId: userId },
    });
    return json({ key });
  } catch (error) {
    console.error("Could not upload image to R2", error);
    return json({ error: "Não foi possível enviar a imagem." }, 500);
  }
}
