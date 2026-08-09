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
// =========================Tools ========================
async function getWeather(city: String): Promise<string> {
    const getResponse = await fetch(`https://gecoding-api.open-meteo.com/v1/search?name=${city}`);
    const data = await getResponse.json();
    if (data.results && data.results.length > 0) {
        const { latitude, longitude } = data.results[0];
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherResponse.json();
        return JSON.stringify({
            city: city,
            country: data.results[0].country,
            temperature: weatherData.current_weather.temperature,
            windspeed: weatherData.current_weather.windspeed,
            humidity: weatherData.current_weather.humidity,
        })
    } else {
        return `City ${city} not found.`;
    }
}

const tools = [
    {
        type: "function" as const,
        name: "getWeather",
        description: "Get the current weather for a given city.",
        parameters: {
            type: "object",
            properties: {
                city: {
                    type: "string",
                    description: "The name of the city.",
                },
            },
            required: ["city"],
        },
        strict: false,
    },
];




async function run(query: string = "Hello, world!") {
  const response = await openai.responses.create({
    model: "gpt-4o-mini",

    input: [
      {
        role: "system",
        content: `You are a helpful assistant. ${context}`,
      },
      {
        role: "user",
        content: query,
      },
    ],

    tools: tools,
    tool_choice: "auto",
  });

  for (const item of response.output) {
    if (item.type === "function_call") {
      if (item.name === "getWeather") {
        const args = JSON.parse(item.arguments);

        const city = args.city;

        console.log("Calling weather tool for:", city);

        const weatherInfo = await getWeather(city);

        const toolResponse = await openai.responses.create({
          model: "gpt-4o-mini",

          previous_response_id: response.id,

          input: [
            {
              type: "function_call_output",
              call_id: item.call_id,
              output: JSON.stringify(weatherInfo),
            },
          ],
        });

        console.log(toolResponse.output_text);
      }
    }
  }

  // If no tool was called
  if (
    !response.output.some(
      (item) => item.type === "function_call"
    )
  ) {
    context.push(`User: ${query} Assistant: ${response.output_text}`);
    console.log(response.output_text);
  }
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