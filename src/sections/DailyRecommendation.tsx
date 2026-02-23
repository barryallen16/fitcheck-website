import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Calendar, ThermometerSun, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { WardrobeItem, OutfitRecommendation, WeatherData } from '@/types';
import { generateDailyRecommendation, saveRecommendationToHistory, getAllRecommendations } from '@/services/recommendationService';

interface DailyRecommendationProps {
  wardrobe: WardrobeItem[];
  weather: WeatherData | null;
}

export function DailyRecommendation({ wardrobe, weather }: DailyRecommendationProps) {
  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(null);
  const [history, setHistory] = useState<OutfitRecommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load today's recommendation and history on mount
  useEffect(() => {
    if (wardrobe.length > 0) {
      const loadedHistory = getAllRecommendations(wardrobe);
      setHistory(loadedHistory);

      const today = new Date().toDateString();
      const savedId = localStorage.getItem(`fitcheck-today-id-${today}`);
      
      if (savedId) {
        const found = loadedHistory.find(h => h.id === savedId);
        if (found) {
          setRecommendation(found);
        }
      }
    }
  }, [wardrobe]);

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
        recommendation: 'Light cotton fabrics recommended',
      });

      if (rec) {
        setRecommendation(rec);
        
        saveRecommendationToHistory(rec);
        
        const today = new Date().toDateString();
        localStorage.setItem(`fitcheck-today-id-${today}`, rec.id);

        // Instantly refresh history state so the UI updates
        setHistory(getAllRecommendations(wardrobe));
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

  // Exclude current outfit from history and reverse to show newest first
  const displayHistory = history.filter(h => h.id !== recommendation?.id).reverse();

  return (
    <div className="space-y-8">
      <Card className="border-2 border-rose-100 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Sparkles className="h-5 w-5 text-rose-500" />
              Today's Outfit
            </CardTitle>
            <Badge variant="outline" className="gap-1 hidden sm:flex">
              <Calendar className="h-3 w-3" />
              {today}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {!recommendation ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-rose-50 inline-flex mb-4">
                <Sparkles className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Get Your Daily Recommendation</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Our AI will analyze your wardrobe and suggest the perfect outfit for today based on the weather and your style.
              </p>
              <Button
                onClick={generateRecommendation}
                disabled={isGenerating || wardrobe.length < 2}
                className="bg-gradient-to-r from-rose-500 to-orange-500 text-white w-full sm:w-auto px-8"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Outfit
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* RESPONSIVE OUTFIT DISPLAY: 1 col (Top stacked over Bottom) on mobile, 2 cols on medium screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 order-1">
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200">Top</Badge>
                  <img
                    src={recommendation.topGarment.imageUrl}
                    alt={recommendation.topGarment.analysis.summary || recommendation.topGarment.analysis.analyzed_garment}
                    className="w-full  sm:h-64 object-contain rounded-lg bg-muted border border-border/50"
                  />
                  <p className="text-sm font-medium text-foreground">
                    {recommendation.topGarment.analysis.summary}
                  </p>
                </div>
                
                <div className="space-y-2 order-2">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Bottom</Badge>
                  <img
                    src={recommendation.bottomGarment.imageUrl}
                    alt={recommendation.bottomGarment.analysis.summary || recommendation.bottomGarment.analysis.analyzed_garment}
                    className="w-full  sm:h-64 object-contain rounded-lg bg-muted border border-border/50"
                  />
                  <p className="text-sm font-medium text-foreground">
                    {recommendation.bottomGarment.analysis.summary}
                  </p>
                </div>
              </div>

              {/* Recommendation Logic */}
              <div className="space-y-3 bg-muted/50 p-4 rounded-xl border border-border/50">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Color Coordination
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {recommendation.colorLogic}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    Silhouette Harmony
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {recommendation.silhouetteLogic}
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <ThermometerSun className="h-4 w-4 text-orange-500" />
                      Weather Context
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {recommendation.weather}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <h4 className="text-sm font-semibold text-foreground mb-1">Perfect For</h4>
                    <Badge variant="secondary" className="bg-background text-wrap">
                      {recommendation.occasion}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <Button
                  onClick={generateRecommendation}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full h-12 text-base"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Styling New Outfit...' : 'New Suggestion'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* HISTORY SECTION */}
      {displayHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              History
            </h3>
            <span className="text-xs text-muted-foreground">{displayHistory.length} Outfits</span>
          </div>
          
          {/* HISTORY GRID: 1 col on mobile, 2 on tablet, 3 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayHistory.map((item, index) => (
              <Card key={item.id} className="overflow-hidden border-border/50 shadow-sm flex flex-col group hover:border-rose-200 transition-colors">
                
                {/* Header Strip */}
                <div className="bg-muted px-3 py-2 flex justify-between items-center border-b">
                  <span className="text-xs font-bold text-foreground">
                    Outfit #{displayHistory.length - index}
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item.occasion}
                  </Badge>
                </div>
                
                {/* Dual Image Display */}
                <div className="grid grid-cols-2 gap-px bg-muted flex-1">
                  <div className="relative aspect-square bg-background">
                    <div className="absolute top-1 left-1 z-10">
                      <Badge className="text-[9px] py-0 px-1 bg-white/80 text-black shadow-sm pointer-events-none backdrop-blur-sm">TOP</Badge>
                    </div>
                    <img 
                      src={item.topGarment.imageUrl} 
                      className="w-full h-full object-cover" 
                      alt="Top"
                    />
                  </div>
                  <div className="relative aspect-square bg-background">
                    <div className="absolute top-1 left-1 z-10">
                      <Badge className="text-[9px] py-0 px-1 bg-white/80 text-black shadow-sm pointer-events-none backdrop-blur-sm">BTM</Badge>
                    </div>
                    <img 
                      src={item.bottomGarment.imageUrl} 
                      className="w-full h-full object-cover" 
                      alt="Bottom"
                    />
                  </div>
                </div>
                
                {/* Mini Description */}
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.colorLogic}
                  </p>
                </CardContent>

              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}