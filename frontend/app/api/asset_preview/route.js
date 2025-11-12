// app/api/asset_preview/route.js
const DJANGO = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

export async function GET(req) {
  const url = new URL(req.url);
  // Map /api/asset_preview  ->  http://127.0.0.1:8000/api/preview/assets/
  // /api/asset_preview?id=5  ->  http://127.0.0.1:8000/api/preview/assets/5/
  const id = url.searchParams.get("id");
  const target = id
    ? `${DJANGO}/api/preview/assets/${id}/`
    : `${DJANGO}/api/preview/assets/`;
  const resp = await fetch(target, { credentials: "include", headers: { cookie: req.headers.get("cookie") || "" } });
  return new Response(await resp.text(), { status: resp.status, headers: { "content-type": resp.headers.get("content-type") || "application/json" } });
}

// Optional helpers for preview/download endpoints
export const runtime = "nodejs";
