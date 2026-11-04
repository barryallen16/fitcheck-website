// FitCheck API Service for Garment Analysis & Stylist Recommendations
import type { GarmentAnalysis } from '@/types';
import type { WeatherData } from '@/types';

// 24/7 Cloud endpoint powered by fitcheck-qwen3vl-2b
export const CLOUD_API_URL = 'https://barryallen16-fitcheck.hf.space';
const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';

export interface CompatibilityResponse {
  compatible: boolean;
  probability: number;
  score: number; // 1-5 scale
  rationale: string;
}

export async function evaluateCompatibility(
  anchor: string,
  candidate: string
): Promise<CompatibilityResponse | null> {
  try {
    const cloudResp = await fetch(`${CLOUD_API_URL}/evaluate-compatibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anchor, candidate }),
    });

    if (cloudResp.ok) {
      const data = await cloudResp.json();
      return {
        compatible: Boolean(data.compatible),
        probability: typeof data.probability === 'number' ? data.probability : (data.compatible ? 0.9 : 0.2),
        score: typeof data.score === 'number' ? data.score : (data.compatible ? 4.5 : 2.0),
        rationale: data.rationale || (data.compatible ? 'Harmonious pairing.' : 'Stylistically incompatible.'),
      };
    }
  } catch (err) {
    console.warn('Cloud evaluate-compatibility endpoint unavailable:', err);
  }
  return null;
}

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
  // 1. Try 24/7 Cloud endpoint powered by fine-tuned Liquid AI LFM3-VL-2B
  try {
    const cloudResp = await fetch(`${CLOUD_API_URL}/analyze-garment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${imageBase64}`,
      }),
    });

    if (cloudResp.ok) {
      const data = await cloudResp.json();
      if (data.analyzed_garment) {
        return {
          summary: data.analyzed_garment,
          analyzed_garment: data.analyzed_garment,
          category: data.category || 'Garment',
        };
      }
    }
  } catch (cloudErr) {
    console.warn('Cloud LFM3-VL-2B endpoint unavailable, trying local fallback:', cloudErr);
  }

  // 2. Fallback to local LM Studio if available
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
  rejectedPairs: string[] = []
) {
  try {
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

    const requestBody = {
      model: 'barryallen16/fitcheck-qwen3vl-2b',
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
      temperature: 0.3,
      max_tokens: 500,
    };

    // Try cloud endpoint first
    try {
      const cloudResp = await fetch(`${CLOUD_API_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (cloudResp.ok) {
        const cloudData = await cloudResp.json();
        const content = cloudData.choices[0]?.message?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    } catch {}

    // Fallback to local
    const response = await fetch(LM_STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
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

// Health check for model API (Cloud 24/7 or Local LM Studio)
export async function checkLMStudioHealth(): Promise<boolean> {
  try {
    const cloudResp = await fetch(`${CLOUD_API_URL}/health`, {
      method: 'GET',
    });
    if (cloudResp.ok) {
      return true;
    }
  } catch {}

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
