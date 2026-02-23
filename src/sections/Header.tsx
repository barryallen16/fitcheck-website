import { Shirt, CloudSun, User } from 'lucide-react';
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
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FitCheck" className="h-full w-[50%] object-contain " />
          <div>
            <p className="text-xs text-muted-foreground hidden sm:block">AI Fashion Stylist</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Weather Badge */}
          {weather && (
            <Badge variant="secondary" className="gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5">
              <CloudSun className="h-4 w-4 text-amber-500" />
              <span className="text-xs sm:text-sm">{weather.temperature}°C</span>
              <span className="text-xs text-muted-foreground hidden md:inline">
                {weather.location}
              </span>
            </Badge>
          )}

          {/* Wardrobe Count */}
          <Badge variant="outline" className="gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5">
            <Shirt className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
            <span className="text-xs sm:text-sm">{wardrobeCount} <span className="hidden sm:inline">items</span></span>
          </Badge>

          {/* User Avatar */}
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <User className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}