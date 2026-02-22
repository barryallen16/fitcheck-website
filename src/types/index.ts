// FitCheck Types

export interface GarmentAttribute {
  specific_type: string;
  category: 'Indian ethnic' | 'Western' | 'Accessory';
  color_primary: string;
  style: string;
  occasions: string[];
  weather: string[];
}

export interface Garment {
  id: string;
  imageUrl: string;
  attributes: GarmentAttribute;
  caption: string;
  uploadedAt: Date;
}

export interface Recommendation {
  id: string;
  inputGarment: Garment;
  recommendedBottom?: Garment;
  recommendedTop?: Garment;
  recommendedAccessory?: Garment;
  colorLogic: string;
  silhouetteLogic: string;
  direction: 'TOP_TO_BOTTOM' | 'BOTTOM_TO_TOP' | 'MIX_AND_MATCH';
  occasion: string;
  weather: string;
  createdAt: Date;
}

export interface DailyOutfit {
  date: Date;
  top?: Garment;
  bottom?: Garment;
  accessory?: Garment;
  fullRecommendation: Recommendation;
  weatherCondition: WeatherData;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  location: string;
  icon: string;
}

export interface Persona {
  id: string;
  name: string;
  fullBodyImage: string;
  wardrobe: Garment[];
}
