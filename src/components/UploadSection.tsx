import { useState, useCallback, useRef } from 'react';
import { useLMStudio } from '@/hooks/useLMStudio';
import type { GarmentAttribute } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Camera, 
  X, 
  Check, 
  Loader2, 
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UploadSectionProps {
  onGarmentProcessed: (imageUrl: string, attributes: GarmentAttribute, caption: string) => void;
}

export function UploadSection({ onGarmentProcessed }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentProcessing, setCurrentProcessing] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { classifyGarment, generateCaption, isLoading } = useLMStudio();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processImage = async (base64Image: string, previewUrl: string) => {
    setCurrentProcessing(previewUrl);
    
    try {
      // Generate caption
      const caption = await generateCaption(base64Image);
      
      // Classify garment
      const attributes = await classifyGarment(base64Image);
      
      if (attributes && caption) {
        onGarmentProcessed(previewUrl, attributes, caption);
        setProcessedCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to process image:', error);
    } finally {
      setCurrentProcessing(null);
    }
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    const newPreviews: string[] = [];
    const base64Images: string[] = [];

    for (const file of imageFiles) {
      const base64 = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);
      newPreviews.push(previewUrl);
      base64Images.push(base64);
    }

    setPreviewImages(prev => [...prev, ...newPreviews]);

    // Process images sequentially
    for (let i = 0; i < base64Images.length; i++) {
      await processImage(base64Images[i], newPreviews[i]);
    }

    if (imageFiles.length > 0) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setPreviewImages([]);
        setProcessedCount(0);
      }, 3000);
    }
  }, [onGarmentProcessed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removePreview = (index: number) => {
    setPreviewImages((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
  };

  const totalImages = previewImages.length;
  const progress = totalImages > 0 ? (processedCount / totalImages) * 100 : 0;

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Upload Garment Photos
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Drag and drop your garment images here, or click to browse. 
              Supports JPG, PNG, and WebP formats.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
              <Button
                variant="outline"
                onClick={() => {}}
                disabled={isLoading}
              >
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {previewImages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium">Processing Images</span>
              </div>
              <Badge variant="secondary">
                {processedCount} / {totalImages}
              </Badge>
            </div>
            <Progress value={progress} className="mb-4" />
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {previewImages.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {currentProcessing === preview ? (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  ) : processedCount > index ? (
                    <div className="absolute inset-0 bg-green-500/50 rounded-lg flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  ) : null}
                  <button
                    onClick={() => removePreview(index)}
                    className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 hover:opacity-100 transition-opacity"
                    disabled={isLoading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="w-6 h-6" />
              Upload Complete!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-lg font-medium">
              {processedCount} garment{processedCount !== 1 ? 's' : ''} added to your wardrobe
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your garments have been classified and are ready for recommendations.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
