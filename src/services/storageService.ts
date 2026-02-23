// Storage Service for Wardrobe Data
import type { WardrobeItem, PersonaData } from '@/types';

const WARDROBE_KEY = 'fitcheck-wardrobe';
const PERSONA_KEY = 'fitcheck-persona';

// Save wardrobe item
export function saveWardrobeItem(item: WardrobeItem): void {
  try {
    const wardrobe = getWardrobe();
    wardrobe.push(item);
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(wardrobe));
  } catch (error) {
    console.error('Error saving wardrobe item:', error);
  }
}

// Get all wardrobe items
export function getWardrobe(): WardrobeItem[] {
  try {
    const data = localStorage.getItem(WARDROBE_KEY);
    if (!data) return [];
    
    const items = JSON.parse(data);
    return items.map((item: WardrobeItem) => ({
      ...item,
      uploadedAt: new Date(item.uploadedAt),
    }));
  } catch (error) {
    console.error('Error getting wardrobe:', error);
    return [];
  }
}

// Remove wardrobe item
export function removeWardrobeItem(id: string): void {
  try {
    const wardrobe = getWardrobe();
    const filtered = wardrobe.filter(item => item.id !== id);
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing wardrobe item:', error);
  }
}

// Clear entire wardrobe
export function clearWardrobe(): void {
  try {
    localStorage.removeItem(WARDROBE_KEY);
  } catch (error) {
    console.error('Error clearing wardrobe:', error);
  }
}

// Save persona data (full-body image)
export function savePersonaData(personaData: PersonaData): void {
  try {
    localStorage.setItem(PERSONA_KEY, JSON.stringify(personaData));
  } catch (error) {
    console.error('Error saving persona data:', error);
  }
}

// Get persona data
export function getPersonaData(): PersonaData | null {
  try {
    const data = localStorage.getItem(PERSONA_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      wardrobe: parsed.wardrobe?.map((item: WardrobeItem) => ({
        ...item,
        uploadedAt: new Date(item.uploadedAt),
      })) || [],
    };
  } catch (error) {
    console.error('Error getting persona data:', error);
    return null;
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

// Export wardrobe data (for backup)
export function exportWardrobe(): string {
  const wardrobe = getWardrobe();
  return JSON.stringify(wardrobe, null, 2);
}

// Import wardrobe data
export function importWardrobe(jsonData: string): boolean {
  try {
    const items = JSON.parse(jsonData);
    if (Array.isArray(items)) {
      localStorage.setItem(WARDROBE_KEY, JSON.stringify(items));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing wardrobe:', error);
    return false;
  }
}
