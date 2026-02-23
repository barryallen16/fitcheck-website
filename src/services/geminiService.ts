import type { WeatherData } from '@/types';

// Updated to the latest 2.5 Flash models based on the new documentation
const GEMINI_TEXT_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const API_KEYS = (import.meta.env.VITE_GEMINI_API_KEY || '')
  .split(',')
  .map((k: string) => k.trim())
  .filter(Boolean);

let currentKeyIndex = 0;

async function fetchWithKeySpinning(
  baseUrl: string, 
  options: RequestInit
): Promise<Response> {
  if (API_KEYS.length === 0) {
    throw new Error('No Gemini API keys provided in environment variables.');
  }

  let attempts = 0;
  
  while (attempts < API_KEYS.length) {
    const key = API_KEYS[currentKeyIndex];
    const url = `${baseUrl}?key=${key}`;
    
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      console.warn(`Gemini API Key at index ${currentKeyIndex} rate-limited. Spinning to next key...`);
      currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
      attempts++;
      continue; 
    }
    
    return response;
  }

  throw new Error('All Gemini API keys have exceeded their rate limits.');
}

export async function generateStylistRecommendation(
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
  "colorLogic": "string (Why these colors work)",
  "silhouetteLogic": "string (Why these shapes/garments work together)",
  "occasion": "string"
}`;

    const prompt = `CURRENT WEATHER: ${weather.temperature}°C, ${weather.condition}. 
WARDROBE INVENTORY: ${JSON.stringify(wardrobeInventory)}${rejectedText}`;

    const response = await fetchWithKeySpinning(GEMINI_TEXT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1.2, // High temp for creative combinations
          responseMimeType: "application/json", 
        },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) throw new Error('Empty response from Gemini');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating stylist recommendation:', error);
    return null;
  }
}