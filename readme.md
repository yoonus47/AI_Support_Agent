# AI Support Agent: Policy Aware Support Assistant (LangChain + Groq)

A small “production-style” AI support assistant that demonstrates **tool-using agent behavior**:
- **Searches internal docs** to answer common questions (deflection)
- **Fetches user context** (e.g., plan / VIP) to personalize behavior
- **Creates a support ticket** only when needed (escalation)

Built as a **backend API + web chat UI**, so it demos like a real product—not a notebook.

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
2. Backend agent runs tools in sequence:
   - `searchDocs` (attempt to answer from docs)
   - `getUserContext` (plan / VIP context)
   - `createTicket` (escalation when needed)
3. Backend returns the final assistant response to the UI

Roadmap includes: streaming responses, live tool traces, citations, Docker compose.

---

## Repo Structure

.
├── AI_Support_Agent/         # Backend (agent + API server)
│   ├── src/
│   ├── package.json
│   └── .env.example
└── web/                      # Frontend (Next.js UI)
    ├── src/
    ├── package.json
    └── .env.example

---

## Prerequisites

- Node.js 18+ (recommended: Node 20)
- npm (or pnpm/yarn)

---

## Setup & Run (Local)

### 1) Backend (API)

Open a terminal:

cd AI_Support_Agent
npm install

Create an env file:

cp .env.example .env

Edit AI_Support_Agent/.env:

GROQ_API_KEY=your_key_here
PORT=3001
WEB_ORIGIN=http://localhost:3000

Run the API:

npm run dev:api

Health check:

curl http://localhost:3001/health

Expected:

{ "ok": true }

---

### 2) Frontend (Web UI)

Open a new terminal:

cd web
npm install

Create web/.env.local:

NEXT_PUBLIC_API_URL=http://localhost:3001/api/chat

Run the frontend:

npm run dev

Open:
- UI: http://localhost:3000
- API: http://localhost:3001/health

---

## API

### POST /api/chat

Request body:

{
  "message": "How do I reset my password?",
  "userId": "user_regular"
}

Response:

{
  "output": "..."
}

---

## Security & Secrets

Do NOT commit .env files.

Recommended setup:
- Backend secrets live in: AI_Support_Agent/.env
- Frontend env lives in: web/.env.local
- Commit only: .env.example files

Important:
- Frontend env vars prefixed with NEXT_PUBLIC_ are not secrets (they are exposed to the browser).
- Keep GROQ_API_KEY only on the backend.

Suggested .gitignore rules:

.env
.env.*
!.env.example
web/.env.local

---

## Roadmap

- Stream responses (SSE) + show live tool traces in the UI
- Stronger “policy as code” guardrails (prevent unnecessary ticket creation)
- Replace basic docs search with real RAG (embeddings + vector store)
- Docker Compose for one-command startup

---

## License

MIT