import { NextResponse } from "next/server";

const BASE = process.env.BACKEND_API_BASE;

// GET /api/asset_preview?asset=5&action=preview
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get("asset");
  const action = searchParams.get("action"); // preview | download | versions

  let endpoint = `${BASE}/asset_preview/assets/`;

  if (assetId) {
    endpoint += `${assetId}/`;
    if (action) endpoint += `${action}/`; // ex: /5/preview/
  }

  const response = await fetch(endpoint, { cache: "no-store", credentials: "include" });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: `Backend error: ${response.statusText}`, details: text },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// POST /api/asset_preview?asset=5&action=create_version
export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get("asset");
  const action = searchParams.get("action");

  if (!assetId || action !== "create_version") {
    return NextResponse.json({ error: "Missing asset or invalid action" }, { status: 400 });
  }

  const formData = await req.formData();
  const res = await fetch(`${BASE}/asset_preview/assets/${assetId}/create_version/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
