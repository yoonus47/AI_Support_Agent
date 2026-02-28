"use client";

import { useMemo, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
type Trace = { type: "tool_start" | "tool_end"; name: string; detail?: string };

type StreamEvent = {
  event: string;
  data: Record<string, unknown> | string;
};

function parseSSE(buffer: string): { events: StreamEvent[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  const events: StreamEvent[] = parts
    .map((block) => {
      let event = "message";
      const dataLines: string[] = [];

      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }

      if (dataLines.length === 0) return null;

      const raw = dataLines.join("\n");
      let data: Record<string, unknown> | string = raw;
      try {
        data = JSON.parse(raw);
      } catch {
        // keep string fallback
      }

      return { event, data };
    })
    .filter((e): e is StreamEvent => Boolean(e));

  return { events, rest };
}

export default function Page() {
  const [plan, setPlan] = useState<"Free" | "Pro">("Free");
  const userId = useMemo(() => (plan === "Pro" ? "user_pro" : "user_regular"), [plan]);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey — ask me a support question (password reset, dark mode, refunds, etc.)." },
  ]);
  const [trace, setTrace] = useState<Trace[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setTrace([]);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text();
        throw new Error(errText || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSSE(buffer);
        buffer = parsed.rest;

        for (const evt of parsed.events) {
          const payload = typeof evt.data === "string" ? {} : evt.data;

          if (evt.event === "tool_start") {
            setTrace((t) => [...t, { type: "tool_start", name: String(payload.name ?? "tool"), detail: JSON.stringify(payload.input) }]);
          }

          if (evt.event === "tool_end") {
            setTrace((t) => [...t, { type: "tool_end", name: String(payload.name ?? "tool"), detail: String(payload.output ?? "") }]);
          }

          if (evt.event === "token") {
            const token = String(payload.text ?? "");
            if (!token) continue;
            setMessages((m) => {
              const next = [...m];
              const last = next[next.length - 1];
              if (!last || last.role !== "assistant") return m;
              next[next.length - 1] = { ...last, content: last.content + token };
              return next;
            });
          }

          if (evt.event === "final") {
            const finalText = String(payload.output ?? "");
            setMessages((m) => {
              const next = [...m];
              const last = next[next.length - 1];
              if (!last || last.role !== "assistant") return m;
              next[next.length - 1] = { ...last, content: finalText || last.content || "(no output)" };
              return next;
            });
          }

          if (evt.event === "error") {
            throw new Error(String(payload.error ?? "unknown error"));
          }
        }
      }
    } catch (e: unknown) {
      setMessages((m) => {
        const next = [...m];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && !last.content) {
          const message = e instanceof Error ? e.message : "unknown error";
          next[next.length - 1] = { role: "assistant", content: `⚠️ ${message}` };
          return next;
        }
        const message = e instanceof Error ? e.message : "unknown error";
        return [...m, { role: "assistant", content: `⚠️ ${message}` }];
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">AI Support Agent</h1>
            <p className="text-sm text-neutral-400">Now streaming token output + live tool traces</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Plan</span>
            <select
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm outline-none ring-1 ring-neutral-800"
              value={plan}
              onChange={(e) => setPlan(e.target.value as "Free" | "Pro")}
            >
              <option>Free</option>
              <option>Pro</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
          <div className="rounded-xl bg-neutral-900/40 ring-1 ring-neutral-800">
            <div className="h-[60vh] overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1 whitespace-pre-wrap " +
                      (m.role === "user"
                        ? "bg-neutral-200 text-neutral-950 ring-neutral-200"
                        : "bg-neutral-900 text-neutral-100 ring-neutral-800")
                    }
                  >
                    {m.content || (loading ? "…" : "")}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-800 p-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md bg-neutral-950 px-3 py-2 text-sm outline-none ring-1 ring-neutral-800"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                />
                <button
                  className="rounded-md bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
                  onClick={send}
                  disabled={loading}
                >
                  {loading ? "Streaming…" : "Send"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-neutral-900/40 ring-1 ring-neutral-800 p-4">
            <h2 className="text-sm font-semibold text-neutral-200">Live Tool Trace</h2>
            <div className="mt-3 space-y-2 text-xs">
              {trace.length === 0 && <p className="text-neutral-500">No tool events yet.</p>}
              {trace.map((item, i) => (
                <div key={i} className="rounded-lg bg-neutral-950 p-3 ring-1 ring-neutral-800">
                  <p className="text-neutral-200">
                    {item.type === "tool_start" ? "▶" : "✔"} {item.name}
                  </p>
                  {item.detail && <p className="mt-1 text-neutral-400 break-words">{item.detail}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
