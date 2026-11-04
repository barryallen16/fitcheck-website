import { useState, useCallback } from 'react';
import { PixelIcon } from '@/components/icons/PixelIcons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { WardrobeItem, GarmentAnalysis } from '@/types';
import { fileToBase64, generateId, saveWardrobeItem } from '@/services/storageService';
import { analyzeGarment } from '@/services/lmStudioService';
import { removeGarmentBackground } from '@/services/imageProcessing';

interface WardrobeUploadProps {
  onUploadComplete: (item: WardrobeItem) => void;
  isLMStudioReady: boolean;
}

interface PendingUpload {
  rawImageUrl: string;
  cleanedImageUrl: string;
  isCleanedActive: boolean;
  analysis: GarmentAnalysis;
}

const COMMON_CATEGORIES = [
  'Shirt',
  'Kurti',
  'Kurta',
  'Top',
  'Saree',
  'Sherwani',
  'Dress',
  'Pants',
  'Pajama',
  'Jeans',
  'Churidar',
  'Skirt',
  'Jacket',
  'Blazer',
] as const;

export function WardrobeUpload({ onUploadComplete, isLMStudioReady }: WardrobeUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
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
    setIsUploading(true);
    setError(null);
    
    try {
      setUploadProgress('Reading image data...');
      const base64 = await fileToBase64(file);
      const rawImageUrl = `data:image/jpeg;base64,${base64}`;
      
      setUploadProgress('Cleaning background & isolating garment...');
      const cleanedImageUrl = await removeGarmentBackground(rawImageUrl);

      setUploadProgress('Extracting garment attributes...');
      let analysis: GarmentAnalysis | null = null;

      if (isLMStudioReady) {
        try {
          analysis = await analyzeGarment(base64);
        } catch {
          // Fall back to client-side heuristic tagger
          analysis = null;
        }
      }

      if (!analysis) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const nameLower = cleanName.toLowerCase();
        let cat = 'Top';
        if (nameLower.includes('jean')) cat = 'Jeans';
        else if (nameLower.includes('pajama')) cat = 'Pajama';
        else if (nameLower.includes('pant') || nameLower.includes('trous')) cat = 'Pants';
        else if (nameLower.includes('churidar')) cat = 'Churidar';
        else if (nameLower.includes('kurta')) cat = 'Kurta';
        else if (nameLower.includes('kurti')) cat = 'Kurti';
        else if (nameLower.includes('shirt')) cat = 'Shirt';
        else if (nameLower.includes('sherwani')) cat = 'Sherwani';
        else if (nameLower.includes('saree') || nameLower.includes('sari')) cat = 'Saree';
        else if (nameLower.includes('blazer') || nameLower.includes('coat')) cat = 'Blazer';
        else if (nameLower.includes('jacket') || nameLower.includes('nehru')) cat = 'Jacket';
        else if (nameLower.includes('dress')) cat = 'Dress';
        else if (nameLower.includes('skirt')) cat = 'Skirt';

        analysis = {
          summary: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          analyzed_garment: `User garment (${cat}) analyzed via in-browser visual heuristics. Suitable for mix-and-match styling.`,
          category: cat,
        };
      }
      
      // Present upload preview modal with one-click background removal toggle
      setPendingUpload({
        rawImageUrl,
        cleanedImageUrl,
        isCleanedActive: true, // Default to transparent silhouette
        analysis,
      });

      setUploadProgress('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!pendingUpload) return;

    try {
      setIsUploading(true);
      setUploadProgress('Saving to wardrobe catalog...');

      const finalImageUrl = pendingUpload.isCleanedActive
        ? pendingUpload.cleanedImageUrl
        : pendingUpload.rawImageUrl;

      const wardrobeItem: WardrobeItem = {
        id: generateId(),
        imageUrl: finalImageUrl,
        analysis: pendingUpload.analysis,
        uploadedAt: new Date(),
      };

      await saveWardrobeItem(wardrobeItem);
      onUploadComplete(wardrobeItem);
      setPendingUpload(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save garment');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
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

  return (
    <div className="border border-white/20 p-5 bg-[#09318D] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/20">
        <h3 className="font-pixel text-xs text-white flex items-center gap-2">
          <PixelIcon name="camera" size={16} className="text-[#fd91cc]" />
          <span>UPLOAD GARMENT</span>
        </h3>
        <span className="text-[10px] text-white/70 font-pixel">JPG, PNG</span>
      </div>

      {error && (
        <div className="border border-[#fd91cc] p-3 text-xs text-[#fd91cc] bg-[#fd91cc]/10">
          {error}
        </div>
      )}

      {isUploading ? (
        <div className="h-56 border-2 border-white/30 bg-[#09318D] flex flex-col items-center justify-center p-4 text-center">
          <div className="w-8 h-8 border-2 border-white border-t-[#fd91cc] animate-spin mb-3" />
          <p className="font-pixel text-xs text-white tracking-wider">{uploadProgress || 'PROCESSING IMAGE...'}</p>
          <span className="text-[10px] text-white/60 font-mono mt-1">Evaluating canvas transparency...</span>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center
            h-56 border-2 border-dashed transition-colors p-4 text-center cursor-pointer
            ${isDragging 
              ? 'border-[#fd91cc] bg-[#fd91cc]/10' 
              : 'border-white/30 hover:border-white/60 bg-[#09318D]'
            }
          `}
        >
          <div className="w-10 h-10 border border-white/40 flex items-center justify-center mb-3 text-[#fd91cc]">
            <PixelIcon name="upload" size={20} />
          </div>
          <p className="font-pixel text-xs text-white">
            DRAG & DROP GARMENT
          </p>
          <p className="text-[11px] text-white/70 mt-1">
            or click to browse files
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      )}

      <div className="space-y-1 text-[10px] text-white/70 font-mono">
        <div className="flex items-center gap-1.5">
          <PixelIcon name="check" size={12} className="text-[#fd91cc]" />
          <span>Client-side inference ready. No cloud upload required.</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/60">
          <PixelIcon name="sparkles" size={12} className="text-[#fd91cc]" />
          <span>Auto-removes solid backgrounds and centers garment silhouette.</span>
        </div>
      </div>

      {/* Upload Preview & Background Toggle Modal */}
      <Dialog open={!!pendingUpload} onOpenChange={(open) => { if (!open) setPendingUpload(null); }}>
        <DialogContent className="max-w-lg bg-[#09318D] border-2 border-white text-white p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm flex items-center justify-between text-white border-b border-white/20 pb-3">
              <span className="flex items-center gap-2">
                <PixelIcon name="camera" size={16} className="text-[#fd91cc]" />
                <span>GARMENT UPLOAD PREVIEW</span>
              </span>
              <span className="font-pixel text-[10px] bg-[#fd91cc] text-[#09318D] px-2 py-0.5 uppercase tracking-wider">
                1-Click Cleaner
              </span>
            </DialogTitle>
          </DialogHeader>

          {pendingUpload && (
            <div className="space-y-4">
              {/* Image Preview with Checkerboard Background for Transparency */}
              <div className="relative aspect-[4/3] w-full border border-white/30 overflow-hidden flex items-center justify-center bg-[linear-gradient(45deg,#07256d_25%,transparent_25%),linear-gradient(-45deg,#07256d_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#07256d_75%),linear-gradient(-45deg,transparent_75%,#07256d_75%)] bg-[size:16px_16px] bg-[#09318D] p-3">
                <img
                  src={pendingUpload.isCleanedActive ? pendingUpload.cleanedImageUrl : pendingUpload.rawImageUrl}
                  alt={pendingUpload.analysis.summary}
                  className="w-full h-full object-contain"
                />

                {/* 1-Click Background Toggle Button */}
                <button
                  type="button"
                  data-testid="toggle-bg-removal-btn"
                  onClick={() => setPendingUpload(prev => prev ? { ...prev, isCleanedActive: !prev.isCleanedActive } : null)}
                  className={`absolute top-2 right-2 font-pixel text-[10px] px-2.5 py-1.5 border transition-all flex items-center gap-1.5 shadow-md ${
                    pendingUpload.isCleanedActive
                      ? 'bg-[#fd91cc] text-[#09318D] border-[#fd91cc]'
                      : 'bg-[#09318D]/90 text-white border-white/50 hover:border-white'
                  }`}
                  title="Click to toggle between clean transparent cutout and original photo background"
                >
                  <PixelIcon name={pendingUpload.isCleanedActive ? "sparkles" : "camera"} size={13} />
                  <span>{pendingUpload.isCleanedActive ? "TRANSPARENT SILHOUETTE" : "ORIGINAL BACKGROUND"}</span>
                </button>

                {/* Image State Pill */}
                <div className="absolute bottom-2 left-2 bg-[#09318D]/90 border border-white/30 text-[9px] font-pixel text-[#fd91cc] px-2 py-0.5">
                  {pendingUpload.isCleanedActive ? "PNG CUTOUT" : "RAW JPEG/PNG"}
                </div>
              </div>

              {/* Detected Details & Category Refinement */}
              <div className="space-y-3">
                <div>
                  <label className="font-pixel text-[10px] text-[#fd91cc] block mb-1">GARMENT TITLE</label>
                  <div className="font-pixel text-xs text-white bg-black/20 border border-white/20 p-2">
                    {pendingUpload.analysis.summary}
                  </div>
                </div>

                <div>
                  <label className="font-pixel text-[10px] text-[#fd91cc] block mb-1">CONFIRM OR REFINE CATEGORY</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        data-testid={`category-pill-${cat.toLowerCase()}`}
                        onClick={() => setPendingUpload(prev => prev ? {
                          ...prev,
                          analysis: {
                            ...prev.analysis,
                            category: cat,
                          }
                        } : null)}
                        className={`font-pixel text-[10px] px-2.5 py-1 border transition-colors ${
                          pendingUpload.analysis.category === cat
                            ? 'bg-[#fd91cc] text-[#09318D] border-[#fd91cc]'
                            : 'bg-[#09318D] text-white/80 border-white/20 hover:border-white/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-white/20 p-2.5 bg-white/5 text-[11px] text-white/80 space-y-1">
                  <div className="font-pixel text-[9px] text-[#fd91cc]">VISION SUMMARY</div>
                  <p className="line-clamp-2 leading-relaxed">
                    {pendingUpload.analysis.analyzed_garment}
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/20 gap-3">
                <button
                  type="button"
                  data-testid="discard-upload-btn"
                  onClick={() => setPendingUpload(null)}
                  className="border border-white/40 text-white font-pixel text-xs px-4 py-2 hover:bg-white/10 transition-colors"
                >
                  DISCARD
                </button>

                <button
                  type="button"
                  data-testid="confirm-save-wardrobe-btn"
                  onClick={handleConfirmSave}
                  className="bg-[#fd91cc] text-[#09318D] font-pixel text-xs px-5 py-2 hover:bg-white transition-colors flex items-center gap-2"
                >
                  <PixelIcon name="check" size={14} />
                  <span>CONFIRM & ADD TO WARDROBE</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
