// LM Studio API Service for Garment Analysis
import type { GarmentAnalysis } from '@/types';

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
        model: 'qwen3-vl-2b',
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
        temperature: 0.3,
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
