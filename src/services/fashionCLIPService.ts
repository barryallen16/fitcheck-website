// Marqo FashionCLIP Service for Vector Search
// This service uses the Marqo FashionCLIP model locally via Transformers.js

import { 
  CLIPTextModelWithProjection, 
  CLIPVisionModelWithProjection, 
  AutoTokenizer, 
  AutoProcessor, 
  RawImage 
} from '@huggingface/transformers';
import type { WardrobeItem } from '@/types';

const MODEL_ID = 'Marqo/marqo-fashionCLIP';

// Singleton pattern for lazy loading models so we only download/initialize them once
class PipelineManager {
  static tokenizer: any = null;
  static textModel: any = null;
  static processor: any = null;
  static visionModel: any = null;
  static initializationPromise: Promise<void> | null = null;

  static async getInstance() {
    if (!this.initializationPromise) {
      this.initializationPromise = (async () => {
        console.log("Loading Marqo-FashionCLIP models. This might take a moment on the first run...");
        this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
        this.textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID);
        this.processor = await AutoProcessor.from_pretrained(MODEL_ID);
        this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID);
        console.log("Marqo-FashionCLIP models loaded successfully!");
      })();
    }
    
    await this.initializationPromise;
    
    return {
      tokenizer: this.tokenizer,
      textModel: this.textModel,
      processor: this.processor,
      visionModel: this.visionModel
    };
  }
}

// Generate text embedding for pairing attributes
export async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    const { tokenizer, textModel } = await PipelineManager.getInstance();
    
    // Run tokenization
    const text_inputs = tokenizer([text], { padding: 'max_length', truncation: true });
    
    // Compute text embeddings
    const { text_embeds } = await textModel(text_inputs);
    
    // Normalize and return as a standard array
    return text_embeds.normalize().tolist()[0];
  } catch (error) {
    console.error('Error generating text embedding:', error);
    return generateMockEmbedding();
  }
}

// Generate image embedding for wardrobe items
export async function generateImageEmbedding(imageBase64: string): Promise<number[]> {
  try {
    const { processor, visionModel } = await PipelineManager.getInstance();

    // Format properly for Transformers.js RawImage
    const dataUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    // Read image and run processor
    const image = await RawImage.read(dataUrl);
    const image_inputs = await processor(image);

    // Compute vision embeddings
    const { image_embeds } = await visionModel(image_inputs);
    
    // Normalize and return as a standard array
    return image_embeds.normalize().tolist()[0];
  } catch (error) {
    console.error('Error generating image embedding:', error);
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
          // In a fully optimized app, we would save embeddings in IndexedDB.
          // Since we process locally, generating text dynamically on the fly is fast enough.
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
    // Fallback: return random item
    const filtered = wardrobe.filter(item => item.id !== excludeId);
    return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : null;
  }
}

// Generate mock embedding for demo/fallback purposes
function generateMockEmbedding(): number[] {
  return Array.from({ length: 512 }, () => Math.random() * 2 - 1);
}

// Simple attribute-based matching (fallback when AI is unavailable)
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