import { useState, useEffect } from 'react';
import { User, X, CheckCircle2, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getPersonaData, savePersonaData, fileToBase64 } from '@/services/storageService';

export function PersonaSection() {
  const [personaImage, setPersonaImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing persona on mount
  useEffect(() => {
    const persona = getPersonaData();
    if (persona?.fullBodyImage) {
      setPersonaImage(persona.fullBodyImage);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      
      setPersonaImage(dataUrl);
      
      const existing = getPersonaData();
      savePersonaData({
        fullBodyImage: dataUrl,
        wardrobe: existing?.wardrobe || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPersonaImage(null);
    const existing = getPersonaData();
    savePersonaData({
      fullBodyImage: null,
      wardrobe: existing?.wardrobe || [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-violet-500" />
          Your Persona
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {personaImage ? (
          <div className="relative">
            <img
              src={personaImage}
              alt="Your full body"
              className="w-full h-64 object-contain rounded-lg bg-muted"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-green-100 text-green-700 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Full-body photo uploaded
              </Badge>
            </div>
          </div>
        ) : (
          <div className="relative">
            <label
              htmlFor="persona-upload"
              className={`
                flex flex-col items-center justify-center
                h-64 rounded-lg border-2 border-dashed
                cursor-pointer transition-colors
                ${isUploading 
                  ? 'bg-violet-50 border-violet-400' 
                  : 'bg-muted/50 border-muted-foreground/25 hover:bg-muted'
                }
              `}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-background">
                  <Camera className="h-8 w-8 text-violet-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Upload your full-body photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    This will be used for virtual try-on. Stand straight facing the camera.
                  </p>
                </div>
              </div>
              <input
                id="persona-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3" />
            Used for virtual try-on feature
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Need to import Badge
import { Badge } from '@/components/ui/badge';
