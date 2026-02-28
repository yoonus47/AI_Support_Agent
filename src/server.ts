import "dotenv/config";
import express from "express";
import cors from "cors";
import { createSupportAgent } from "./agent";

const PORT = Number(process.env.PORT ?? 3001);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

function getChunkText(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }

  return "";
}

function getFinalOutputFromChainEvent(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const chainData = data as { output?: unknown };
  if (!chainData.output || typeof chainData.output !== "object") return "";

  const outputObj = chainData.output as { output?: unknown };
  return typeof outputObj.output === "string" ? outputObj.output : "";
}

async function main() {
  const app = express();
  app.use(cors({ origin: WEB_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));

  const agentExecutor = await createSupportAgent();

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Minimal non-streaming endpoint to get UI going
  app.post("/api/chat", async (req, res) => {
    const message = String(req.body?.message ?? "");
    const userId = String(req.body?.userId ?? "user_regular");

    if (!message.trim()) return res.status(400).json({ error: "message required" });

    try {
      const result = await agentExecutor.invoke({ input: message, userId });
      res.json({ output: result.output });
    } catch (e: any) {
      res.status(500).json({ error: e?.message ?? "unknown error" });
    }
  });

  app.post("/api/chat/stream", async (req, res) => {
    const message = String(req.body?.message ?? "");
    const userId = String(req.body?.userId ?? "user_regular");

    if (!message.trim()) return res.status(400).json({ error: "message required" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      let finalOutput = "";
      let streamedText = "";
      
      const eventStream = agentExecutor.streamEvents(
        { input: message, userId },
        { version: "v1" }
      );

      for await (const event of eventStream) {
        if (event.event === "on_tool_start") {
          sendEvent("tool_start", {
            name: event.name,
            input: event.data?.input,
          });
        }

        if (event.event === "on_tool_end") {
          sendEvent("tool_end", {
            name: event.name,
            output: event.data?.output,
          });
        }

        if (event.event === "on_chat_model_stream") {
          const chunkText = getChunkText(event.data?.chunk?.content);
          if (chunkText) {
            streamedText += chunkText;
            sendEvent("token", { text: chunkText });
          }
        }

        if (event.event === "on_chain_end") {
          const output = getFinalOutputFromChainEvent(event.data);
          if (output) {
            finalOutput = output;
          }
        }
      }

      if (!finalOutput.trim()) {
        finalOutput = streamedText.trim();
      }

      if (!finalOutput.trim()) {
        const fallback = await agentExecutor.invoke({ input: message, userId });
        finalOutput = String(fallback?.output ?? "").trim();
      }

      sendEvent("final", { output: finalOutput || "(no output)" });
      sendEvent("done", { ok: true });
    } catch (e: any) {
      sendEvent("error", { error: e?.message ?? "unknown error" });
    } finally {
      res.end();
    }
  });

  app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
