import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

import { Header } from '@/sections/Header';
import { LandingHero } from '@/sections/LandingHero';
import { HowItWorks } from '@/sections/HowItWorks';
import { BentoFeatures } from '@/sections/BentoFeatures';
import { DownloadSection } from '@/sections/DownloadSection';
import { BrowserDemo } from '@/sections/BrowserDemo';
import { WardrobeUpload } from '@/sections/WardrobeUpload';
import { WardrobeGallery } from '@/sections/WardrobeGallery';
import { DailyRecommendation } from '@/sections/DailyRecommendation';
import { LMStudioStatus } from '@/sections/LMStudioStatus';
import { PixelIcon } from '@/components/icons/PixelIcons';

import type { WardrobeItem, WeatherData } from '@/types';
import type { DemoGarment, GarmentGroup } from '@/data/demoData';
import { getWardrobe, autoImportFromScript } from '@/services/storageService';
import { getChennaiWeather } from '@/services/weatherService';
import { checkLMStudioHealth } from '@/services/lmStudioService';
import { 
  BOTTOM_CATEGORIES, 
  LAYER_CATEGORIES, 
  ONE_PIECE_CATEGORIES 
} from '@/services/recommendationService';

function App() {
  const [activeTab, setActiveTab] = useState<'demo' | 'recommendation' | 'wardrobe'>('demo');
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLMStudioReady, setIsLMStudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Studio cross-wiring state
  const [studioEquippedGarment, setStudioEquippedGarment] = useState<DemoGarment | null>(null);
  const [studioEquippedOutfit, setStudioEquippedOutfit] = useState<{
    top?: WardrobeItem;
    bottom?: WardrobeItem;
    layer?: WardrobeItem;
    onePiece?: WardrobeItem;
  } | null>(null);

  const wardrobeItemToDemo = useCallback((item: WardrobeItem): DemoGarment => {
    const cat = item.analysis.category;
    let group: GarmentGroup = 'base_top';
    if (BOTTOM_CATEGORIES.has(cat)) group = 'bottom';
    else if (LAYER_CATEGORIES.has(cat)) group = 'layer';
    else if (ONE_PIECE_CATEGORIES.has(cat)) group = 'one_piece';

    return {
      id: `closet-${item.id}`,
      name: item.analysis.summary || cat,
      category: cat,
      group,
      description: item.analysis.analyzed_garment || 'From your wardrobe inventory',
      imageUrl: item.imageUrl,
      attributes: {
        formality: 'Casual',
        fabric: 'Wardrobe',
        season: 'All Weather',
      },
    };
  }, []);

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
  const handleUploadComplete = useCallback(async (item: WardrobeItem) => {
    await refreshWardrobe();
    toast.success('Garment added to wardrobe!', {
      description: `Added: ${item.analysis.analyzed_garment.substring(0, 50)}...`,
    });
  }, [refreshWardrobe]);

  return (
    <div className="min-h-screen bg-[#09318D] text-white">
      <Toaster position="bottom-right" richColors closeButton expand={false} />
      
      <Header 
        weather={weather ? {
          temperature: weather.temperature,
          condition: weather.condition,
          location: weather.location,
        } : null}
        wardrobeCount={wardrobe.length}
      />

      {/* Stageshow Landing Hero */}
      <LandingHero 
        onOpenStudio={() => {
          document.getElementById('web-studio')?.scrollIntoView({ behavior: 'smooth' });
        }} 
      />

      {/* 3-Step Walkthrough */}
      <HowItWorks />

      {/* Feature Bento Matrix */}
      <BentoFeatures />

      {/* Dedicated APK Download Section */}
      <DownloadSection />

      {/* Interactive Web Studio / Playground */}
      <main id="web-studio" className="container max-w-7xl mx-auto px-4 py-12 scroll-mt-16">
        <div className="flex flex-col items-start gap-1 mb-8 pb-4 border-b border-white/20">
          <div className="font-pixel text-xs text-[#fd91cc] tracking-widest">
            INTERACTIVE PLAYGROUND
          </div>
          <h2 className="font-pixel text-2xl sm:text-3xl text-white tracking-wide">
            Test the Stylist in Your Browser
          </h2>
          <p className="font-sans text-sm text-white/70">
            Equip sample garments, test compatibility scoring, or manage your closet inventory right here.
          </p>
        </div>

        {/* Sub-header Context Bar */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between pb-4 mb-6 border-b border-white/20 gap-2 sm:gap-3">
          <div className="flex items-center gap-3">
            <LMStudioStatus />
          </div>
          {weather && (
            <div className="text-xs text-white/80 font-sans flex items-start sm:items-center gap-2">
              <span className="font-pixel text-[#fd91cc] flex-shrink-0">ADVICE:</span>
              <span className="line-clamp-2 sm:line-clamp-1">{weather.recommendation}</span>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="border border-white/20 p-12 bg-white/5 flex flex-col items-center justify-center gap-3 rounded-sm">
            <div className="w-6 h-6 border-2 border-white/30 border-t-[#fd91cc] animate-spin rounded-full" />
            <p className="font-pixel text-xs text-white/70 tracking-wider">INITIALIZING WARDROBE DATABASE...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'demo' | 'recommendation' | 'wardrobe')} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-[#09318D] border border-white/30 p-1">
              <TabsTrigger 
                value="demo" 
                className="font-pixel text-[10px] sm:text-xs tracking-wider data-[state=active]:bg-[#fd91cc] data-[state=active]:text-[#09318D] text-white flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <PixelIcon name="zap" size={14} />
                <span className="hidden sm:inline">BROWSER </span><span>DEMO</span>
              </TabsTrigger>
              <TabsTrigger 
                value="recommendation" 
                className="font-pixel text-[10px] sm:text-xs tracking-wider data-[state=active]:bg-[#fd91cc] data-[state=active]:text-[#09318D] text-white flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <PixelIcon name="sparkles" size={14} />
                <span className="hidden sm:inline">DAILY </span><span>OUTFIT</span>
              </TabsTrigger>
              <TabsTrigger 
                value="wardrobe" 
                className="font-pixel text-[10px] sm:text-xs tracking-wider data-[state=active]:bg-[#fd91cc] data-[state=active]:text-[#09318D] text-white flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-3"
              >
                <PixelIcon name="grid" size={14} />
                <span className="hidden sm:inline">MY </span><span>WARDROBE</span>
              </TabsTrigger>
            </TabsList>

            {/* Browser Demo Tab (Default) */}
            <TabsContent value="demo" className="space-y-6 mt-6">
              <BrowserDemo 
                userWardrobe={wardrobe}
                equippedGarment={studioEquippedGarment}
                onClearEquipped={() => setStudioEquippedGarment(null)}
                equippedOutfit={studioEquippedOutfit}
                onClearEquippedOutfit={() => setStudioEquippedOutfit(null)}
              />
            </TabsContent>

            {/* Daily Recommendation Tab */}
            <TabsContent value="recommendation" className="space-y-6 mt-6">
              <DailyRecommendation 
                wardrobe={wardrobe} 
                weather={weather} 
                onStyleOutfitInStudio={(top, bottom, layer, onePiece) => {
                  setStudioEquippedOutfit({ top, bottom, layer, onePiece });
                  setActiveTab('demo');
                  toast.success('Outfit transferred to Studio Canvas!');
                }}
              />
            </TabsContent>

            {/* Wardrobe Tab */}
            <TabsContent value="wardrobe" className="space-y-6 mt-6">
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
                    onStyleInStudio={(item) => {
                      setStudioEquippedGarment(wardrobeItemToDemo(item));
                      setActiveTab('demo');
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-[#09318D] py-8 text-xs text-white/60">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-white">FITCHECK v2.0.1</span>
            <span>·</span>
            <span>Qwen3-VL 2B Stylist</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a 
              href="https://github.com/barryallen16/fitcheck/releases/tag/v2.0.1" 
              className="hover:text-white transition-colors"
            >
              Releases
            </a>
            <a 
              href="https://huggingface.co/spaces/barryallen16/fitcheck" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors"
            >
              Cloud Space
            </a>
            <a 
              href="https://ieeexplore.ieee.org/document/11681836/" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors"
            >
              IEEE Paper
            </a>
            <a 
              href="https://github.com/barryallen16/fitcheck" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
