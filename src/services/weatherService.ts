// Weather API Service using Open-Meteo (Zero API keys required, free & open)
import type { WeatherData } from '@/types';

// Default coordinates: Chennai (Nungambakkam)
const DEFAULT_CITY = 'Chennai';
const DEFAULT_LAT = 13.057268;
const DEFAULT_LON = 80.193704;

function codeToCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Partly Cloudy';
}

export async function getChennaiWeather(): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_LAT}&longitude=${DEFAULT_LON}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    const temp = Math.round(data.current?.temperature_2m ?? 31);
    const humidity = Math.round(data.current?.relative_humidity_2m ?? 72);
    const condition = codeToCondition(data.current?.weather_code ?? 1);

    return {
      location: DEFAULT_CITY,
      temperature: temp,
      condition,
      humidity,
      recommendation: getWeatherRecommendation(temp, condition),
    };
  } catch {
    // Graceful fallback to typical Chennai climate
    return {
      location: DEFAULT_CITY,
      temperature: 31,
      condition: 'Partly Cloudy',
      humidity: 72,
      recommendation: getWeatherRecommendation(31, 'Partly Cloudy'),
    };
  }
}

function getWeatherRecommendation(temp: number, condition: string): string {
  const cond = condition.toLowerCase();
  
  if (temp > 30) {
    if (cond.includes('rain') || cond.includes('shower')) {
      return 'Light cotton or linen fabrics recommended. Carry an umbrella for passing showers.';
    }
    return 'Opt for breathable cotton, linen, or lightweight fabrics. Light colors and loose cuts suit this heat.';
  }
  
  if (temp > 25) {
    if (cond.includes('rain')) {
      return 'Light layers with water-resistant outer pieces. Comfortable shoes recommended.';
    }
    return 'Comfortable weather. Great for cottons, light knits, or casual denims.';
  }
  
  return 'Pleasant weather. Layering with a jacket, cardigan, or blazer adds polished comfort.';
}
