// src/services/recommendationService.ts
import { generateStylistRecommendationGroq } from "./groqService";
import type { WardrobeItem, OutfitRecommendation, WeatherData } from "@/types";

// Lightweight interface for LocalStorage (NO base64 images)
interface StoredRecommendation {
  id: string;
  topGarmentId: string;
  bottomGarmentId: string;
  colorLogic: string;
  silhouetteLogic: string;
  occasion: string;
  weather: string;
  createdAt: string;
}

// --- HISTORY MANAGEMENT ---

export function getAllRecommendations(wardrobe: WardrobeItem[]): OutfitRecommendation[] {
  try {
    const historyJson = localStorage.getItem("fitcheck-all-recommendations");
    if (!historyJson) return [];

    const storedHistory: StoredRecommendation[] = JSON.parse(historyJson);

    // Re-hydrate full objects by matching IDs with the actual wardrobe
    return storedHistory.map(stored => {
      const top = wardrobe.find(w => w.id === stored.topGarmentId);
      const bottom = wardrobe.find(w => w.id === stored.bottomGarmentId);

      if (top && bottom) {
        return {
          id: stored.id,
          topGarment: top,
          bottomGarment: bottom,
          colorLogic: stored.colorLogic,
          silhouetteLogic: stored.silhouetteLogic,
          occasion: stored.occasion,
          weather: stored.weather,
          createdAt: new Date(stored.createdAt)
        };
      }
      return null;
    }).filter(Boolean) as OutfitRecommendation[]; // Remove any nulls if a garment was deleted
  } catch {
    return [];
  }
}

export function saveRecommendationToHistory(rec: OutfitRecommendation): void {
  try {
    const historyJson = localStorage.getItem("fitcheck-all-recommendations");
    const history: StoredRecommendation[] = historyJson ? JSON.parse(historyJson) : [];
    
    // Check if this exact pair already exists
    const exists = history.some(h => 
      (h.topGarmentId === rec.topGarment.id && h.bottomGarmentId === rec.bottomGarment.id) ||
      (h.topGarmentId === rec.bottomGarment.id && h.bottomGarmentId === rec.topGarment.id)
    );
    
    if (!exists) {
      // Save ONLY the lightweight data
      const lightRec: StoredRecommendation = {
        id: rec.id,
        topGarmentId: rec.topGarment.id,
        bottomGarmentId: rec.bottomGarment.id,
        colorLogic: rec.colorLogic,
        silhouetteLogic: rec.silhouetteLogic,
        occasion: rec.occasion,
        weather: rec.weather,
        createdAt: rec.createdAt.toISOString()
      };
      
      history.push(lightRec);

      // Keep only the last 50 outfits to guarantee we never hit quota again
      if (history.length > 50) history.shift();

      localStorage.setItem("fitcheck-all-recommendations", JSON.stringify(history));
    }
  } catch (error) {
    console.error("Error saving recommendation history:", error);
  }
}

// --- GENERATION PIPELINE ---

export async function generateDailyRecommendation(
  wardrobe: WardrobeItem[],
  weather: WeatherData,
): Promise<OutfitRecommendation | null> {
  if (wardrobe.length < 2) {
    return null;
  }

  // 1. Fetch lightweight history & re-hydrate
  const pastRecommendations = getAllRecommendations(wardrobe);
  
  // 2. Format them into a list of forbidden pairs
  const rejectedPairs = pastRecommendations.map(
    rec => `${rec.topGarment.id}|${rec.bottomGarment.id}`
  );

  const inventoryPayload = wardrobe.map(item => ({
    id: item.id,
    category: item.analysis.category,
    description: item.analysis.analyzed_garment 
  }));

  try {
    let stylistChoice = null;
    let attempts = 0;
    let isValidNewPair = false;

    while (attempts < 2 && !isValidNewPair) {
      // CALL GROQ API
      stylistChoice = await generateStylistRecommendationGroq(inventoryPayload, weather, rejectedPairs);
      
      if (!stylistChoice) {
        console.warn("API returned null (Rate limit or 503). Escaping to JS fallback...");
        break; 
      }

      if (!stylistChoice.top_id || !stylistChoice.bottom_id) {
        attempts++;
        continue;
      }

      const proposedPair = `${stylistChoice.top_id}|${stylistChoice.bottom_id}`;
      
      if (!rejectedPairs.includes(proposedPair)) {
        isValidNewPair = true;
      } else {
        console.warn(`Groq repeated pair ${proposedPair}. Retrying...`);
        attempts++;
      }
    }

    if (isValidNewPair && stylistChoice) {
      const topGarment = wardrobe.find(i => i.id === stylistChoice.top_id);
      const bottomGarment = wardrobe.find(i => i.id === stylistChoice.bottom_id);

      if (topGarment && bottomGarment) {
        return {
          id: `rec-${Date.now()}`,
          topGarment,
          bottomGarment,
          colorLogic: stylistChoice.colorLogic,
          silhouetteLogic: stylistChoice.silhouetteLogic,
          occasion: stylistChoice.occasion,
          weather: weather.recommendation,
          createdAt: new Date(),
        };
      }
    }

    throw new Error("API exhausted attempts. Triggering fallback.");

  } catch (error) {
    console.log("Activating JS Fallback Matcher...");

    let fallbackTop: WardrobeItem | null = null;
    let fallbackBottom: WardrobeItem | null = null;

    for (const top of wardrobe) {
      for (const bottom of wardrobe) {
        if (top.id === bottom.id) continue; 
        
        const pairId = `${top.id}|${bottom.id}`;
        const reversePairId = `${bottom.id}|${top.id}`; 

        if (!rejectedPairs.includes(pairId) && !rejectedPairs.includes(reversePairId)) {
          fallbackTop = top;
          fallbackBottom = bottom;
          break;
        }
      }
      if (fallbackTop) break;
    }

    if (fallbackTop && fallbackBottom) {
      return {
        id: `rec-${Date.now()}-fallback`,
        topGarment: fallbackTop,
        bottomGarment: fallbackBottom,
        colorLogic: "A fresh mix-and-match combination to explore your wardrobe's potential.",
        silhouetteLogic: "An experimental pairing to discover new personal styles.",
        occasion: "Casual Discovery",
        weather: weather.recommendation,
        createdAt: new Date(),
      };
    }

    return null;
  }
}