import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.BACKEND_API_BASE;
  const r = await fetch(`${base}/asset_preview/`, { cache: "no-store" });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
