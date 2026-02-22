import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { WeatherWidget } from '@/components/WeatherWidget';
import { UploadSection } from '@/components/UploadSection';
import { WardrobeGrid } from '@/components/WardrobeGrid';
import { DailyRecommendation } from '@/components/DailyRecommendation';
import { PersonaView } from '@/components/PersonaView';
import { useWardrobe } from '@/hooks/useWardrobe';
import type { GarmentAttribute } from '@/types';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Upload
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [fullBodyImage, setFullBodyImage] = useState<string | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { 
    garments, 
    isLoading: wardrobeLoading,
    addGarment, 
    removeGarment,
    getStats
  } = useWardrobe();

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGarmentProcessed = (
    imageUrl: string, 
    attributes: GarmentAttribute, 
    caption: string
  ) => {
    addGarment(imageUrl, attributes, caption);
    toast.success(`${attributes.specific_type} added to wardrobe!`, {
      description: `Categorized as ${attributes.category}`,
    });
  };

  const handleDeleteGarment = (id: string) => {
    removeGarment(id);
    toast.info('Garment removed from wardrobe');
  };

  const handleUpdateFullBody = (imageUrl: string) => {
    setFullBodyImage(imageUrl);
    toast.success('Full body photo updated!');
  };

  const stats = getStats();

  if (isInitializing || wardrobeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-lg font-medium">Loading FitCheck...</p>
          <p className="text-sm text-muted-foreground">Preparing your wardrobe</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        garmentCount={stats.total}
      />
      
      <main className="container mx-auto px-4 py-6">
        {/* Weather Widget - Always visible */}
        <div className="mb-6">
          <WeatherWidget />
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'today' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <DailyRecommendation garments={garments} />
            </div>
          )}

          {activeTab === 'wardrobe' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <WardrobeGrid 
                garments={garments} 
                onDeleteGarment={handleDeleteGarment}
              />
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5" />
                <h2 className="text-xl font-bold">Upload Garments</h2>
              </div>
              <UploadSection onGarmentProcessed={handleGarmentProcessed} />
              
              {stats.total > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Recently Added
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {garments.slice(0, 8).map(garment => (
                      <div key={garment.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={garment.imageUrl}
                          alt={garment.attributes.specific_type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'persona' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <PersonaView 
                garments={garments}
                fullBodyImage={fullBodyImage}
                onUpdateFullBody={handleUpdateFullBody}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-medium">FitCheck</span>
              <span className="text-sm text-muted-foreground">
                AI-Powered Wardrobe Recommendations
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Powered by Qwen3-VL</span>
              <span>•</span>
              <span>Knowledge Distillation Framework</span>
            </div>
          </div>
        </div>
      </footer>

      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
