import { tool } from "@langchain/core/tools";
import { z } from "zod";

const MOCK_DOCS = [
  "To reset your password, go to Settings > Security > Reset Password.",
  "If the app crashes after login, try clearing your browser cache.",
  "Billing issues for Pro users are treated as high priority.",
  "Billing issues for Free users are treated as medium priority.",
  "To enable Dark Mode, click on your profile avatar and toggle the 'Moon' icon.",
  "Refunds are only processed if requested within 21 days of the transaction date."
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

export const searchDocs = tool(
  async ({ query }) => {
    console.log(`\n🔎 [TOOL CALL] Searching docs for: "${query}"`);

    const queryTokens = new Set(tokenize(query));
    const scoredDocs = MOCK_DOCS.map((doc) => {
      const docTokens = tokenize(doc);
      const score = docTokens.reduce((acc, token) => {
        return queryTokens.has(token) ? acc + 1 : acc;
      }, 0);

      return { doc, score };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.doc);

    if (scoredDocs.length === 0) {
      return "No relevant documentation snippets found.";
    }

    return scoredDocs.join("\n");
  },
  {
    name: "searchDocs",
    description: "Always use this first. Searches documentation for answers.",
    schema: z.object({
      query: z.string().describe("The search query string."),
    }),
  }
);

export const createTicket = tool(
  async ({ title, priority }) => {
    console.log(`\n🎫 [TOOL CALL] Creating ticket: "${title}" (Priority: ${priority})`);
    return `Ticket created: TICKET-${Math.floor(Math.random() * 10000)}`;
  },
  {
    name: "createTicket",
    description: "Creates a support ticket. REQUIRED: You must provide 'title' and 'priority'.",
    schema: z.object({
      title: z.string().describe("The summary of the issue."), // Explicit description
      priority: z.enum(["medium", "high"]).describe("The priority level."),
    }),
  }
);

export const getUserContext = tool(
  async ({ userId }) => {
    console.log(`\n👤 [TOOL CALL] Fetching context for user: ${userId}`);
    if (userId === "user_pro") {
      return JSON.stringify({ plan: "Pro", role: "Admin" });
    }
    return JSON.stringify({ plan: "Free", role: "User" });
  },
  {
    name: "getUserContext",
    description: "Get user details (plan/role) to determine ticket priority.",
    schema: z.object({
      userId: z.string().describe("The user ID."),
    }),
  }
);
