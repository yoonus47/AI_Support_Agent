import { ChatGroq } from "@langchain/groq";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { searchDocs, createTicket, getUserContext } from "./tools";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0, 
});

const tools = [searchDocs, createTicket, getUserContext];

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a support agent.
    
    CRITICAL INSTRUCTION:
    Your goal is to answer the user WITHOUT opening a ticket if possible.
    
    PROCEDURE:
    1. FIRST, call "searchDocs". 
    2. IF the search results contain the answer, reply to the user with that information and STOP. DO NOT create a ticket.
    3. ONLY create a ticket if:
       - The user explicitly asks for one.
       - The docs do not contain the answer.
       - The user says the issue is "urgent" or "blocking".
    
    TICKET CREATION RULES:
    - You MUST call "getUserContext" first to check the user's plan.
    - Enterprise = "high" priority.
    - Free = "low" or "medium".
    
    Current User ID: {userId}`,
  ],
  ["placeholder", "{chat_history}"],
  ["human", "{input}"],
  ["placeholder", "{agent_scratchpad}"],
]);

export async function createSupportAgent() {
  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  return new AgentExecutor({
    agent,
    tools,
    // We add this to handle parsing errors gracefully instead of crashing
    handleParsingErrors: true, 
  });
}