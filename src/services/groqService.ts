// src/services/groqService.ts
import type { WeatherData } from "@/types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Load keys and split by comma, cleaning up any whitespace
const API_KEYS = (import.meta.env.VITE_GROQ_API_KEY || "")
  .split(",")
  .map((k: string) => k.trim())
  .filter(Boolean);

let currentKeyIndex = 0;

// Helper function to handle API Key Spinning for Groq
async function fetchWithKeySpinning(
  baseUrl: string,
  options: RequestInit,
): Promise<Response> {
  if (API_KEYS.length === 0) {
    throw new Error("No Groq API keys provided in environment variables.");
  }

  let attempts = 0;

  while (attempts < API_KEYS.length) {
    const key = API_KEYS[currentKeyIndex];

    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${key}`);

    const response = await fetch(baseUrl, {
      ...options,
      headers,
    });

    if (response.status === 429) {
      console.warn(
        `Groq API Key at index ${currentKeyIndex} rate-limited. Spinning to next key...`,
      );
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      attempts++;
      continue;
    }

    return response;
  }

  throw new Error("All Groq API keys have exceeded their rate limits.");
}

export interface StylistInventoryPayload {
  tops: { id: string; category: string; description: string }[];
  bottoms: { id: string; category: string; description: string }[];
}

// LLM Stylist Recommendation powered by Groq (openai/gpt-oss-120b)
export async function generateStylistRecommendationGroq(
  inventory: StylistInventoryPayload | { id: string; category: string; description: string }[],
  weather: WeatherData,
  rejectedPairs: string[] = [],
) {
  // Groq is optional. When unconfigured, silently return null so FitCheck's fine-tuned model and rotation engine take over.
  if (API_KEYS.length === 0) {
    return null;
  }

  try {
    const rejectedText =
      rejectedPairs.length > 0
        ? `\n\nPREVIOUSLY SUGGESTED PAIRS TO AVOID:\n${rejectedPairs
            .map((p) => {
              const [top, bottom] = p.split("|");
              return `- Top ID: "${top}" paired with Bottom ID: "${bottom}"`;
            })
            .join(
              "\n",
            )}\nCRITICAL RULE: You MUST NOT suggest any of the exact pairs listed above. Pick a new, unique combination.`
        : "";

    const systemInstruction = `You are an elite fashion stylist specializing in Indian ethnic wear and modern fusion. 
Your task is to review the separate TOPS and BOTTOMS inventories and current weather, and select a balanced 2-piece outfit combination strictly using the provided item IDs.

STRICT RULES:
1. You MUST select exactly one 'top_id' STRICTLY from the provided TOPS list. Never pick a dress, blazer, or lower garment as top.
2. You MUST select exactly one 'bottom_id' STRICTLY from the provided BOTTOMS list. Never pick another kurti, top, dress, or blazer as bottom.
3. The combination must create pleasing color and fabric harmony suited for ${weather.temperature}°C, ${weather.condition}.
4. Provide short, engaging explanations for your choices.
5. Return ONLY valid, raw JSON. No markdown formatting.

JSON FORMAT:
{
  "top_id": "string",
  "bottom_id": "string",
  "colorLogic": "string",
  "silhouetteLogic": "string",
  "occasion": "string"
}`;

    let inventoryPromptText = '';
    if ('tops' in inventory && 'bottoms' in inventory) {
      inventoryPromptText = `AVAILABLE TOPS (Select top_id strictly from this list):
${JSON.stringify(inventory.tops)}

AVAILABLE BOTTOMS (Select bottom_id strictly from this list):
${JSON.stringify(inventory.bottoms)}`;
    } else {
      inventoryPromptText = `WARDROBE INVENTORY: ${JSON.stringify(inventory)}`;
    }

    const prompt = `CURRENT WEATHER: ${weather.temperature}°C, ${weather.condition}. 
${inventoryPromptText}${rejectedText}`;

    const response = await fetchWithKeySpinning(GROQ_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty response from Groq");

    return JSON.parse(content);
  } catch (error) {
    console.error("Error generating stylist recommendation with Groq:", error);
    return null;
  }
}
