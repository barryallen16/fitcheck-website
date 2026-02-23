// Gemini API Service for Virtual Try-On
// Gemini API Service for Virtual Try-On

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export async function generateVirtualTryOn(
  fullBodyImage: string,
  garmentImages: string[],
  garmentDescriptions: string[]
): Promise<string> {
  try {
    const garmentDesc = garmentDescriptions.join(' and ');
    
    const prompt = `A full-length photograph of the subject from image_1.png, maintaining their exact pose, expression, and anatomy. The subject is now wearing the garment shown in image_0.png. The new garment— ${garmentDesc} worn realistically over the subject's body, completely replacing their original top/outfit. The fabric shows realistic texture, folds, and shadowing consistent with the garment's material. The subject retains all other existing elements from image_1.png. The background and lighting remain identical to the original image_1.png`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: garmentImages[0],
                },
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: fullBodyImage,
                },
              },
            ],
          },
        ],
        generation_config: {
          response_modalities: ['Text', 'Image'],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract generated image from response
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: { inlineData?: { data: string } }) => part.inlineData);
    
    if (imagePart?.inlineData?.data) {
      return imagePart.inlineData.data;
    }

    throw new Error('No image generated');
  } catch (error) {
    console.error('Error generating virtual try-on:', error);
    throw error;
  }
}

// Alternative: Using Gemini for outfit description/generation
export async function generateOutfitDescription(
  garments: string[]
): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Describe this outfit combination in an engaging way: ${garments.join(' with ')}. Keep it under 100 words.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Beautiful outfit combination!';
  } catch (error) {
    console.error('Error generating outfit description:', error);
    return 'A stunning combination perfect for any occasion!';
  }
}
