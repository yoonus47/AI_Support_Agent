import "dotenv/config";
import * as readline from "readline";
import { createSupportAgent } from "./agent";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const agentExecutor = await createSupportAgent();

  console.log("\n--- Login ---");
  console.log("1. Pro User (Pro Plan)");
  console.log("2. Regular User (Free Plan)");
  
  rl.question("\nSelect user (1 or 2): ", (choice) => {
    // Logic: If they type '2', be 'user_regular', otherwise default to 'user_pro'
    const CURRENT_USER_ID = choice.trim() === "2" ? "user_regular" : "user_pro";
    const PLAN = CURRENT_USER_ID === "user_pro" ? "Pro" : "Free";

    console.log("\n=================================================");
    console.log("🤖 AI Support Agent (Powered by Groq/Llama3)");
    console.log(`👤 Logged in as: ${CURRENT_USER_ID} (${PLAN} Plan)`);
    console.log("Type 'exit' to quit.");
    console.log("=================================================\n");

    const askQuestion = () => {
      rl.question("User: ", async (input) => {
        if (input.toLowerCase() === "exit") {
          rl.close();
          return;
        }

        try {
          const response = await agentExecutor.invoke({
            input: input,
            userId: CURRENT_USER_ID,
          });

          console.log(`\n🤖 Agent: ${response.output}\n`);
        } catch (error) {
          console.error("Error:", error);
        }

        askQuestion();
      });
    };

    askQuestion();
  });
}

main();
