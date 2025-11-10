import { NextResponse } from "next/server";

export const runtime = "nodejs"; // needed for streaming form-data

function getBase() {
  const base = process.env.BACKEND_API_BASE;
  if (!base) throw new Error("BACKEND_API_BASE env var not set");
  return base.replace(/\/+$/, "");
}

export async function POST(req) {
  try {
    const formData = await req.formData(); // carries "files"
    const r = await fetch(`${getBase()}/upload/`, {
      method: "POST",
      body: formData,
      // NOTE: do not set Content-Type manually
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const r = await fetch(`${getBase()}/upload/`, { method: "GET" });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ detail: String(e) }, { status: 500 });
  }
}

/**
 * Save edited metadata.
 * Call as:  fetch('/api/upload_download?id=123', { method:'PATCH', body:JSON.stringify({...}), headers:{'Content-Type':'application/json'} })
 * This proxies to Django:  PATCH {BACKEND_API_BASE}/upload_download/123/
 */
export async function PATCH(_req, { params }) {
  const base = process.env.BACKEND_API_BASE;
  const body = await _req.text();
  const r = await fetch(`${base}/upload_download/${params.id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
