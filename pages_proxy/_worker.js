export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const workerHost = "visroslot.rajkumar50036.workers.dev";
    
    // Rewrite target hostname to the Cloudflare Worker
    url.hostname = workerHost;
    
    const headers = new Headers(request.headers);
    headers.set("Host", workerHost);
    headers.set("x-forwarded-host", "visroslot.pages.dev");
    headers.set("x-forwarded-proto", "https");

    const reqInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
      reqInit.body = request.body;
      reqInit.duplex = "half";
    }

    const response = await fetch(url.toString(), reqInit);
    
    const responseHeaders = new Headers(response.headers);
    
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/assets/")) {
      responseHeaders.set("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      // Ensure HTML and dynamic routes are never cached stale by browsers
      responseHeaders.set("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
      responseHeaders.set("Pragma", "no-cache");
      responseHeaders.set("Expires", "0");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }
};
