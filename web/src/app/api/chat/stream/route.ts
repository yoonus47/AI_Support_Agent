import { NextResponse } from "next/server";

export const runtime = "nodejs";

function resolveBackendStreamUrl() {
  if (process.env.BACKEND_STREAM_URL) return process.env.BACKEND_STREAM_URL;

  const baseChatUrl = process.env.BACKEND_URL;
  if (baseChatUrl) {
    try {
      const parsed = new URL(baseChatUrl);
      if (parsed.pathname.endsWith("/api/chat")) {
        parsed.pathname = parsed.pathname.replace(/\/api\/chat$/, "/api/chat/stream");
        return parsed.toString();
      }

      if (parsed.pathname.endsWith("/api/chat/")) {
        parsed.pathname = parsed.pathname.replace(/\/api\/chat\/$/, "/api/chat/stream");
        return parsed.toString();
      }

      parsed.pathname = `${parsed.pathname.replace(/\/$/, "")}/api/chat/stream`;
      return parsed.toString();
    } catch {
      // fall through to localhost fallback
    }
  }

  return "http://localhost:3001/api/chat/stream";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendStreamUrl = resolveBackendStreamUrl();

    const upstream = await fetch(backendStreamUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!upstream.body) {
      const text = await upstream.text();
      return new NextResponse(text, {
        status: upstream.status,
        headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
