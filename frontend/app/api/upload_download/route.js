

import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime for form-data streaming

export async function POST(req) {
  const formData = await req.formData(); // carries "files" from the browser
  const base = process.env.BACKEND_API_BASE;

  const r = await fetch(`${base}/upload_download/`, {
    method: "POST",
    body: formData,
    // Important: do NOT set Content-Type; the boundary is set automatically
  });

  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}

export async function GET(req) {
  const base = process.env.BACKEND_API_BASE;
  const r = await fetch(`${base}/upload_download/`, {
    method: "GET",
  });
}
