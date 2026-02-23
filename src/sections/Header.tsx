import { Sparkles, Shirt, CloudSun, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  weather: {
    temperature: number;
    condition: string;
    location: string;
  } | null;
  wardrobeCount: number;
}

export function Header({ weather, wardrobeCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              FitCheck
            </h1>
            <p className="text-xs text-muted-foreground">AI Fashion Stylist</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {/* Weather Badge */}
          {weather && (
            <Badge variant="secondary" className="gap-2 px-3 py-1.5">
              <CloudSun className="h-4 w-4 text-amber-500" />
              <span className="text-sm">{weather.temperature}°C</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {weather.location}
              </span>
            </Badge>
          )}

          {/* Wardrobe Count */}
          <Badge variant="outline" className="gap-2 px-3 py-1.5">
            <Shirt className="h-4 w-4 text-rose-500" />
            <span className="text-sm">{wardrobeCount} items</span>
          </Badge>

          {/* User Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
