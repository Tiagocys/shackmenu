const pagesOrigin = "shackmenu-axb.pages.dev";

export default {
  async fetch(request) {
    const upstreamUrl = new URL(request.url);
    upstreamUrl.protocol = "https:";
    upstreamUrl.hostname = pagesOrigin;
    upstreamUrl.port = "";

    const headers = new Headers(request.headers);
    headers.set("host", pagesOrigin);
    headers.set("x-shackmenu-host", new URL(request.url).hostname);

    return fetch(new Request(upstreamUrl, {
      method: request.method,
      headers,
      body: request.body,
      redirect: "manual",
    }));
  },
};
