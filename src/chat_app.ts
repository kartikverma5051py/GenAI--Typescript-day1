import dotenv from 'dotenv';
import path from 'path/win32';
import readline from 'readline';
import { stdin as input, stdout as output } from 'node:process';
dotenv.config({ path: "C:\\Users\\karti\\Documents\\GenAI_typescript\\.env" });
import { OpenAI } from 'openai';


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const context: string[] = [];
async function run(query: string = "Hello, world!") {
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a helpful assistant. ${context}`
            },
            {
                role: "user",
                content: query
            }
        ],
        temperature: 0.2,
        max_tokens: 200,
        // response_format: { type: "json_object" },

    });
    context.push(`User: ${query}\nAssistant: ${response.choices[0]?.message?.content ?? "No response content"}`);
    console.log(context);
    console.log("=======================Response from OpenAI API:==========");
    console.log(response.choices[0]?.message?.content ?? "No response content");
}

const rl = readline.createInterface({
  input,
  output,
});

while (true) {
  const query = await new Promise<string>((resolve) => rl.question("Enter your query: ", resolve));

  if (query.trim().toLowerCase() === "exit") {
    break;
  }

  try {
    await run(query);
  } catch (error) {
    console.error("Error:", error);
  }
}

rl.close();
// run("kartik is Best AI developer in the world").catch(console.error);