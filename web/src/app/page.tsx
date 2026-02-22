"use client";

import { useMemo, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Page() {
  const [plan, setPlan] = useState<"Free" | "Pro">("Free");
  const userId = useMemo(() => (plan === "Pro" ? "user_pro" : "user_regular"), [plan]);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey — ask me a support question (password reset, dark mode, refunds, etc.)." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");

      setMessages((m) => [...m, { role: "assistant", content: data.output }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${e.message}` }]);
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
            <p className="text-sm text-neutral-400">Chat UI + API (next: streaming + tool traces)</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-400">Plan</span>
            <select
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm outline-none ring-1 ring-neutral-800"
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
            >
              <option>Free</option>
              <option>Pro</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[1fr_320px]">
          {/* Chat */}
          <div className="rounded-xl bg-neutral-900/40 ring-1 ring-neutral-800">
            <div className="h-[60vh] overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ring-1 " +
                      (m.role === "user"
                        ? "bg-neutral-200 text-neutral-950 ring-neutral-200"
                        : "bg-neutral-900 text-neutral-100 ring-neutral-800")
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && <div className="text-sm text-neutral-400">Assistant is thinking…</div>}
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
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Side panel: recruiter-friendly “observability” placeholder */}
          <div className="rounded-xl bg-neutral-900/40 ring-1 ring-neutral-800 p-4">
            <h2 className="text-sm font-semibold text-neutral-200">Trace (next)</h2>
            <p className="mt-2 text-sm text-neutral-400">
              We’ll add a live tool feed here: <br />
              <span className="text-neutral-300">searchDocs → getUserContext → createTicket</span>
            </p>
            <div className="mt-4 rounded-lg bg-neutral-950 p-3 ring-1 ring-neutral-800 text-xs text-neutral-400">
              Next step: stream LangChain events from the API via SSE and render them here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}