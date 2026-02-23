// Types for FitCheck Application

export interface GarmentAnalysis {
  summary: string;           // NEW
  analyzed_garment: string;
  category: string;
}
export interface WardrobeItem {
  id: string;
  imageUrl: string;
  analysis: GarmentAnalysis;
  uploadedAt: Date;
}

export interface OutfitRecommendation {
  id: string;
  topGarment: WardrobeItem;
  bottomGarment: WardrobeItem;
  colorLogic: string;
  silhouetteLogic: string;
  occasion: string;
  weather: string;
  createdAt: Date;
}

export interface VirtualTryOnResult {
  id: string;
  originalImage: string;
  garmentImages: string[];
  resultImage: string;
  generatedAt: Date;
}

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  recommendation: string;
}

export interface PersonaData {
  fullBodyImage: string | null;
  wardrobe: WardrobeItem[];
}

export type GarmentCategory = 
  | 'Kurti' 
  | 'Lehenga' 
  | 'Dupatta' 
  | 'Palazzo' 
  | 'Churidar' 
  | 'Salwar'
  | 'Saree'
  | 'Dhoti'
  | 'Sherwani'
  | 'Top'
  | 'Bottom'
  | 'Accessory';
