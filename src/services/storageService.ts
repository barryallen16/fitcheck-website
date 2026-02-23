// Storage Service for Wardrobe Data using IndexedDB
import { get, set, del } from 'idb-keyval';
import type { WardrobeItem } from '@/types';

const WARDROBE_KEY = 'fitcheck-wardrobe';

// Save wardrobe item
export async function saveWardrobeItem(item: WardrobeItem): Promise<void> {
  try {
    const wardrobe = await getWardrobe();
    wardrobe.push(item);
    await set(WARDROBE_KEY, wardrobe);
  } catch (error) {
    console.error('Error saving wardrobe item:', error);
  }
}

// Get all wardrobe items
export async function getWardrobe(): Promise<WardrobeItem[]> {
  try {
    const data = await get<WardrobeItem[]>(WARDROBE_KEY);
    if (!data) return [];
    
    return data.map((item) => ({
      ...item,
      uploadedAt: new Date(item.uploadedAt),
    }));
  } catch (error) {
    console.error('Error getting wardrobe:', error);
    return [];
  }
}

// Remove wardrobe item
export async function removeWardrobeItem(id: string): Promise<void> {
  try {
    const wardrobe = await getWardrobe();
    const filtered = wardrobe.filter(item => item.id !== id);
    await set(WARDROBE_KEY, filtered);
  } catch (error) {
    console.error('Error removing wardrobe item:', error);
  }
}

// Clear entire wardrobe
export async function clearWardrobe(): Promise<void> {
  try {
    await del(WARDROBE_KEY);
  } catch (error) {
    console.error('Error clearing wardrobe:', error);
  }
}

// Auto Import from Python Script Output
export async function autoImportFromScript(): Promise<void> {
  try {
    const response = await fetch('/wardrobe_export.json');
    if (!response.ok) return; // File doesn't exist yet, skip silently

    const data = await response.json();
    
    // Import wardrobe if it exists in the file
    if (data.wardrobe && Array.isArray(data.wardrobe)) {
      const formattedWardrobe = data.wardrobe.map((item: any) => {
        const rawImage = item.imageBase64 || item.imageUrl || item.image;
        let formattedImage = rawImage;
        
        // Add the prefix if it's missing
        if (rawImage && !rawImage.startsWith('data:')) {
          formattedImage = `data:image/jpeg;base64,${rawImage}`;
        }

        return {
          ...item,
          imageUrl: formattedImage, 
        };
      });

      await set(WARDROBE_KEY, formattedWardrobe);
    }
    
    console.log('Successfully auto-imported wardrobe to IndexedDB.');
  } catch (error) {
    console.error('Auto-import failed:', error);
  }
}

// Convert file to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result?.toString().split(',')[1];
      if (base64) {
        resolve(base64);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
  });
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}