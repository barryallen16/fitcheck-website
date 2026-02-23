import { useState, useCallback } from 'react';
import { Upload, Camera, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { WardrobeItem } from '@/types';
import { fileToBase64, generateId, saveWardrobeItem } from '@/services/storageService';
import { analyzeGarment } from '@/services/lmStudioService';

interface WardrobeUploadProps {
  onUploadComplete: (item: WardrobeItem) => void;
  isLMStudioReady: boolean;
}

export function WardrobeUpload({ onUploadComplete, isLMStudioReady }: WardrobeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processImage = async (file: File) => {
    if (!isLMStudioReady) {
      setError('LM Studio is not running. Please start it first.');
      return;
    }

    setIsUploading(true);
    setError(null);
    
    try {
      // Show preview
      const preview = await fileToBase64(file);
      setPreviewImage(`data:image/jpeg;base64,${preview}`);
      
      // Step 1: Convert to base64
      setUploadProgress('Reading image...');
      const base64 = await fileToBase64(file);
      
      // Step 2: Analyze with LM Studio
      setUploadProgress('Analyzing garment with AI...');
      const analysis = await analyzeGarment(base64);
      
      // Step 3: Save to wardrobe
      setUploadProgress('Saving to wardrobe...');
      const wardrobeItem: WardrobeItem = {
        id: generateId(),
        imageUrl: `data:image/jpeg;base64,${base64}`,
        analysis,
        uploadedAt: new Date(),
      };
      
      saveWardrobeItem(wardrobeItem);
      onUploadComplete(wardrobeItem);
      
      // Reset
      setPreviewImage(null);
      setUploadProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (imageFile) {
      processImage(imageFile);
    }
  }, [isLMStudioReady]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  }, [isLMStudioReady]);

  const clearPreview = () => {
    setPreviewImage(null);
    setError(null);
    setUploadProgress('');
  };

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-rose-500" />
          Add to Your Wardrobe
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isLMStudioReady && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertDescription className="text-amber-800">
              ⚠️ LM Studio is not running. Please start LM Studio with Qwen3-VL-2b model loaded.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {previewImage ? (
          <div className="relative">
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-64 object-contain rounded-lg bg-muted"
            />
            {isUploading ? (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                <p className="text-white text-sm">{uploadProgress}</p>
              </div>
            ) : (
              <button
                onClick={clearPreview}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center
              h-64 rounded-lg transition-colors
              ${isDragging 
                ? 'bg-rose-50 border-2 border-rose-400' 
                : 'bg-muted/50 border-2 border-dashed border-muted-foreground/25'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`
                p-4 rounded-full transition-colors
                ${isDragging ? 'bg-rose-100' : 'bg-background'}
              `}>
                <Upload className={`
                  h-8 w-8 transition-colors
                  ${isDragging ? 'text-rose-500' : 'text-muted-foreground'}
                `} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drag & drop your garment photo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          <span>Supported: JPG, PNG • Max 10MB</span>
        </div>
      </CardContent>
    </Card>
  );
}
