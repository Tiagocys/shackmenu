export async function onRequestGet({ request, env }) {
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key.startsWith("restaurants/") || key.includes("..")) {
    return new Response("Invalid media key", { status: 400 });
  }

  const object = await env.SHACKMENU_BUCKET.get(key);
  if (!object) return new Response("Media not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");
  return new Response(object.body, { headers });
}
