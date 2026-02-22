import { useWeather, getWeatherBasedRecommendations } from '@/hooks/useWeather';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudFog, 
  CloudDrizzle, 
  CloudRain, 
  CloudRainWind, 
  CloudLightning,
  Snowflake,
  Droplets,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'sun': Sun,
  'sun-dim': CloudSun,
  'cloud-sun': CloudSun,
  'cloud': Cloud,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'cloud-rain-wind': CloudRainWind,
  'cloud-lightning': CloudLightning,
  'snowflake': Snowflake,
};

export function WeatherWidget() {
  const { weather, isLoading, error, refetch } = useWeather();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="w-24 h-4 bg-muted rounded" />
              <div className="w-16 h-3 bg-muted rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="w-full border-destructive/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-destructive">
              Failed to load weather
            </div>
            <Button variant="ghost" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const WeatherIcon = iconMap[weather.icon] || Cloud;
  const recommendations = getWeatherBasedRecommendations(weather);

  return (
    <Card className="w-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full">
              <WeatherIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{weather.temp}°C</span>
                <Badge variant="secondary" className="text-xs">
                  {weather.condition}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                {weather.location}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="w-4 h-4" />
            {weather.humidity}%
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-orange-200 dark:border-orange-800/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Weather-Based Styling Tips:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recommendations.slice(0, 3).map((tip, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="text-xs bg-white/50 dark:bg-black/20"
              >
                {tip}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
