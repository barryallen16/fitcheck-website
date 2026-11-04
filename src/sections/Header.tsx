import { PixelIcon } from '@/components/icons/PixelIcons';
import { Download } from 'lucide-react';

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
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-[#09318D]/95 backdrop-blur-md">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-6">
          <a href="#" className="flex items-center gap-2 group">
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="FitCheck" className="h-9 sm:h-11 w-auto object-contain select-none transition-transform group-hover:scale-105" />
          </a>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-pixel tracking-wider">
            <a href="#how-it-works" className="text-white/70 hover:text-white transition-colors">
              HOW IT WORKS
            </a>
            <a href="#features" className="text-white/70 hover:text-white transition-colors">
              FEATURES
            </a>
            <a href="#download" className="text-white/70 hover:text-white transition-colors">
              DOWNLOAD
            </a>
            <a href="#web-studio" className="text-[#fd91cc] hover:text-[#fd91cc]/80 transition-colors flex items-center gap-1">
              <span>WEB STUDIO</span>
              <span className="text-[9px] border border-[#fd91cc] px-1 py-0.2">TRY</span>
            </a>
          </nav>
        </div>

        {/* Right Action & Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Weather Badge */}
          {weather && (
            <div className="border border-white/25 px-2.5 py-1 hidden sm:flex items-center gap-2 text-xs bg-black/15">
              <PixelIcon name="sun" size={14} className="text-[#fd91cc]" />
              <span className="font-pixel text-white tabular-nums">{weather.temperature}°C</span>
              <span className="text-white/60 text-[11px] truncate max-w-[80px]">{weather.location}</span>
            </div>
          )}

          {/* Wardrobe Count */}
          <div className="border border-white/25 px-2.5 py-1 flex items-center gap-2 text-xs bg-black/15">
            <PixelIcon name="shirt" size={14} className="text-[#fd91cc]" />
            <span className="font-pixel text-white tabular-nums">{wardrobeCount}</span>
            <span className="text-white/60 hidden sm:inline text-[11px]">items</span>
          </div>

          {/* Direct APK Download in Header */}
          <a
            href="https://github.com/barryallen16/fitcheck/releases/download/v2.1.0/FitCheck-v2.1.0.apk"
            className="font-pixel text-[11px] tracking-wider bg-[#fd91cc] hover:bg-[#fd91cc]/90 text-[#09318D] font-bold px-3 sm:px-4 py-1.5 flex items-center gap-1.5 border border-white shadow-sm transition-transform active:scale-95"
            title="Download FitCheck v2.1.0 APK directly"
          >
            <Download size={13} />
            <span className="hidden xs:inline">GET</span>
            <span>APK</span>
          </a>

        </div>

      </div>
    </header>
  );
}
