import { NextResponse } from "next/server";

const API_BASE = process.env.BACKEND_API_BASE; // e.g., http://localhost:8000/api

async function passThrough(method, req, { params }) {
  const url = new URL(req.url);
  const target = `${API_BASE}/${(params.path || []).join("/")}${url.search}`;

  const init = {
    method,
    // Do NOT set content-type; let it flow (supports JSON and multipart)
    headers: new Headers([...req.headers].filter(([k]) =>
      ["authorization", "content-type"].includes(k.toLowerCase())
    )),
    body: ["GET", "HEAD"].includes(method) ? undefined : req.body,
    cache: "no-store",
  };

  const resp = await fetch(target, init);
  const body = await resp.arrayBuffer();

  const headers = new Headers(resp.headers);
  headers.delete("content-encoding");
  headers.delete("transfer-encoding");
  headers.set("cache-control", "no-store");

  return new NextResponse(body, { status: resp.status, headers });
}

export async function GET(req, ctx)    { return passThrough("GET", req, ctx); }
export async function POST(req, ctx)   { return passThrough("POST", req, ctx); }
export async function PUT(req, ctx)    { return passThrough("PUT", req, ctx); }
export async function PATCH(req, ctx)  { return passThrough("PATCH", req, ctx); }
export async function DELETE(req, ctx) { return passThrough("DELETE", req, ctx); }
