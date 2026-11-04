// src/services/recommendationService.ts
import { generateStylistRecommendationGroq } from "./groqService";
import { evaluateCompatibility } from "./lmStudioService";
import type { WardrobeItem, OutfitRecommendation, OutfitType, WeatherData } from "@/types";

// Lightweight interface for LocalStorage (NO base64 images)
interface StoredRecommendation {
  id: string;
  outfitType?: OutfitType;
  topGarmentId?: string;
  bottomGarmentId?: string;
  standaloneGarmentId?: string;
  layerGarmentId?: string;
  colorLogic: string;
  silhouetteLogic: string;
  occasion: string;
  weather: string;
  createdAt: string;
}

// --- CANONICAL CATEGORY TAXONOMY ---

export const BASE_TOP_CATEGORIES = new Set([
  'Shirt',
  'Kurti',
  'Kurta',
  'Top',
  'T-Shirt',
  'Blouse',
  'Tunic',
  'Camisole',
]);

export const BOTTOM_CATEGORIES = new Set([
  'Jeans',
  'Pants',
  'Pajama',
  'Palazzo',
  'Churidar',
  'Skirt',
  'Salwar',
  'Leggings',
  'Culottes',
  'Trousers',
  'Dhoti',
]);

export const LAYER_CATEGORIES = new Set([
  'Blazer',
  'Jacket',
  'Cardigan',
  'Coat',
  'Cape',
  'Shrug',
  'Dupatta',
]);

export const ONE_PIECE_CATEGORIES = new Set([
  'Saree',
  'Sherwani',
  'Anarkali',
  'Dress',
  'Gown',
  'Lehenga',
  'Jumpsuit',
]);

// --- STRICT VALIDATION PREDICATES ---

export function isBaseTop(item?: WardrobeItem | null): boolean {
  if (!item?.analysis?.category) return false;
  return BASE_TOP_CATEGORIES.has(item.analysis.category);
}

export function isBottom(item?: WardrobeItem | null): boolean {
  if (!item?.analysis?.category) return false;
  return BOTTOM_CATEGORIES.has(item.analysis.category);
}

export function isLayer(item?: WardrobeItem | null): boolean {
  if (!item?.analysis?.category) return false;
  return LAYER_CATEGORIES.has(item.analysis.category);
}

export function isOnePiece(item?: WardrobeItem | null): boolean {
  if (!item?.analysis?.category) return false;
  return ONE_PIECE_CATEGORIES.has(item.analysis.category);
}

// Extract primary color from summary/description
export function getGarmentColor(item?: WardrobeItem | null): string {
  if (!item?.analysis?.summary) return 'neutral';
  const s = (item.analysis.summary + ' ' + (item.analysis.analyzed_garment || '')).toLowerCase();
  if (s.includes('navy blue') || s.includes('dark blue')) return 'navy';
  if (s.includes('light blue')) return 'light_blue';
  if (s.includes('indigo') || s.includes('dark indigo')) return 'indigo';
  if (s.includes('charcoal')) return 'charcoal';
  if (s.includes('black')) return 'black';
  if (s.includes('white')) return 'white';
  if (s.includes('cream')) return 'cream';
  if (s.includes('tan')) return 'tan';
  if (s.includes('gold')) return 'gold';
  if (s.includes('olive') || s.includes('olive green')) return 'olive';
  if (s.includes('purple')) return 'purple';
  if (s.includes('mint') || s.includes('mint green')) return 'mint';
  if (s.includes('pink') || s.includes('coral pink')) return 'pink';
  if (s.includes('beige')) return 'beige';
  if (s.includes('maroon') || s.includes('burgundy') || s.includes('crimson')) return 'maroon';
  if (s.includes('teal')) return 'teal';
  return 'neutral';
}

export interface OutfitSynergyResult {
  valid: boolean;
  score: number;
  reason?: string;
  colorLogic?: string;
  silhouetteLogic?: string;
  occasion?: string;
}

// Deep stylistic and cultural harmony evaluation for 2-Piece / 3-Piece Outfits
export function evaluateOutfitSynergy(
  top?: WardrobeItem | null,
  bottom?: WardrobeItem | null,
  weather?: WeatherData | null
): OutfitSynergyResult {
  if (!top || !bottom) {
    return { valid: false, score: 0, reason: 'Missing top or bottom garment' };
  }
  if (top.id === bottom.id) {
    return { valid: false, score: 0, reason: 'Cannot pair garment with itself' };
  }

  // 1. Structural Category Guard:
  if (!isBaseTop(top)) {
    return { 
      valid: false, 
      score: 0, 
      reason: `Upper garment "${top.analysis.summary}" (${top.analysis.category}) is not a valid base top` 
    };
  }
  if (!isBottom(bottom)) {
    return { 
      valid: false, 
      score: 0, 
      reason: `Lower garment "${bottom.analysis.summary}" (${bottom.analysis.category}) is not a valid bottom` 
    };
  }

  const topCat = top.analysis.category;
  const botCat = bottom.analysis.category;
  const topSummary = top.analysis.summary;
  const botSummary = bottom.analysis.summary;
  const topColor = getGarmentColor(top);
  const botColor = getGarmentColor(bottom);

  // 2. Cultural & Sartorial Genre Rules:
  // Case A: Ethnic Tops (Kurti, Tunic)
  if (topCat === 'Kurti' || topCat === 'Tunic') {
    if (botCat === 'Pants' || botCat === 'Trousers' || botCat === 'Culottes') {
      return { 
        valid: false, 
        score: 0, 
        reason: 'Traditional Kurti cannot be paired with western office trousers or culottes' 
      };
    }
    if (botCat === 'Skirt' && !botSummary.toLowerCase().includes('embroidered')) {
      return { 
        valid: false, 
        score: 0, 
        reason: 'Kurti cannot be paired with a plain western skirt' 
      };
    }
  } 
  // Case B: Western Tops (Shirt, Slip Top, Turtleneck, Blouse, T-Shirt, Camisole)
  else {
    if (botCat === 'Churidar' || botCat === 'Salwar' || botCat === 'Dhoti' || botCat === 'Palazzo') {
      return { 
        valid: false, 
        score: 0, 
        reason: `Western ${topCat} cannot be paired with traditional Indian ${botCat}` 
      };
    }
  }

  // 3. Color Harmony & Palette Coordination
  let score = 5.0;
  let colorLogic = `Harmonious color dialogue pairing ${topSummary} with ${botSummary}.`;

  if ((topColor === 'light_blue' && botColor === 'pink') || (topColor === 'pink' && botColor === 'light_blue')) {
    return { valid: false, score: 0, reason: 'Clashing pastel block' };
  }

  // 4. Silhouette & Drape Balance
  let silhouetteLogic = '';
  if (topCat === 'Kurti' && botCat === 'Churidar') {
    silhouetteLogic = 'Authentic straight-cut Kurti silhouette tapered cleanly with ruched churidar ankles for graceful vertical lines.';
  } else if (topCat === 'Kurti' && botCat === 'Palazzo') {
    silhouetteLogic = 'Flattering A-line Kurti drape flowing effortlessly into flared palazzo volume for relaxed festive movement.';
  } else if (topCat === 'Kurti' && botCat === 'Jeans') {
    silhouetteLogic = 'Contemporary Indo-Western fusion: relaxed tunic length balanced against structured denim leg architecture.';
  } else if (topCat === 'Shirt' && botCat === 'Pants') {
    silhouetteLogic = 'Crisp tailored button-down tucked into straight formal trousers for a sharp, confident corporate presence.';
  } else if (topCat === 'Shirt' && botCat === 'Jeans') {
    silhouetteLogic = 'Effortless classic proportions: tailored collared shirt contrasting casually with wide-leg denim drape.';
  } else if (botCat === 'Skirt') {
    silhouetteLogic = 'Fitted bodice creating high-waist definition that cascades smoothly into a structured flared skirt.';
  } else {
    silhouetteLogic = `Balanced ${topCat} upper volume grounded comfortably over ${botCat} proportions for effortless mobility.`;
  }

  // 5. Weather Fabric Alignment
  if (weather && weather.temperature > 28) {
    const fabricText = (topSummary + ' ' + botSummary).toLowerCase();
    if (fabricText.includes('cotton') || fabricText.includes('linen') || fabricText.includes('silk')) {
      score += 0.3;
    }
  }

  // 6. Context & Occasion Mapping
  let occasion = 'Everyday Smart Casual';
  if (topCat === 'Kurti' && (botCat === 'Churidar' || botCat === 'Palazzo')) {
    occasion = (topColor === 'gold' || botColor === 'gold' || topColor === 'purple') 
      ? 'Festive Celebration & Traditional Soirée' 
      : 'Ethnic Daily Elegance & Cultural Occasion';
  } else if (topCat === 'Kurti' && botCat === 'Jeans') {
    occasion = 'Indo-Western College & Smart Casual Daywear';
  } else if (topCat === 'Shirt' && botCat === 'Pants') {
    occasion = 'Corporate Executive & Professional Polish';
  } else if (topSummary.toLowerCase().includes('slip top')) {
    occasion = 'Evening Soirée & Minimalist Chic';
  } else if (topCat === 'Blouse' || botCat === 'Skirt') {
    occasion = 'Weekend Brunch & Social Gathering';
  }

  return {
    valid: true,
    score,
    colorLogic,
    silhouetteLogic,
    occasion,
  };
}

// Standalone One-Piece Ensemble Evaluation (Saree, Anarkali, Dress)
export function evaluateOnePieceEnsemble(
  item: WardrobeItem,
  _weather?: WeatherData | null
): OutfitSynergyResult {
  if (!item || !isOnePiece(item)) {
    return { valid: false, score: 0, reason: 'Not a standalone one-piece ensemble' };
  }

  const cat = item.analysis.category;
  const color = getGarmentColor(item);
  let score = 5.0;
  let colorLogic = '';
  let silhouetteLogic = '';
  let occasion = '';

  if (cat === 'Saree') {
    occasion = 'Heritage Celebration & Banarasi Splendor';
    silhouetteLogic = 'Traditional six-yard sculpted pallu creating timeless, stately posture and regal elegance.';
    colorLogic = `Luminous ${color} silk drape showcasing rich artisanal handloom heritage and unbroken vertical flow.`;
  } else if (cat === 'Sherwani') {
    occasion = 'Imperial Wedding Gala & Royal Reception';
    silhouetteLogic = 'Regal structured bandhgala silhouette with immaculate shoulder architecture and stately knee-length drop.';
    colorLogic = `Authoritative ${color} self-textured fabric offering commanding presence and imperial celebration prestige.`;
  } else if (cat === 'Anarkali') {
    occasion = 'Festive Celebration & Traditional Grandeur';
    silhouetteLogic = 'Voluminous A-line flared Anarkali silhouette delivering imperial grace and fluid movement.';
    colorLogic = `Opulent ${color} tonal ensemble accented with intricate embroidery for radiant festive presence.`;
  } else {
    occasion = 'Contemporary Social & Evening Elegance';
    silhouetteLogic = 'Fluid one-piece silhouette with clean waistline taper and graceful vertical drape.';
    colorLogic = `Understated ${color} monochrome aesthetic delivering effortless modern polish and balance.`;
  }

  return {
    valid: true,
    score,
    colorLogic,
    silhouetteLogic,
    occasion,
  };
}

export function isValidTwoPieceOutfit(
  top?: WardrobeItem | null, 
  bottom?: WardrobeItem | null
): boolean {
  return evaluateOutfitSynergy(top, bottom).valid;
}

export function isValidOnePieceOutfit(item?: WardrobeItem | null): boolean {
  if (!item) return false;
  return isOnePiece(item);
}

// Find a compatible outer layer (Blazer or Cape) for 2-piece / 3-piece outfits
export function findCompatibleLayer(
  top: WardrobeItem,
  _bottom: WardrobeItem,
  wardrobe: WardrobeItem[]
): WardrobeItem | undefined {
  const layers = wardrobe.filter(isLayer);
  if (layers.length === 0) return undefined;

  const topCat = top.analysis.category;

  // Western outfits (Shirt, Top, Blouse, Turtleneck): Tailored Blazer
  if (topCat !== 'Kurti' && topCat !== 'Tunic') {
    const blazer = layers.find(l => l.analysis.summary.toLowerCase().includes('blazer'));
    if (blazer) return blazer;
  }

  // Ethnic outfits (Kurta, Kurti): Nehru Jacket or Flowing Patterned Cape
  if (topCat === 'Kurta' || topCat === 'Kurti' || topCat === 'Tunic') {
    const nehru = layers.find(l => 
      l.analysis.summary.toLowerCase().includes('nehru') || 
      l.analysis.category === 'Jacket'
    );
    if (nehru) return nehru;
    const cape = layers.find(l => 
      l.analysis.summary.toLowerCase().includes('cape') || 
      l.analysis.summary.toLowerCase().includes('patterned')
    );
    if (cape) return cape;
  }

  return undefined;
}

// Find a compatible outer layer for standalone one-piece ensembles
export function findCompatibleLayerForOnePiece(
  item: WardrobeItem,
  wardrobe: WardrobeItem[]
): WardrobeItem | undefined {
  const layers = wardrobe.filter(isLayer);
  if (layers.length === 0) return undefined;

  const cat = item.analysis.category;
  if (cat === 'Anarkali') {
    return layers.find(l => l.analysis.summary.toLowerCase().includes('cape'));
  }
  if (cat === 'Dress') {
    return layers.find(l => l.analysis.summary.toLowerCase().includes('blazer'));
  }
  return undefined;
}

// --- HISTORY MANAGEMENT & STORAGE SANITIZATION ---

export function clearAllRecommendations(): void {
  try {
    localStorage.removeItem("fitcheck-all-recommendations");
    localStorage.removeItem("fitcheck-recommendation-history");
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith("fitcheck-today-id") || 
        key.startsWith("fitcheck-all-rec") ||
        key.startsWith("fitcheck-rec")
      )) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error("Error clearing recommendations:", error);
  }
}

export function getAllRecommendations(wardrobe: WardrobeItem[]): OutfitRecommendation[] {
  try {
    const historyJson = localStorage.getItem("fitcheck-all-recommendations");
    if (!historyJson) return [];

    const storedHistory: StoredRecommendation[] = JSON.parse(historyJson);
    const validOutfits: OutfitRecommendation[] = [];
    const validStored: StoredRecommendation[] = [];

    for (const stored of storedHistory) {
      const layer = stored.layerGarmentId 
        ? wardrobe.find(w => w.id === stored.layerGarmentId) 
        : undefined;

      // Case A: Standalone One-Piece Outfit
      if (stored.outfitType === 'one_piece' || stored.standaloneGarmentId) {
        const standaloneId = stored.standaloneGarmentId || stored.topGarmentId;
        const standalone = wardrobe.find(w => w.id === standaloneId);
        if (standalone && isOnePiece(standalone)) {
          validOutfits.push({
            id: stored.id,
            outfitType: 'one_piece',
            standaloneGarment: standalone,
            layerGarment: layer,
            colorLogic: stored.colorLogic,
            silhouetteLogic: stored.silhouetteLogic,
            occasion: stored.occasion,
            weather: stored.weather,
            createdAt: new Date(stored.createdAt)
          });
          validStored.push(stored);
          continue;
        }
      }

      // Case B: Two-Piece / Three-Piece Outfit
      const top = wardrobe.find(w => w.id === stored.topGarmentId);
      const bottom = wardrobe.find(w => w.id === stored.bottomGarmentId);

      if (top && bottom && isValidTwoPieceOutfit(top, bottom)) {
        validOutfits.push({
          id: stored.id,
          outfitType: layer ? 'three_piece' : 'two_piece',
          topGarment: top,
          bottomGarment: bottom,
          layerGarment: layer,
          colorLogic: stored.colorLogic,
          silhouetteLogic: stored.silhouetteLogic,
          occasion: stored.occasion,
          weather: stored.weather,
          createdAt: new Date(stored.createdAt)
        });
        validStored.push(stored);
      }
    }

    // Auto-prune corrupt legacy recommendations directly from localStorage
    if (validStored.length !== storedHistory.length) {
      localStorage.setItem("fitcheck-all-recommendations", JSON.stringify(validStored));
    }

    return validOutfits;
  } catch {
    return [];
  }
}

export function saveRecommendationToHistory(rec: OutfitRecommendation): void {
  try {
    const historyJson = localStorage.getItem("fitcheck-all-recommendations");
    const history: StoredRecommendation[] = historyJson ? JSON.parse(historyJson) : [];

    if (rec.outfitType === 'one_piece' && rec.standaloneGarment) {
      if (!isValidOnePieceOutfit(rec.standaloneGarment)) return;
      const exists = history.some(h => h.standaloneGarmentId === rec.standaloneGarment!.id);
      if (!exists) {
        history.push({
          id: rec.id,
          outfitType: 'one_piece',
          standaloneGarmentId: rec.standaloneGarment.id,
          layerGarmentId: rec.layerGarment?.id,
          colorLogic: rec.colorLogic,
          silhouetteLogic: rec.silhouetteLogic,
          occasion: rec.occasion,
          weather: rec.weather,
          createdAt: rec.createdAt.toISOString()
        });
        if (history.length > 50) history.shift();
        localStorage.setItem("fitcheck-all-recommendations", JSON.stringify(history));
      }
      return;
    }

    // Two-piece / Three-piece
    if (!rec.topGarment || !rec.bottomGarment || !isValidTwoPieceOutfit(rec.topGarment, rec.bottomGarment)) {
      console.warn("Rejected saving invalid outfit pair to history:", rec);
      return;
    }

    const exists = history.some(h => 
      (h.topGarmentId === rec.topGarment!.id && h.bottomGarmentId === rec.bottomGarment!.id) ||
      (h.topGarmentId === rec.bottomGarment!.id && h.bottomGarmentId === rec.topGarment!.id)
    );
    
    if (!exists) {
      const lightRec: StoredRecommendation = {
        id: rec.id,
        outfitType: rec.outfitType,
        topGarmentId: rec.topGarment.id,
        bottomGarmentId: rec.bottomGarment.id,
        layerGarmentId: rec.layerGarment?.id,
        colorLogic: rec.colorLogic,
        silhouetteLogic: rec.silhouetteLogic,
        occasion: rec.occasion,
        weather: rec.weather,
        createdAt: rec.createdAt.toISOString()
      };
      
      history.push(lightRec);
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
  const validTops = wardrobe.filter(isBaseTop);
  const validBottoms = wardrobe.filter(isBottom);
  const validOnePieces = wardrobe.filter(isOnePiece);

  if ((validTops.length === 0 || validBottoms.length === 0) && validOnePieces.length === 0) {
    console.warn("Wardrobe lacks valid garments to curate an outfit.");
    return null;
  }

  // 1. Fetch sanitized history
  const pastRecommendations = getAllRecommendations(wardrobe);
  
  // Track usage counts to guarantee high variety across days
  const topUsageCount: Record<string, number> = {};
  const bottomUsageCount: Record<string, number> = {};
  const onePieceUsageCount: Record<string, number> = {};
  const rejectedKeys = new Set<string>();

  for (const rec of pastRecommendations) {
    if (rec.outfitType === 'one_piece' && rec.standaloneGarment) {
      onePieceUsageCount[rec.standaloneGarment.id] = (onePieceUsageCount[rec.standaloneGarment.id] || 0) + 1;
      rejectedKeys.add(`standalone|${rec.standaloneGarment.id}`);
    } else if (rec.topGarment && rec.bottomGarment) {
      topUsageCount[rec.topGarment.id] = (topUsageCount[rec.topGarment.id] || 0) + 1;
      bottomUsageCount[rec.bottomGarment.id] = (bottomUsageCount[rec.bottomGarment.id] || 0) + 1;
      rejectedKeys.add(`${rec.topGarment.id}|${rec.bottomGarment.id}`);
      rejectedKeys.add(`${rec.bottomGarment.id}|${rec.topGarment.id}`);
    }
  }

  // 2. Try LLM Stylist via Groq if API keys are configured (for two-piece outfits)
  try {
    if (validTops.length > 0 && validBottoms.length > 0) {
      const rejectedList = Array.from(rejectedKeys).filter(k => !k.startsWith('standalone|'));
      const stylistChoice = await generateStylistRecommendationGroq(
        {
          tops: validTops.map(t => ({
            id: t.id,
            category: t.analysis.category,
            description: t.analysis.analyzed_garment || t.analysis.summary,
          })),
          bottoms: validBottoms.map(b => ({
            id: b.id,
            category: b.analysis.category,
            description: b.analysis.analyzed_garment || b.analysis.summary,
          })),
        },
        weather,
        rejectedList
      );

      if (stylistChoice?.top_id && stylistChoice?.bottom_id) {
        const topGarment = validTops.find(i => i.id === stylistChoice.top_id);
        const bottomGarment = validBottoms.find(i => i.id === stylistChoice.bottom_id);

        if (topGarment && bottomGarment && isValidTwoPieceOutfit(topGarment, bottomGarment)) {
          const pairKey = `${topGarment.id}|${bottomGarment.id}`;
          if (!rejectedKeys.has(pairKey)) {
            const layerGarment = findCompatibleLayer(topGarment, bottomGarment, wardrobe);
            return {
              id: `rec-${Date.now()}`,
              outfitType: layerGarment ? 'three_piece' : 'two_piece',
              topGarment,
              bottomGarment,
              layerGarment,
              colorLogic: stylistChoice.colorLogic || "Harmonious complementary color pairing.",
              silhouetteLogic: stylistChoice.silhouetteLogic || "Balanced proportions suited for daily comfort.",
              occasion: stylistChoice.occasion || "Daily Smart Wear",
              weather: weather.recommendation,
              createdAt: new Date(),
            };
          }
        }
      }
    }
  } catch {
    // Silently fall through to deterministic expert stylist
  }

  // 3. Unified Candidate Scoring & Dynamic Rotation Engine
  interface UnifiedCandidate {
    outfitType: OutfitType;
    top?: WardrobeItem;
    bottom?: WardrobeItem;
    standalone?: WardrobeItem;
    layer?: WardrobeItem;
    evalResult: OutfitSynergyResult;
    rotationScore: number;
    key: string;
  }

  const candidates: UnifiedCandidate[] = [];

  // A. Generate Two-Piece / Three-Piece Candidates
  for (const t of validTops) {
    for (const b of validBottoms) {
      const key = `${t.id}|${b.id}`;
      const evalResult = evaluateOutfitSynergy(t, b, weather);
      if (!evalResult.valid) continue;

      const tUsage = topUsageCount[t.id] || 0;
      const bUsage = bottomUsageCount[b.id] || 0;

      let rotationScore = evalResult.score - (tUsage * 3.5) - (bUsage * 1.5) + (Math.random() * 0.4);
      if (rejectedKeys.has(key)) rotationScore -= 20.0;

      const layer = findCompatibleLayer(t, b, wardrobe);

      candidates.push({
        outfitType: layer ? 'three_piece' : 'two_piece',
        top: t,
        bottom: b,
        layer,
        evalResult,
        rotationScore,
        key
      });
    }
  }

  // B. Generate Standalone One-Piece Candidates (Saree, Anarkali, Dress)
  for (const op of validOnePieces) {
    const key = `standalone|${op.id}`;
    const evalResult = evaluateOnePieceEnsemble(op, weather);
    if (!evalResult.valid) continue;

    const opUsage = onePieceUsageCount[op.id] || 0;
    // Calibrated score: slightly scale down so 2-piece outfits remain the frequent daily baseline,
    // while high-end one-piece ensembles naturally weave in for variety
    let rotationScore = (evalResult.score - 0.4) - (opUsage * 4.0) + (Math.random() * 0.4);
    if (rejectedKeys.has(key)) rotationScore -= 20.0;

    const layer = findCompatibleLayerForOnePiece(op, wardrobe);

    candidates.push({
      outfitType: 'one_piece',
      standalone: op,
      layer,
      evalResult,
      rotationScore,
      key
    });
  }

  if (candidates.length === 0) {
    console.warn("No valid candidate outfits could be formed.");
    return null;
  }

  // Sort descending by rotationScore
  candidates.sort((a, b) => b.rotationScore - a.rotationScore);

  const bestCandidate = candidates[0];

  if (bestCandidate.outfitType === 'one_piece' && bestCandidate.standalone) {
    return {
      id: `rec-${Date.now()}-standalone`,
      outfitType: 'one_piece',
      standaloneGarment: bestCandidate.standalone,
      layerGarment: bestCandidate.layer,
      colorLogic: bestCandidate.evalResult.colorLogic || "Luminous monochrome flow in a complete standalone ensemble.",
      silhouetteLogic: bestCandidate.evalResult.silhouetteLogic || "Self-contained graceful drape with balanced vertical lines.",
      occasion: bestCandidate.evalResult.occasion || "Special Occasion & Daily Elegance",
      weather: weather.recommendation,
      createdAt: new Date(),
    };
  }

  let modelRationale = bestCandidate.evalResult.colorLogic;
  if (bestCandidate.top && bestCandidate.bottom) {
    const comp = await evaluateCompatibility(
      bestCandidate.top.analysis.analyzed_garment || bestCandidate.top.analysis.summary,
      bestCandidate.bottom.analysis.analyzed_garment || bestCandidate.bottom.analysis.summary
    );
    if (comp?.rationale) {
      modelRationale = comp.rationale;
    }
  }

  return {
    id: `rec-${Date.now()}-match`,
    outfitType: bestCandidate.outfitType,
    topGarment: bestCandidate.top!,
    bottomGarment: bestCandidate.bottom!,
    layerGarment: bestCandidate.layer,
    colorLogic: modelRationale || "Balanced visual dialogue between upper and lower silhouettes.",
    silhouetteLogic: bestCandidate.evalResult.silhouetteLogic || "Graceful proportion and balanced drape for daily comfort.",
    occasion: bestCandidate.evalResult.occasion || "Everyday Smart Casual",
    weather: weather.recommendation,
    createdAt: new Date(),
  };
}
