import { useState, useEffect } from 'react';
import type { Garment, Recommendation } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  RefreshCw, 
  Heart, 
  Share2, 
  Shirt,
  ArrowRight,
  Palette,
  Ruler,
  Calendar
} from 'lucide-react';
import { useLMStudio } from '@/hooks/useLMStudio';
import { useWeather } from '@/hooks/useWeather';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DailyRecommendationProps {
  garments: Garment[];
}

export function DailyRecommendation({ garments }: DailyRecommendationProps) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [liked, setLiked] = useState(false);
  
  const { generateRecommendation, isLoading } = useLMStudio();
  const { weather } = useWeather();

  const generateDailyRecommendation = async () => {
    if (garments.length === 0) return;
    
    setIsGenerating(true);
    setLiked(false);
    
    try {
      // Select a random garment as the base
      const baseGarment = garments[Math.floor(Math.random() * garments.length)];
      
      // Generate recommendation
      const result = await generateRecommendation(baseGarment.caption);
      
      if (result) {
        // Find matching garments for the recommendation
        const recommendedBottom = garments.find(g => 
          g.attributes.specific_type.toLowerCase().includes(
            result.recommended_item.toLowerCase().split(' ')[0]
          ) && g.id !== baseGarment.id
        );

        const newRecommendation: Recommendation = {
          id: `rec_${Date.now()}`,
          inputGarment: baseGarment,
          recommendedBottom,
          colorLogic: result.color_logic,
          silhouetteLogic: result.silhouette_logic,
          direction: 'TOP_TO_BOTTOM',
          occasion: result.occasion,
          weather: weather?.condition || 'Any',
          createdAt: new Date(),
        };

        setRecommendation(newRecommendation);
      }
    } catch (error) {
      console.error('Failed to generate recommendation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate initial recommendation
  useEffect(() => {
    if (garments.length > 0 && !recommendation) {
      generateDailyRecommendation();
    }
  }, [garments]);

  const isLoadingState = isGenerating || isLoading;

  if (garments.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
            <Shirt className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Garments Yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload some garments to your wardrobe to get personalized recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Today's Pick
          </h2>
          <p className="text-sm text-muted-foreground">
            Curated outfit recommendation for {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateDailyRecommendation}
          disabled={isLoadingState}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingState ? 'animate-spin' : ''}`} />
          New Pick
        </Button>
      </div>

      {isLoadingState ? (
        <Card className="w-full">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full animate-pulse">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium">AI is curating your outfit...</p>
              <p className="text-sm text-muted-foreground">
                Analyzing colors, silhouettes, and weather conditions
              </p>
            </div>
          </CardContent>
        </Card>
      ) : recommendation ? (
        <Card className="w-full overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Base Garment */}
            <div className="relative">
              <div className="aspect-square bg-muted">
                <img
                  src={recommendation.inputGarment.imageUrl}
                  alt={recommendation.inputGarment.attributes.specific_type}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/90 text-black">
                  Base Piece
                </Badge>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white font-medium">
                  {recommendation.inputGarment.attributes.specific_type}
                </p>
                <p className="text-white/70 text-sm">
                  {recommendation.inputGarment.attributes.color_primary} • {recommendation.inputGarment.attributes.style}
                </p>
              </div>
            </div>

            {/* Recommendation Details */}
            <div className="p-6 flex flex-col">
              <div className="flex-1">
                <Badge variant="secondary" className="mb-3">
                  {recommendation.occasion}
                </Badge>
                
                <h3 className="text-xl font-semibold mb-2">
                  Recommended Pairing
                </h3>
                
                <p className="text-lg text-muted-foreground mb-4">
                  {recommendation.recommendedBottom 
                    ? recommendation.recommendedBottom.attributes.specific_type
                    : recommendation.inputGarment.attributes.category === 'Indian ethnic'
                      ? 'Silk Sharara or Palazzo'
                      : 'Tailored Trousers or Jeans'
                  }
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Palette className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Color Harmony</p>
                      <p className="text-sm text-muted-foreground">
                        {recommendation.colorLogic}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <Ruler className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Silhouette Match</p>
                      <p className="text-sm text-muted-foreground">
                        {recommendation.silhouetteLogic}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-auto">
                <Button 
                  variant={liked ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setLiked(!liked)}
                >
                  <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                  {liked ? 'Liked' : 'Like'}
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowDetails(true)}
                >
                  Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Outfit Details</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {recommendation && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Base Garment</p>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={recommendation.inputGarment.imageUrl}
                        alt={recommendation.inputGarment.attributes.specific_type}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="mt-2 font-medium">
                      {recommendation.inputGarment.attributes.specific_type}
                    </p>
                  </div>
                  
                  {recommendation.recommendedBottom && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recommended With</p>
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={recommendation.recommendedBottom.imageUrl}
                          alt={recommendation.recommendedBottom.attributes.specific_type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="mt-2 font-medium">
                        {recommendation.recommendedBottom.attributes.specific_type}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Palette className="w-4 h-4" />
                      Color Theory
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {recommendation.colorLogic}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Ruler className="w-4 h-4" />
                      Silhouette Analysis
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {recommendation.silhouetteLogic}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4" />
                      Occasion
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Perfect for: {recommendation.occasion}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
