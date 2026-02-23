// Weather API Service for Chennai
import type { WeatherData } from '@/types';

const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';

// Default to Chennai
const DEFAULT_CITY = 'Chennai';
const DEFAULT_LAT = 13.0827;
const DEFAULT_LON = 80.2707;

export async function getChennaiWeather(): Promise<WeatherData> {
  try {
    const response = await fetch(
      `${WEATHER_API_URL}?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      location: data.name || DEFAULT_CITY,
      temperature: Math.round(data.main?.temp || 30),
      condition: data.weather?.[0]?.main || 'Clear',
      humidity: data.main?.humidity || 70,
      recommendation: getWeatherRecommendation(
        data.main?.temp || 30,
        data.weather?.[0]?.main || 'Clear'
      ),
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    // Return default data for Chennai
    return {
      location: DEFAULT_CITY,
      temperature: 32,
      condition: 'Sunny',
      humidity: 75,
      recommendation: getWeatherRecommendation(32, 'Sunny'),
    };
  }
}

function getWeatherRecommendation(temp: number, condition: string): string {
  const condition_lower = condition.toLowerCase();
  
  // Hot weather
  if (temp > 30) {
    if (condition_lower.includes('rain') || condition_lower.includes('cloud')) {
      return 'Light cotton or linen fabrics recommended. Carry an umbrella for possible showers.';
    }
    return 'Opt for breathable cotton, linen, or chiffon. Light colors and loose fits are ideal for this heat.';
  }
  
  // Warm weather
  if (temp > 25) {
    if (condition_lower.includes('rain')) {
      return 'Quick-dry fabrics suggested. Avoid heavy silks that may get damaged in rain.';
    }
    return 'Cotton, silk, or light blends work well. Perfect weather for both ethnic and fusion wear.';
  }
  
  // Cool weather
  if (temp > 20) {
    return 'Light layers recommended. Silk, cotton-silk blends, or light woolens are suitable.';
  }
  
  // Cold weather
  return 'Layer up with warmer fabrics like silk, brocade, or woolen shawls. Great weather for heavy ethnic wear.';
}

// Get weather-appropriate outfit suggestions
export function getWeatherOutfitSuggestions(weather: WeatherData): string[] {
  const suggestions: string[] = [];
  
  if (weather.temperature > 30) {
    suggestions.push('Cotton Kurtis', 'Light Palazzos', 'Chiffon Dupattas');
  } else if (weather.temperature > 25) {
    suggestions.push('Silk Kurtis', 'Cotton Salwars', 'Light Lehengas');
  } else {
    suggestions.push('Brocade Lehengas', 'Silk Sarees', 'Woolen Shawls');
  }
  
  if (weather.condition.toLowerCase().includes('rain')) {
    suggestions.push('Quick-dry Fabrics', 'Avoid Heavy Drapes');
  }
  
  return suggestions;
}
