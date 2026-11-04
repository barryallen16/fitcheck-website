import { Sparkles, Layers, CloudSun, Shield, Cpu } from 'lucide-react';

export function BentoFeatures() {
  return (
    <section id="features" className="py-20 border-b border-white/20 bg-[#09318D]/70 scroll-mt-16">
      <div className="container max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="flex flex-col items-start gap-2 mb-12">
          <div className="font-pixel text-xs text-[#fd91cc] tracking-widest">
            FEATURE MATRIX
          </div>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white tracking-wide">
            Designed for privacy, precision, and speed
          </h2>
          <p className="font-sans text-sm sm:text-base text-white/70 max-w-xl">
            Everything you need to automate your daily wardrobe without sending personal photos to commercial servers.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Tile 1: Qwen3-VL 2B Pairwise Stylist (Span 8) */}
          <div className="md:col-span-8 border border-white/20 bg-white/5 p-6 sm:p-8 rounded-sm flex flex-col justify-between hover:border-[#fd91cc]/60 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 border border-[#fd91cc] bg-[#fd91cc]/10 flex items-center justify-center text-[#fd91cc]">
                  <Sparkles size={20} />
                </div>
                <span className="font-pixel text-[10px] text-[#fd91cc] border border-[#fd91cc]/40 px-2 py-0.5">
                  IEEE 11681836
                </span>
              </div>
              <h3 className="font-pixel text-xl text-white mb-2">
                Fine-Tuned Qwen3-VL 2B Stylist
              </h3>
              <p className="font-sans text-sm sm:text-base text-white/75 leading-relaxed max-w-2xl">
                Trained on curated outfit distillation datasets to score pairs on color theory, 
                silhouette balance, and occasion appropriateness. Evaluates real garment photos instead 
                of text descriptions to catch subtle fabric undertones.
              </p>
            </div>

            <div className="mt-8 p-4 bg-black/30 border border-white/15 rounded-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-white/50 block font-pixel text-[10px]">COLOR THEORY</span>
                <span className="text-white font-sans mt-0.5 block">Complementary & Analogous Harmony</span>
              </div>
              <div>
                <span className="text-white/50 block font-pixel text-[10px]">SILHOUETTE</span>
                <span className="text-white font-sans mt-0.5 block">Proportional Upper & Lower Balance</span>
              </div>
              <div>
                <span className="text-white/50 block font-pixel text-[10px]">OUTPUT</span>
                <span className="text-[#10B981] font-pixel text-xs mt-0.5 block">0-100% Match + Rationale</span>
              </div>
            </div>
          </div>

          {/* Tile 2: Swipeable Deck (Span 4) */}
          <div className="md:col-span-4 border border-white/20 bg-white/5 p-6 sm:p-8 rounded-sm flex flex-col justify-between hover:border-[#fd91cc]/60 transition-colors">
            <div>
              <div className="w-10 h-10 border border-[#fd91cc] bg-[#fd91cc]/10 flex items-center justify-center text-[#fd91cc] mb-4">
                <Layers size={20} />
              </div>
              <h3 className="font-pixel text-xl text-white mb-2">
                Carousel Deck Gestures
              </h3>
              <p className="font-sans text-sm text-white/75 leading-relaxed">
                Swipe left or right to flip through daily candidate looks. 
                When you find the outfit you want, tap Wear Today to record it to your wear log and start the garment cooldown timer.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-1.5 font-pixel text-xs">
              <div className="text-[#10B981]">← SWIPE TO BROWSE CANDIDATES →</div>
              <div className="text-white/80">TAP WEAR TODAY TO LOG PICK</div>
            </div>
          </div>

          {/* Tile 3: Weather Integration (Span 4) */}
          <div className="md:col-span-4 border border-white/20 bg-white/5 p-6 sm:p-8 rounded-sm flex flex-col justify-between hover:border-[#fd91cc]/60 transition-colors">
            <div>
              <div className="w-10 h-10 border border-[#fd91cc] bg-[#fd91cc]/10 flex items-center justify-center text-[#fd91cc] mb-4">
                <CloudSun size={20} />
              </div>
              <h3 className="font-pixel text-xl text-white mb-2">
                Weather-Aware Logic
              </h3>
              <p className="font-sans text-sm text-white/75 leading-relaxed">
                Fetches real-time temperature, humidity, and precipitation from Open-Meteo. 
                Prevents heavy knits during humid weather and suggests waterproof fabrics on rainy days.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/60">
              <span>Open-Meteo API</span>
              <span className="font-pixel text-[#fd91cc]">AUTO SYNC</span>
            </div>
          </div>

          {/* Tile 4: Local Storage & Privacy (Span 4) */}
          <div className="md:col-span-4 border border-white/20 bg-white/5 p-6 sm:p-8 rounded-sm flex flex-col justify-between hover:border-[#fd91cc]/60 transition-colors">
            <div>
              <div className="w-10 h-10 border border-[#fd91cc] bg-[#fd91cc]/10 flex items-center justify-center text-[#fd91cc] mb-4">
                <Shield size={20} />
              </div>
              <h3 className="font-pixel text-xl text-white mb-2">
                100% Offline Storage
              </h3>
              <p className="font-sans text-sm text-white/75 leading-relaxed">
                Garment photos and catalog data reside in your device&apos;s local filesystem. 
                Export complete JSON backups anytime via system share sheet with zero telemetry.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="font-mono text-white/60">JSON Backup & Restore</span>
              <span className="font-pixel text-[#10B981]">NO CLOUD LOCK</span>
            </div>
          </div>

          {/* Tile 5: Dual Backend (Span 4) */}
          <div className="md:col-span-4 border border-white/20 bg-white/5 p-6 sm:p-8 rounded-sm flex flex-col justify-between hover:border-[#fd91cc]/60 transition-colors">
            <div>
              <div className="w-10 h-10 border border-[#fd91cc] bg-[#fd91cc]/10 flex items-center justify-center text-[#fd91cc] mb-4">
                <Cpu size={20} />
              </div>
              <h3 className="font-pixel text-xl text-white mb-2">
                Dual Inference Modes
              </h3>
              <p className="font-sans text-sm text-white/75 leading-relaxed">
                Connects to our public Hugging Face Space by default, or run self-hosted locally 
                on your desktop with quantized GGUF weights via LM Studio.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-white/60">
              <span>HF Space / Local GGUF</span>
              <span className="font-pixel text-[#fd91cc]">SELF-HOSTABLE</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
