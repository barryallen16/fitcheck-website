import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Calendar, ThermometerSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import type { WardrobeItem, OutfitRecommendation, WeatherData } from "@/types";
import {
  generateDailyRecommendation,
  saveRecommendationToHistory,
  getAllRecommendations,
} from "@/services/recommendationService";
interface DailyRecommendationProps {
  wardrobe: WardrobeItem[];
  weather: WeatherData | null;
}

export function DailyRecommendation({
  wardrobe,
  weather,
}: DailyRecommendationProps) {
  const [recommendation, setRecommendation] =
    useState<OutfitRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toDateString();
    const savedId = localStorage.getItem(`fitcheck-today-id-${today}`);

    // We pass wardrobe so it can rebuild the objects
    if (savedId && wardrobe.length > 0) {
      const history = getAllRecommendations(wardrobe);
      const found = history.find((h) => h.id === savedId);
      if (found) {
        setRecommendation(found);
      }
    }
  }, [wardrobe]);

  const generateRecommendation = async () => {
    if (wardrobe.length < 2) {
      setError("Add at least 2 garments to get recommendations");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const rec = await generateDailyRecommendation(
        wardrobe,
        weather || {
          location: "Chennai",
          temperature: 32,
          condition: "Sunny",
          humidity: 75,
          recommendation: "Light cotton fabrics recommended",
        },
      );

      if (rec) {
        setRecommendation(rec);

        // Save to lightweight global history
        saveRecommendationToHistory(rec);

        // Save just the ID for today
        const today = new Date().toDateString();
        localStorage.setItem(`fitcheck-today-id-${today}`, rec.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate recommendation",
      );
    } finally {
      setIsGenerating(false);
    }
  };
  
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Card className="border-2 border-rose-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-500" />
            Today's Outfit
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            <Calendar className="h-3 w-3" />
            {today}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!recommendation ? (
          <div className="text-center py-8">
            <div className="p-4 rounded-full bg-rose-50 inline-flex mb-4">
              <Sparkles className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Get Your Daily Recommendation
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Our AI will analyze your wardrobe and suggest the perfect outfit
              for today based on the weather and your style
            </p>
            <Button
              onClick={generateRecommendation}
              disabled={isGenerating || wardrobe.length < 2}
              className="bg-gradient-to-r from-rose-500 to-orange-500"
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
            {/* Outfit Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Badge className="bg-rose-100 text-rose-700">Top</Badge>
                <img
                  src={recommendation.topGarment.imageUrl}
                  alt={recommendation.topGarment.analysis.analyzed_garment}
                  className="w-full h-48 object-contain rounded-lg bg-muted"
                />
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {recommendation.topGarment.analysis.analyzed_garment}
                </p>
              </div>

              <div className="space-y-2">
                <Badge className="bg-blue-100 text-blue-700">Bottom</Badge>
                <img
                  src={recommendation.bottomGarment.imageUrl}
                  alt={recommendation.bottomGarment.analysis.analyzed_garment}
                  className="w-full h-48 object-contain rounded-lg bg-muted"
                />
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {recommendation.bottomGarment.analysis.analyzed_garment}
                </p>
              </div>
            </div>

            {/* Recommendation Logic */}
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Color Coordination
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {recommendation.colorLogic}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Silhouette Harmony
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {recommendation.silhouetteLogic}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <ThermometerSun className="h-4 w-4 text-orange-500" />
                  Weather Consideration
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {recommendation.weather}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium">Perfect For</h4>
                <Badge variant="secondary" className="mt-1">
                  {recommendation.occasion}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={generateRecommendation}
                disabled={isGenerating}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`}
                />
                New Suggestion
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
