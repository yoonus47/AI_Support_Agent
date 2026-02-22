# AI Support Agent: Policy Aware Support Assistant (LangChain + Groq)

A small "production-style" AI support assistant that demonstrates **tool-using agent behavior**:
- **Searches internal docs** to answer common questions (deflection)
- **Fetches user context** (e.g., plan / VIP) to personalize behavior
- **Creates a support ticket** when needed (escalation)

Built as a **backend API + web chat UI**, so it demos like a real product.

---

## Screenshot

![AI Support Agent UI](./Screenshot.png)

---

## Tech Stack

**Backend**
- Node.js + TypeScript
- LangChain agent + tool calling
- Groq LLM API
- Express API server

**Frontend**
- Next.js (App Router) + TypeScript
- TailwindCSS

---

## Architecture (High Level)

Typical flow per user message:
1. User sends a message via the web UI
2. Backend agent runs tools in sequence (depending on the request):
   - `searchDocs` (attempt to answer from docs)
   - `getUserContext` (plan / VIP context)
   - `createTicket` (escalation when needed)
3. Backend returns the final assistant response to the UI

Roadmap includes: streaming responses, live tool traces, citations.

---

## Repo Structure

```
.
├── src/                       # Backend source (agent + API server)
├── package.json               # Backend deps/scripts
├── Dockerfile                 # Backend Dockerfile
├── docker-compose.yml         # Local Docker compose
├── .env.example               # Backend env template (safe to commit)
├── web/                       # Frontend (Next.js UI)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
└── Screenshot.png             # UI screenshot used in README (optional)
```

---

## Prerequisites

- Node.js 18+ (recommended: Node 20)
- npm (or pnpm/yarn)
- Groq API key

---

## Setup & Run (Local Dev)

### 1) Backend (API)

From repo root:

```bash
npm install
```

Create your env file:

```bash
cp .env.example .env
```

Edit `.env` and set your key:

```env
GROQ_API_KEY=your_key_here
PORT=3001
WEB_ORIGIN=http://localhost:3000
```

Run the API:

```bash
npm run dev:api
```

Health check:

```bash
curl http://localhost:3001/health
```

Expected:

```json
{ "ok": true }
```

---

### 2) Frontend (Web UI)

In a new terminal:

```bash
cd web
npm install
```

Create `web/.env.local`:

```env
BACKEND_URL=http://localhost:3001/api/chat
```

Run the frontend:

```bash
npm run dev
```

Open:
- UI: http://localhost:3000
- API: http://localhost:3001/health

---

## Run with Docker (Optional)

1. Ensure you have a `.env` in the repo root (contains `GROQ_API_KEY=...`).
2. From repo root:

```bash
docker compose up --build
```

Open:
- UI: http://localhost:3000
- API: http://localhost:3001/health

---

## API

### POST /api/chat

Request body:

```json
{
  "message": "How do I reset my password?",
  "userId": "user_regular"
}
```

Response:

```json
{
  "output": "..."
}
```

---


## Roadmap

- [ ] Streaming responses (SSE)
- [ ] Live tool traces in the UI (docs lookup → user context → ticket escalation)
- [ ] Stronger "policy as code" guardrails
- [ ] Replace basic docs lookup with real RAG (embeddings + vector store)

---

## License

MIT
