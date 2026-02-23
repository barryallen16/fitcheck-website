// LM Studio API Service for Garment Analysis
import type { GarmentAnalysis } from '@/types';
// Add this import at the top if it isn't there
import type { WeatherData } from '@/types';

// ... existing analyzeGarment and checkLMStudioHealth functions ...

const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';

const ANALYSIS_PROMPT = `You are an expert fashion stylist. Analyze the Indian ethnic clothing in the image and determine the ideal pairing. COPY THE EXACT JSON PATTERN BELOW.

RULES:
- "analyzed_garment": A one-line detailed description of the main garment shown in the image. Include color, fabric, and style.
- "pairing_attributes": A JSON array of highly specific, standalone physical descriptors (e.g., exact color, fabric type, pattern, cut, garment type) optimized for vector embedding search to find a pairing in a wardrobe database. NEVER use relative words like "matching", "complementary", "similar", or "this".
- "category": State the type of garment needed to complete the look (e.g., "Lehenga", "Dupatta", "Palazzo", "Churidar", "Salwar").
- Output ONLY raw, unformatted JSON.
- STRICT REQUIREMENT: Do not use Markdown, do not use \`\`\`json code blocks, and do not include any conversational text.

PATTERN TO COPY:
{"analyzed_garment":"Women's mustard yellow embroidered silk Anarkali top","pairing_attributes":["solid crimson red", "banarasi brocade", "wide-leg palazzo", "gold zari border"],"category":"Palazzo"}

USER INPUT: Analyze the main garment.
RAW JSON OUTPUT:`;

export async function analyzeGarment(imageBase64: string): Promise<GarmentAnalysis> {
  try {
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'lmstudio-community/qwen3-vl-4b-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: ANALYSIS_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.6,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed: GarmentAnalysis = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    
    throw new Error('Failed to parse garment analysis');
  } catch (error) {
    console.error('Error analyzing garment:', error);
    throw error;
  }
}

export async function generateLocalStylistRecommendation(
  wardrobeInventory: { id: string; category: string; description: string }[],
  weather: WeatherData,
  rejectedPairs: string[] = [] // <-- Add this new parameter
) {
  try {
    // Format the rejected pairs into readable text for the LLM
    const rejectedText = rejectedPairs.length > 0 
      ? `\nPREVIOUSLY SUGGESTED PAIRS TO AVOID:\n${rejectedPairs.map(p => {
          const [top, bottom] = p.split('|');
          return `- Top ID: "${top}" paired with Bottom ID: "${bottom}"`;
        }).join('\n')}\nCRITICAL RULE: You MUST NOT suggest any of the exact pairs listed above.`
      : '';

    const prompt = `You are an elite fashion stylist. Review the user's wardrobe inventory and current weather, and select the perfect 2-piece outfit strictly using the provided item IDs.

CURRENT WEATHER: ${weather.temperature}°C, ${weather.condition}.
WARDROBE INVENTORY: ${JSON.stringify(wardrobeInventory)}${rejectedText}

RULES:
1. Select exactly one 'top_id' and exactly one 'bottom_id' from the inventory.
2. The combination must make sense aesthetically and for the weather.
3. Output ONLY raw, valid JSON. Do not include markdown blocks (\`\`\`json). Do not add any conversational text.

REQUIRED JSON FORMAT:
{
  "top_id": "string",
  "bottom_id": "string",
  "colorLogic": "string",
  "silhouetteLogic": "string",
  "occasion": "string"
}

RAW JSON OUTPUT:`;

    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'lmstudio-community/qwen3-vl-4b-instruct', // Or whatever model you have loaded in LM Studio
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only fashion stylist AI. You only output valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Keep low for more deterministic JSON output
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Use Regex to extract just the JSON part, in case the local model hallucinates extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse JSON from local model');
  } catch (error) {
    console.error('Error with local LM Studio stylist:', error);
    return null;
  }
}
// Health check for LM Studio
export async function checkLMStudioHealth(): Promise<boolean> {
  try {
    const response = await fetch(LM_STUDIO_URL.replace('/chat/completions', '/models'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
