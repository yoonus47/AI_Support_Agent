import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001/api/chat";

    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") ?? "application/json";

    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Proxy error" }, { status: 500 });
  }
}