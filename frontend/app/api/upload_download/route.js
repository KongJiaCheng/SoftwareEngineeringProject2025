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

export async function GET(req) {
  const url = new URL(req.url);
  const isDownload = url.searchParams.has("download");
  const id = url.searchParams.get("id");

  if (isDownload) {
    if (!id) {
      return NextResponse.json({ detail: "Missing id" }, { status: 400 });
    }

    const r = await fetch(`${getBase()}/upload_download/download/${id}/`);

    // If backend failed, show the error text in browser instead of fake download
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return new Response(
        `Backend error (${r.status}):\n\n${text}`,
        { status: r.status, headers: { "Content-Type": "text/plain" } }
      );
    }

    // Success path – stream file
    return new Response(r.body, {
      status: r.status,
      headers: {
        "Content-Type": r.headers.get("content-type") || "application/octet-stream",
        "Content-Disposition": r.headers.get("content-disposition") || "attachment",
        "Content-Length": r.headers.get("content-length") || "",
      },
    });
  }

  // Optional: list endpoint
  // /api/upload  →  http://localhost:8000/api/upload_download/upload/
  const r = await fetch(`${getBase()}/upload_download/upload/`, { method: "GET" });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}



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

