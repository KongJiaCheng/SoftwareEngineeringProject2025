export const runtime = "nodejs";

const DJANGO =
  process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

function target(urlId) {
  // MUST be /api/upload/, not /api/preview/assets/
  return `${DJANGO}/api/upload/${urlId}/`;
}

async function passThrough(method, req, ctx) {
  const { id } = await ctx.params;

  const headers = new Headers();
  const cookie = req.headers.get("cookie") || "";
  if (cookie) headers.set("cookie", cookie);

  const csrf = req.headers.get("x-csrftoken");
  if (csrf) headers.set("x-csrftoken", csrf);

  let body = null;
  if (method === "PATCH") {
    headers.set("content-type", "application/json");
    body = await req.text();
  }

  const r = await fetch(target(id), {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const text = await r.text();
  const ct = r.headers.get("content-type") || "application/json";
  return new Response(text, {
    status: r.status,
    headers: { "content-type": ct },
  });
}

export async function PATCH(req, ctx) {
  return passThrough("PATCH", req, ctx);
}
