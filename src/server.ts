import "dotenv/config";
import express from "express";
import cors from "cors";
import { createSupportAgent } from "./agent";

const PORT = Number(process.env.PORT ?? 3001);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

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

  app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});