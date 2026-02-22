import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { WeatherData } from '@/types';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Chennai coordinates
const CHENNAI_LAT = 13.0827;
const CHENNAI_LON = 80.2707;

// WMO Weather interpretation codes
const weatherCodes: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear sky', icon: 'sun' },
  1: { condition: 'Mainly clear', icon: 'sun-dim' },
  2: { condition: 'Partly cloudy', icon: 'cloud-sun' },
  3: { condition: 'Overcast', icon: 'cloud' },
  45: { condition: 'Foggy', icon: 'cloud-fog' },
  48: { condition: 'Depositing rime fog', icon: 'cloud-fog' },
  51: { condition: 'Light drizzle', icon: 'cloud-drizzle' },
  53: { condition: 'Moderate drizzle', icon: 'cloud-drizzle' },
  55: { condition: 'Dense drizzle', icon: 'cloud-drizzle' },
  61: { condition: 'Slight rain', icon: 'cloud-rain' },
  63: { condition: 'Moderate rain', icon: 'cloud-rain' },
  65: { condition: 'Heavy rain', icon: 'cloud-rain' },
  71: { condition: 'Slight snow', icon: 'snowflake' },
  73: { condition: 'Moderate snow', icon: 'snowflake' },
  75: { condition: 'Heavy snow', icon: 'snowflake' },
  77: { condition: 'Snow grains', icon: 'snowflake' },
  80: { condition: 'Slight rain showers', icon: 'cloud-rain-wind' },
  81: { condition: 'Moderate rain showers', icon: 'cloud-rain-wind' },
  82: { condition: 'Violent rain showers', icon: 'cloud-lightning' },
  95: { condition: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { condition: 'Thunderstorm with hail', icon: 'cloud-lightning' },
  99: { condition: 'Heavy thunderstorm', icon: 'cloud-lightning' },
};

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(OPEN_METEO_URL, {
        params: {
          latitude: CHENNAI_LAT,
          longitude: CHENNAI_LON,
          current: 'temperature_2m,relative_humidity_2m,weather_code',
          timezone: 'Asia/Kolkata',
        },
        timeout: 10000,
      });

      const current = response.data.current;
      const weatherCode = current.weather_code;
      const weatherInfo = weatherCodes[weatherCode] || { condition: 'Unknown', icon: 'cloud' };

      setWeather({
        temp: Math.round(current.temperature_2m),
        condition: weatherInfo.condition,
        humidity: current.relative_humidity_2m,
        location: 'Chennai, India',
        icon: weatherInfo.icon,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(errorMessage);
      console.error('Weather API error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { weather, isLoading, error, refetch: fetchWeather };
}

export function getWeatherBasedRecommendations(weather: WeatherData): string[] {
  const recommendations: string[] = [];
  
  if (weather.temp > 32) {
    recommendations.push('Light, breathable fabrics like cotton and linen');
    recommendations.push('Loose fits for better air circulation');
  } else if (weather.temp > 25) {
    recommendations.push('Comfortable cotton blends');
    recommendations.push('Semi-formal casual wear');
  } else if (weather.temp > 18) {
    recommendations.push('Light layers that can be added/removed');
    recommendations.push('Full sleeves for comfort');
  } else {
    recommendations.push('Warm layers and covered outfits');
    recommendations.push('Full coverage ethnic wear');
  }

  if (weather.condition.toLowerCase().includes('rain')) {
    recommendations.push('Quick-dry fabrics');
    recommendations.push('Avoid heavy silks and delicate materials');
  }

  if (weather.humidity > 70) {
    recommendations.push('Moisture-wicking fabrics');
    recommendations.push('Avoid heavy embroidery that may feel uncomfortable');
  }

  return recommendations;
}
