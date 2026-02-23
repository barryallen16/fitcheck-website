import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

import { Header } from '@/sections/Header';
import { WardrobeUpload } from '@/sections/WardrobeUpload';
import { WardrobeGallery } from '@/sections/WardrobeGallery';
import { DailyRecommendation } from '@/sections/DailyRecommendation';
import { LMStudioStatus } from '@/sections/LMStudioStatus';

import type { WardrobeItem, WeatherData } from '@/types';
import { getWardrobe, autoImportFromScript } from '@/services/storageService';
import { getChennaiWeather } from '@/services/weatherService';
import { checkLMStudioHealth } from '@/services/lmStudioService';

function App() {
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLMStudioReady, setIsLMStudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // 1. Auto-import new items from the python script first!
      await autoImportFromScript();
      
      // 2. Load wardrobe from IndexedDB
      const savedWardrobe = await getWardrobe();
      setWardrobe(savedWardrobe);
      
      // 3. Load weather
      try {
        const weatherData = await getChennaiWeather();
        setWeather(weatherData);
      } catch (error) {
        console.error('Failed to load weather:', error);
      }
      
      // 4. Check LM Studio
      const lmReady = await checkLMStudioHealth();
      setIsLMStudioReady(lmReady);
      
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Refresh wardrobe
  const refreshWardrobe = useCallback(async () => {
    const savedWardrobe = await getWardrobe();
    setWardrobe(savedWardrobe);
  }, []);

  // Handle upload complete
  const handleUploadComplete = useCallback((item: WardrobeItem) => {
    refreshWardrobe();
    toast.success('Garment added to wardrobe!', {
      description: `Added: ${item.analysis.analyzed_garment.substring(0, 50)}...`,
    });
  }, [refreshWardrobe]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
          <p className="text-muted-foreground">Loading FitCheck...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      <Header 
        weather={weather ? {
          temperature: weather.temperature,
          condition: weather.condition,
          location: weather.location,
        } : null}
        wardrobeCount={wardrobe.length}
      />

      <main className="container py-6">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <LMStudioStatus />
          {weather && (
            <p className="text-sm text-muted-foreground">
              {weather.recommendation}
            </p>
          )}
        </div>

        <Tabs defaultValue="recommendation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recommendation">Daily Outfit</TabsTrigger>
            <TabsTrigger value="wardrobe">My Wardrobe</TabsTrigger>
          </TabsList>

          {/* Daily Recommendation Tab */}
          <TabsContent value="recommendation" className="space-y-6">
            <DailyRecommendation wardrobe={wardrobe} weather={weather} />
          </TabsContent>

          {/* Wardrobe Tab */}
          <TabsContent value="wardrobe" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <WardrobeUpload 
                  onUploadComplete={handleUploadComplete}
                  isLMStudioReady={isLMStudioReady}
                />
              </div>
              <div className="lg:col-span-2">
                <WardrobeGallery 
                  items={wardrobe} 
                  onItemsChange={refreshWardrobe}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;