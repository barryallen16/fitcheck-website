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

export type OutfitType = 'two_piece' | 'three_piece' | 'one_piece';

export interface OutfitRecommendation {
  id: string;
  outfitType: OutfitType;
  topGarment?: WardrobeItem;
  bottomGarment?: WardrobeItem;
  standaloneGarment?: WardrobeItem;
  layerGarment?: WardrobeItem;
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
  | 'Kurta'
  | 'Lehenga' 
  | 'Dupatta' 
  | 'Palazzo' 
  | 'Churidar' 
  | 'Salwar'
  | 'Pajama'
  | 'Saree'
  | 'Dhoti'
  | 'Sherwani'
  | 'Shirt'
  | 'Jeans'
  | 'Pants'
  | 'Jacket'
  | 'Blazer'
  | 'Top'
  | 'Bottom'
  | 'Accessory';
