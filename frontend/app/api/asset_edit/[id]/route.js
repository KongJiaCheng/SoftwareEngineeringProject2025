export const runtime = "nodejs"; // required for request streaming

const DJANGO = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

function target(urlId) {
  return `${DJANGO}/api/preview/assets/${urlId}/`;
}

async function passThrough(method, req, { params }) {
  const id = params.id;
  const headers = new Headers();

  // forward cookies for session auth/CSRF
  const cookie = req.headers.get("cookie") || "";
  if (cookie) headers.set("cookie", cookie);

  // forward CSRF header from client if present
  const csrf = req.headers.get("x-csrftoken");
  if (csrf) headers.set("x-csrftoken", csrf);

  // PATCH will be JSON, DELETE has no body
  let body = null;
  if (method === "PATCH") {
    headers.set("content-type", "application/json");
    body = await req.text();
  }

  const r = await fetch(target(id), { method, headers, body, redirect: "manual" });
  const text = await r.text();
  // pass through content-type (json/error/plain)
  const ct = r.headers.get("content-type") || "application/json";
  return new Response(text, { status: r.status, headers: { "content-type": ct } });
}

export async function PATCH(req, ctx) {
  return passThrough("PATCH", req, ctx);
}

export async function DELETE(req, ctx) {
  return passThrough("DELETE", req, ctx);
}
