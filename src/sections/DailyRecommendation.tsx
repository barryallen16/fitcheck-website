import { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/icons/PixelIcons';
import type { WardrobeItem, OutfitRecommendation, WeatherData } from '@/types';
import { 
  generateDailyRecommendation, 
  saveRecommendationToHistory, 
  getAllRecommendations,
  clearAllRecommendations,
  BASE_TOP_CATEGORIES,
  BOTTOM_CATEGORIES,
} from '@/services/recommendationService';
import { toast } from 'sonner';

interface DailyRecommendationProps {
  wardrobe: WardrobeItem[];
  weather: WeatherData | null;
  onStyleOutfitInStudio?: (top?: WardrobeItem, bottom?: WardrobeItem, layer?: WardrobeItem, onePiece?: WardrobeItem) => void;
}

export function DailyRecommendation({ wardrobe, weather, onStyleOutfitInStudio }: DailyRecommendationProps) {
  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(null);
  const [history, setHistory] = useState<OutfitRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWornToday, setIsWornToday] = useState(false);
  const [targetOccasion, setTargetOccasion] = useState<string>('All Occasions');

  const todayDateStr = new Date().toDateString();

  // Load today's recommendation and history on mount
  useEffect(() => {
    if (wardrobe.length > 0) {
      const loadedHistory = getAllRecommendations(wardrobe);
      setHistory(loadedHistory);

      const savedId = localStorage.getItem(`fitcheck-today-id-${todayDateStr}`);
      const wornStatus = localStorage.getItem(`fitcheck-today-worn-${todayDateStr}`) === 'true';
      setIsWornToday(wornStatus);
      
      if (savedId) {
        const found = loadedHistory.find(h => h.id === savedId);
        if (found) {
          setRecommendation(found);
        } else {
          localStorage.removeItem(`fitcheck-today-id-${todayDateStr}`);
          setRecommendation(null);
        }
      }
    }
  }, [wardrobe, todayDateStr]);

  const handleClearHistory = () => {
    clearAllRecommendations();
    setHistory([]);
    setRecommendation(null);
    setIsWornToday(false);
    toast.success('Recommendation history cleared');
  };

  const handleToggleWorn = () => {
    const nextState = !isWornToday;
    setIsWornToday(nextState);
    localStorage.setItem(`fitcheck-today-worn-${todayDateStr}`, String(nextState));
    if (nextState) {
      toast.success('Marked as worn today', {
        description: 'Saved to your wear log for today.',
      });
    } else {
      toast.info('Marked as unworn for today');
    }
  };

  const handleCopyStylistNotes = () => {
    if (!recommendation) return;
    const pieces = [
      recommendation.standaloneGarment ? `Standalone: ${recommendation.standaloneGarment.analysis.summary}` : null,
      recommendation.topGarment ? `Top: ${recommendation.topGarment.analysis.summary}` : null,
      recommendation.bottomGarment ? `Bottom: ${recommendation.bottomGarment.analysis.summary}` : null,
      recommendation.layerGarment ? `Layer: ${recommendation.layerGarment.analysis.summary}` : null,
    ].filter(Boolean).join('\n');

    const text = `FITCHECK OUTFIT - ${recommendation.occasion}\n${pieces}\n\nColor: ${recommendation.colorLogic}\nSilhouette: ${recommendation.silhouetteLogic}`;
    navigator.clipboard.writeText(text);
    toast.success('Stylist notes copied to clipboard!');
  };

  const handleShuffleTop = () => {
    if (!recommendation?.bottomGarment) return;
    const currentTopId = recommendation.topGarment?.id;
    const otherTops = wardrobe.filter(w => BASE_TOP_CATEGORIES.has(w.analysis.category) && w.id !== currentTopId);
    if (otherTops.length === 0) {
      toast.info('No other top garments available in wardrobe.');
      return;
    }
    const nextTop = otherTops[Math.floor(Math.random() * otherTops.length)];
    const updated: OutfitRecommendation = {
      ...recommendation,
      topGarment: nextTop,
      colorLogic: `Refreshed dialogue pairing ${nextTop.analysis.summary} with ${recommendation.bottomGarment.analysis.summary}.`,
    };
    setRecommendation(updated);
    saveRecommendationToHistory(updated);
    toast.success(`Swapped top to: ${nextTop.analysis.summary}`);
  };

  const handleShuffleBottom = () => {
    if (!recommendation?.topGarment) return;
    const currentBottomId = recommendation.bottomGarment?.id;
    const otherBottoms = wardrobe.filter(w => BOTTOM_CATEGORIES.has(w.analysis.category) && w.id !== currentBottomId);
    if (otherBottoms.length === 0) {
      toast.info('No other bottom garments available in wardrobe.');
      return;
    }
    const nextBottom = otherBottoms[Math.floor(Math.random() * otherBottoms.length)];
    const updated: OutfitRecommendation = {
      ...recommendation,
      bottomGarment: nextBottom,
      colorLogic: `Refreshed dialogue pairing ${recommendation.topGarment.analysis.summary} with ${nextBottom.analysis.summary}.`,
    };
    setRecommendation(updated);
    saveRecommendationToHistory(updated);
    toast.success(`Swapped bottom to: ${nextBottom.analysis.summary}`);
  };

  const generateRecommendation = async () => {
    if (wardrobe.length < 2) {
      setError('Add at least 2 garments to get recommendations');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const rec = await generateDailyRecommendation(wardrobe, weather || {
        location: 'Chennai',
        temperature: 32,
        condition: 'Sunny',
        humidity: 75,
        recommendation: 'Light breathable fabrics recommended',
      });

      if (rec) {
        setRecommendation(rec);
        saveRecommendationToHistory(rec);
        localStorage.setItem(`fitcheck-today-id-${todayDateStr}`, rec.id);
        setHistory(getAllRecommendations(wardrobe));
        toast.success('Curated your daily outfit suggestion!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendation');
    } finally {
      setIsGenerating(false);
    }
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const displayHistory = history.filter(h => h.id !== recommendation?.id).reverse();

  return (
    <div className="space-y-8">
      {/* Main Recommendation Box */}
      <div className="border-2 border-white bg-[#09318D] p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/20 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <PixelIcon name="sparkles" size={18} className="text-[#fd91cc]" />
            <h2 className="font-pixel text-sm sm:text-base text-white">TODAY'S OUTFIT</h2>
            {recommendation && (
              <span className="font-pixel text-[10px] bg-[#fd91cc] text-[#09318D] px-2 py-0.5 ml-2 uppercase">
                {recommendation.outfitType === 'one_piece' ? '1-Piece Ensemble' : (recommendation.outfitType === 'three_piece' ? '3-Piece Layered' : '2-Piece Classic')}
              </span>
            )}
            {isWornToday && (
              <span className="font-pixel text-[10px] bg-green-500 text-black px-2 py-0.5 uppercase flex items-center gap-1">
                <PixelIcon name="check" size={12} />
                <span>WORN TODAY</span>
              </span>
            )}
          </div>
          <div className="font-pixel text-xs text-white/80 border border-white/30 px-2 py-1 hidden sm:block">
            {today}
          </div>
        </div>

        {error && (
          <div className="border border-[#fd91cc] p-3 text-xs text-[#fd91cc] bg-[#fd91cc]/10">
            {error}
          </div>
        )}

        {!recommendation ? (
          <div className="text-center py-12 border border-dashed border-white/30 p-8 space-y-6">
            <div className="w-12 h-12 border border-white/40 flex items-center justify-center mx-auto text-[#fd91cc]">
              <PixelIcon name="sparkles" size={24} />
            </div>
            <div>
              <h3 className="font-pixel text-sm text-white mb-2">RUN STYLIST INFERENCE</h3>
              <p className="text-xs text-white/80 max-w-md mx-auto">
                Evaluate wardrobe items and curate balanced color harmony, silhouette contrast, and cultural alignment.
              </p>
            </div>

            {/* Occasion Filter Buttons */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {['All Occasions', 'Formal Office', 'Festive Soirée', 'Casual Daily'].map((occ) => (
                <button
                  key={occ}
                  onClick={() => setTargetOccasion(occ)}
                  className={`px-3 py-1 text-[11px] font-pixel transition-colors ${
                    targetOccasion === occ
                      ? 'bg-[#fd91cc] text-[#09318D]'
                      : 'border border-white/30 text-white/80 hover:border-white'
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>

            <button
              data-testid="generate-outfit-btn"
              onClick={generateRecommendation}
              disabled={isGenerating || wardrobe.length < 2}
              className="w-full sm:w-auto px-8 py-4 font-pixel text-xs sm:text-sm tracking-wider bg-[#fd91cc] hover:bg-white text-[#09318D] font-bold border-2 border-white transition-all active:scale-[0.98] shadow-lg shadow-[#fd91cc]/25 flex items-center justify-center gap-2.5 mx-auto cursor-pointer"
            >
              <PixelIcon name="sparkles" size={16} />
              <span>{isGenerating ? 'ANALYZING WARDROBE ROTATION...' : 'CURATE TODAY\'S OUTFIT WITH AI'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Outfits Display */}
            {recommendation.outfitType === 'one_piece' && recommendation.standaloneGarment ? (
              <div className={`grid grid-cols-1 ${recommendation.layerGarment ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-6`}>
                {/* Standalone Card */}
                <div className="border border-white/20 p-4 space-y-3 bg-[#09318D]">
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                      <PixelIcon name="sparkles" size={14} />
                      <span>STANDALONE ENSEMBLE</span>
                    </span>
                    <span className="text-[10px] text-white/70 font-mono">
                      {recommendation.standaloneGarment.analysis.category}
                    </span>
                  </div>
                  <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 border border-white/10">
                    <img
                      src={recommendation.standaloneGarment.imageUrl}
                      alt={recommendation.standaloneGarment.analysis.summary}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <p className="font-pixel text-xs text-white truncate">
                    {recommendation.standaloneGarment.analysis.summary}
                  </p>
                </div>

                {recommendation.layerGarment && (
                  <div className="border border-white/20 p-4 space-y-3 bg-[#09318D]">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                        <PixelIcon name="sparkles" size={14} />
                        <span>RECOMMENDED LAYER</span>
                      </span>
                      <span className="text-[10px] text-white/70 font-mono">
                        {recommendation.layerGarment.analysis.category}
                      </span>
                    </div>
                    <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 border border-white/10">
                      <img
                        src={recommendation.layerGarment.imageUrl}
                        alt={recommendation.layerGarment.analysis.summary}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <p className="font-pixel text-xs text-white truncate">
                      {recommendation.layerGarment.analysis.summary}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`grid grid-cols-1 ${recommendation.layerGarment ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                {/* Upper Garment */}
                {recommendation.topGarment && (
                  <div className="border border-white/20 p-4 space-y-3 bg-[#09318D]">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                        <PixelIcon name="shirt" size={14} />
                        <span>UPPER GARMENT</span>
                      </span>
                      <button
                        onClick={handleShuffleTop}
                        className="text-[10px] border border-white/30 text-white/80 hover:border-[#fd91cc] hover:text-[#fd91cc] px-1.5 py-0.5 font-pixel flex items-center gap-1 transition-colors"
                        title="Swap for another top in wardrobe"
                      >
                        <PixelIcon name="redo" size={10} />
                        <span>SWAP</span>
                      </button>
                    </div>
                    <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 border border-white/10">
                      <img
                        src={recommendation.topGarment.imageUrl}
                        alt={recommendation.topGarment.analysis.summary}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <p className="font-pixel text-xs text-white truncate">
                      {recommendation.topGarment.analysis.summary}
                    </p>
                  </div>
                )}

                {/* Lower Garment */}
                {recommendation.bottomGarment && (
                  <div className="border border-white/20 p-4 space-y-3 bg-[#09318D]">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                        <PixelIcon name="jeans" size={14} />
                        <span>LOWER GARMENT</span>
                      </span>
                      <button
                        onClick={handleShuffleBottom}
                        className="text-[10px] border border-white/30 text-white/80 hover:border-[#fd91cc] hover:text-[#fd91cc] px-1.5 py-0.5 font-pixel flex items-center gap-1 transition-colors"
                        title="Swap for another bottom in wardrobe"
                      >
                        <PixelIcon name="redo" size={10} />
                        <span>SWAP</span>
                      </button>
                    </div>
                    <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 border border-white/10">
                      <img
                        src={recommendation.bottomGarment.imageUrl}
                        alt={recommendation.bottomGarment.analysis.summary}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <p className="font-pixel text-xs text-white truncate">
                      {recommendation.bottomGarment.analysis.summary}
                    </p>
                  </div>
                )}

                {/* Layer Garment */}
                {recommendation.layerGarment && (
                  <div className="border border-white/20 p-4 space-y-3 bg-[#09318D]">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                        <PixelIcon name="sparkles" size={14} />
                        <span>RECOMMENDED LAYER</span>
                      </span>
                      <span className="text-[10px] text-white/70 font-mono">
                        {recommendation.layerGarment.analysis.category}
                      </span>
                    </div>
                    <div className="aspect-[4/3] w-full overflow-hidden bg-black/20 border border-white/10">
                      <img
                        src={recommendation.layerGarment.imageUrl}
                        alt={recommendation.layerGarment.analysis.summary}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <p className="font-pixel text-xs text-white truncate">
                      {recommendation.layerGarment.analysis.summary}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Stylist Breakdown */}
            <div className="border border-white/20 p-5 space-y-4 bg-white/5">
              <div className="space-y-1">
                <div className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                  <PixelIcon name="eye" size={14} />
                  <span>COLOR COORDINATION</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  {recommendation.colorLogic}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-1">
                <div className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                  <PixelIcon name="sparkles" size={14} />
                  <span>SILHOUETTE HARMONY</span>
                </div>
                <p className="text-xs text-white/90 leading-relaxed">
                  {recommendation.silhouetteLogic}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <div className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                    <PixelIcon name="sun" size={14} />
                    <span>WEATHER CONTEXT</span>
                  </div>
                  <p className="text-xs text-white/80 mt-1">
                    {recommendation.weather}
                  </p>
                </div>
                <div className="sm:text-right">
                  <div className="font-pixel text-[11px] text-white/70">RECOMMENDED SETTING</div>
                  <div className="font-pixel text-xs text-[#fd91cc] mt-1">
                    {recommendation.occasion}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Action Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Wear Today Toggle */}
              <button
                onClick={handleToggleWorn}
                className={`p-3 font-pixel text-xs tracking-wider flex items-center justify-center gap-2 transition-colors border ${
                  isWornToday
                    ? 'bg-green-500 text-black border-green-400 font-bold'
                    : 'border-white/40 hover:border-green-400 hover:text-green-400 text-white'
                }`}
              >
                <PixelIcon name="check" size={16} />
                <span>{isWornToday ? 'WORN TODAY (LOGGED)' : 'MARK AS WORN TODAY'}</span>
              </button>

              {/* Style in Studio */}
              {onStyleOutfitInStudio && (
                <button
                  onClick={() => onStyleOutfitInStudio(
                    recommendation.topGarment,
                    recommendation.bottomGarment,
                    recommendation.layerGarment,
                    recommendation.standaloneGarment
                  )}
                  className="border border-white/40 hover:border-[#fd91cc] hover:text-[#fd91cc] p-3 font-pixel text-xs tracking-wider flex items-center justify-center gap-2 transition-colors text-white"
                >
                  <PixelIcon name="zap" size={16} />
                  <span>STYLE IN STUDIO</span>
                </button>
              )}

              {/* Copy Notes */}
              <button
                onClick={handleCopyStylistNotes}
                className="border border-white/40 hover:border-white p-3 font-pixel text-xs tracking-wider flex items-center justify-center gap-2 transition-colors text-white/80"
              >
                <PixelIcon name="sliders" size={16} />
                <span>COPY NOTES</span>
              </button>
            </div>

            {/* Re-generate Action */}
            <button
              data-testid="generate-outfit-btn"
              onClick={generateRecommendation}
              disabled={isGenerating}
              className="w-full bg-[#fd91cc] text-[#09318D] hover:bg-white p-3 font-pixel text-xs tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <PixelIcon name="redo" size={16} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'STYLING NEW ENSEMBLE...' : 'GENERATE NEXT SUGGESTION'}</span>
            </button>
          </div>
        )}
      </div>

      {/* History Grid */}
      {displayHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/20">
            <span className="font-pixel text-xs text-[#fd91cc] flex items-center gap-2">
              <PixelIcon name="grid" size={16} />
              <span>PREVIOUS STYLES</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-white/70">{displayHistory.length} OUTFITS</span>
              <button
                onClick={handleClearHistory}
                className="font-pixel text-[11px] border border-white/30 text-white/80 hover:border-[#fd91cc] hover:text-[#fd91cc] px-2 py-0.5 transition-colors flex items-center gap-1"
                title="Wipe previous suggestions"
              >
                <PixelIcon name="close" size={12} />
                <span>CLEAR HISTORY</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayHistory.map((item) => (
              <div 
                key={item.id} 
                className="border border-white/20 hover:border-[#fd91cc] p-3 space-y-3 bg-[#09318D] transition-colors"
              >
                <div className="flex justify-between items-center text-[10px] font-pixel text-white/80 pb-2 border-b border-white/10">
                  <span>{item.occasion}</span>
                  <span className="text-white/50">{item.createdAt.toLocaleDateString()}</span>
                </div>

                {/* Outfit Visual Preview */}
                <div className="grid grid-cols-2 gap-2">
                  {item.standaloneGarment ? (
                    <div className="col-span-2 aspect-[16/9] bg-black/20 border border-white/10 overflow-hidden">
                      <img
                        src={item.standaloneGarment.imageUrl}
                        alt="Standalone"
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  ) : (
                    <>
                      {item.topGarment && (
                        <div className="aspect-square bg-black/20 border border-white/10 overflow-hidden">
                          <img
                            src={item.topGarment.imageUrl}
                            alt="Top"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      )}
                      {item.bottomGarment && (
                        <div className="aspect-square bg-black/20 border border-white/10 overflow-hidden">
                          <img
                            src={item.bottomGarment.imageUrl}
                            alt="Bottom"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-white/70 truncate flex-1 pr-2">
                    {item.topGarment?.analysis.summary || item.standaloneGarment?.analysis.summary}
                  </span>
                  {onStyleOutfitInStudio && (
                    <button
                      onClick={() => onStyleOutfitInStudio(item.topGarment, item.bottomGarment, item.layerGarment, item.standaloneGarment)}
                      className="border border-white/30 hover:border-[#fd91cc] hover:text-[#fd91cc] text-[10px] font-pixel px-2 py-0.5 text-white/80 transition-colors"
                    >
                      LOAD
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
