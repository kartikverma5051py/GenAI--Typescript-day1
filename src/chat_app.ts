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
async function getWeather(city: string) {
  const geoResponse = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
  );

  if (!geoResponse.ok) {
    throw new Error(`Geocoding API failed: ${geoResponse.status}`);
  }

  const geoData = await geoResponse.json();

  if (!geoData.results || geoData.results.length === 0) {
    return {
      error: `City not found: ${city}`,
    };
  }

  const {
    latitude,
    longitude,
    name,
    country,
  } = geoData.results[0];

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
  );

  if (!weatherResponse.ok) {
    throw new Error(`Weather API failed: ${weatherResponse.status}`);
  }

  const weatherData = await weatherResponse.json();

  return {
    city: name,
    country,
    temperature: weatherData.current.temperature_2m,
    humidity: weatherData.current.relative_humidity_2m,
    windSpeed: weatherData.current.wind_speed_10m,
  };
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