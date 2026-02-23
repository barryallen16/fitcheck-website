// src/services/groqService.ts
import type { WeatherData } from '@/types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Load keys and split by comma, cleaning up any whitespace
const API_KEYS = (import.meta.env.VITE_GROQ_API_KEY || '')
  .split(',')
  .map((k: string) => k.trim())
  .filter(Boolean);

let currentKeyIndex = 0;

// Helper function to handle API Key Spinning for Groq
async function fetchWithKeySpinning(
  baseUrl: string, 
  options: RequestInit
): Promise<Response> {
  if (API_KEYS.length === 0) {
    throw new Error('No Groq API keys provided in environment variables.');
  }

  let attempts = 0;
  
  while (attempts < API_KEYS.length) {
    const key = API_KEYS[currentKeyIndex];
    
    // Groq uses Bearer token authorization in the headers
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${key}`);
    
    const response = await fetch(baseUrl, {
      ...options,
      headers
    });
    
    // If we hit a rate limit (429), spin to the next key
    if (response.status === 429) {
      console.warn(`Groq API Key at index ${currentKeyIndex} rate-limited. Spinning to next key...`);
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      attempts++;
      continue; 
    }
    
    // Return immediately on success or other errors
    return response;
  }

  throw new Error('All Groq API keys have exceeded their rate limits.');
}

// LLM Stylist Recommendation powered by Groq (openai/gpt-oss-120b)
export async function generateStylistRecommendationGroq(
  wardrobeInventory: { id: string; category: string; description: string }[],
  weather: WeatherData,
  rejectedPairs: string[] = [] 
) {
  try {
    const rejectedText = rejectedPairs.length > 0 
      ? `\n\nPREVIOUSLY SUGGESTED PAIRS TO AVOID:\n${rejectedPairs.map(p => {
          const [top, bottom] = p.split('|');
          return `- Top ID: "${top}" paired with Bottom ID: "${bottom}"`;
        }).join('\n')}\nCRITICAL RULE: You MUST NOT suggest any of the exact pairs listed above. Pick a new, unique combination.`
      : '';

    const systemInstruction = `You are an elite fashion stylist specializing in Indian ethnic wear. 
Your task is to review a user's exact wardrobe inventory and current weather conditions, and select the perfect 2-piece outfit combinations strictly using the provided item IDs.

RULES:
1. You MUST select exactly one 'top_id' and exactly one 'bottom_id' from the provided JSON inventory.
2. The combination must make sense aesthetically (color, fabric) and functionally.
3. The outfit must be appropriate for the current weather: ${weather.temperature}°C, ${weather.condition}.
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

    const prompt = `CURRENT WEATHER: ${weather.temperature}°C, ${weather.condition}. 
WARDROBE INVENTORY: ${JSON.stringify(wardrobeInventory)}${rejectedText}`;

    const response = await fetchWithKeySpinning(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        temperature: 1.0, 
        response_format: { type: "json_object" }, // Enforces pure JSON output on Groq
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error('Empty response from Groq');
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating stylist recommendation with Groq:', error);
    return null;
  }
}