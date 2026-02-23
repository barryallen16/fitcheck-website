// Marqo FashionCLIP Service for Vector Search
// This service uses the Marqo FashionCLIP model for fashion-specific image-text matching

import type { WardrobeItem } from '@/types';

// Using Hugging Face Inference API for FashionCLIP
const HF_API_URL = 'https://api-inference.huggingface.co/models/Marqo/marqo-fashionCLIP';
const HF_API_TOKEN = import.meta.env.VITE_HF_API_TOKEN || '';

// Generate text embedding for pairing attributes
export async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HF_API_TOKEN}`,
      },
      body: JSON.stringify({
        inputs: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`FashionCLIP API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding || data;
  } catch (error) {
    console.error('Error generating text embedding:', error);
    // Return mock embedding for demo purposes
    return generateMockEmbedding();
  }
}

// Generate image embedding for wardrobe items
export async function generateImageEmbedding(imageBase64: string): Promise<number[]> {
  try {
    // Convert base64 to blob
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image', blob, 'garment.jpg');

    const response = await fetch(`${HF_API_URL}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`FashionCLIP image API error: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding || data;
  } catch (error) {
    console.error('Error generating image embedding:', error);
    // Return mock embedding for demo purposes
    return generateMockEmbedding();
  }
}

// Calculate cosine similarity between two embeddings
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Find best matching garment from wardrobe
export async function findBestMatch(
  pairingAttributes: string[],
  wardrobe: WardrobeItem[],
  excludeId?: string
): Promise<WardrobeItem | null> {
  if (wardrobe.length === 0) return null;

  try {
    // Combine pairing attributes into a search query
    const searchQuery = pairingAttributes.join(' ');
    const queryEmbedding = await generateTextEmbedding(searchQuery);

    // Calculate similarity scores for each wardrobe item
    const scoredItems = await Promise.all(
      wardrobe
        .filter(item => item.id !== excludeId)
        .map(async (item) => {
          // In a real implementation, we would store pre-computed embeddings
          // For demo, we'll use a simple scoring based on attribute matching
          const itemText = `${item.analysis.analyzed_garment} ${item.analysis.category}`;
          const itemEmbedding = await generateTextEmbedding(itemText);
          const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
          
          return {
            item,
            similarity,
          };
        })
    );

    // Sort by similarity score (descending)
    scoredItems.sort((a, b) => b.similarity - a.similarity);

    return scoredItems.length > 0 ? scoredItems[0].item : null;
  } catch (error) {
    console.error('Error finding best match:', error);
    // Fallback: return random item for demo
    const filtered = wardrobe.filter(item => item.id !== excludeId);
    return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : null;
  }
}

// Generate mock embedding for demo purposes
function generateMockEmbedding(): number[] {
  return Array.from({ length: 512 }, () => Math.random() * 2 - 1);
}

// Simple attribute-based matching (fallback when API is unavailable)
export function attributeBasedMatching(
  pairingAttributes: string[],
  wardrobe: WardrobeItem[],
  targetCategory: string,
  excludeId?: string
): WardrobeItem | null {
  const filtered = wardrobe.filter(
    item => item.id !== excludeId && 
    item.analysis.category.toLowerCase() === targetCategory.toLowerCase()
  );

  if (filtered.length === 0) return null;

  // Score each item based on attribute overlap
  const scored = filtered.map(item => {
    const itemText = item.analysis.analyzed_garment.toLowerCase();
    let score = 0;
    
    pairingAttributes.forEach(attr => {
      if (itemText.includes(attr.toLowerCase())) {
        score += 1;
      }
    });

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.item || filtered[0];
}
