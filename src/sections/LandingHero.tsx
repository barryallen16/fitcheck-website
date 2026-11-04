import { useState, useRef } from 'react';
import { PixelIcon } from '@/components/icons/PixelIcons';
import { Download, Play, Pause, Volume2, VolumeX, Sparkles, Smartphone, ShieldCheck, ArrowDown } from 'lucide-react';
import { Phone } from '@/components/stageshow/phone';
import '@/components/stageshow/stageshow.css';

interface LandingHeroProps {
  onOpenStudio: () => void;
}

export function LandingHero({ onOpenStudio }: LandingHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 border-b border-white/20">
      {/* Background glow accent */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-[#fd91cc]/12 via-[#09318D]/20 to-transparent blur-3xl" 
      />

      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Product Value & Direct Downloads */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6">
            
            {/* Version & Publication Eyebrow */}
            <div className="inline-flex flex-wrap items-center gap-2 border border-[#fd91cc]/40 bg-[#fd91cc]/10 px-3 py-1.5 rounded-sm">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-pixel text-[11px] tracking-wider text-[#fd91cc]">
                FITCHECK V2.1.0
              </span>
              <span className="text-white/40 text-xs">·</span>
              <span className="text-white/90 text-xs font-sans font-medium">
                Personal Wardrobe Stylist
              </span>
              <span className="text-white/40 text-xs">·</span>
              <a 
                href="https://ieeexplore.ieee.org/document/11681836/" 
                target="_blank" 
                rel="noreferrer"
                className="text-white/70 hover:text-white text-xs underline font-sans"
              >
                IEEE Paper
              </a>
            </div>

            {/* Core Headline */}
            <div className="space-y-2">
              <h1 className="font-pixel text-3xl sm:text-5xl lg:text-6xl text-white tracking-wide leading-[1.1] text-balance">
                Stop guessing what to wear.
              </h1>
              <div className="font-pixel text-2xl sm:text-4xl lg:text-5xl text-[#fd91cc] tracking-wide leading-tight">
                Your closet, styled by vision AI.
              </div>
            </div>

            {/* Subtitle / Marketing Proposition */}
            <p className="font-sans text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed text-pretty">
              Most fashion apps suggest generic items to sell you new clothes. FitCheck works with the clothes you already own: take photos of your garments, let the fine-tuned Qwen3-VL 2B stylist evaluate real visual pairings, and swipe through daily outfit rotations.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto pt-2">
              <a
                href="https://github.com/barryallen16/fitcheck/releases/download/v2.1.0/FitCheck-v2.1.0.apk"
                className="font-pixel text-xs tracking-wider bg-[#fd91cc] hover:bg-[#fd91cc]/90 text-[#09318D] font-bold px-6 py-4 flex items-center justify-center gap-2.5 transition-transform active:scale-95 shadow-lg shadow-[#fd91cc]/20 border border-white"
              >
                <Download size={18} />
                <span>DOWNLOAD APK (v2.1.0)</span>
              </a>

              <button
                type="button"
                onClick={onOpenStudio}
                className="font-pixel text-xs tracking-wider border border-white/40 hover:border-white hover:bg-white/10 text-white px-5 py-4 flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <PixelIcon name="zap" size={16} />
                <span>TEST IN BROWSER</span>
                <ArrowDown size={14} className="text-[#fd91cc]" />
              </button>

              <a
                href="https://github.com/barryallen16/fitcheck"
                target="_blank"
                rel="noreferrer"
                className="font-pixel text-xs tracking-wider border border-white/20 hover:border-white/40 text-white/80 hover:text-white px-4 py-4 flex items-center justify-center gap-2 transition-colors"
                title="View GitHub Repository"
              >
                <span>GITHUB</span>
              </a>
            </div>

            {/* Quick Proof Pills */}
            <div className="pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-xs text-white/75">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-[#fd91cc] flex-shrink-0" />
                <span>Native Android APK · Expo 52</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#fd91cc] flex-shrink-0" />
                <span>Qwen3-VL 2B Pairwise Stylist</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#fd91cc] flex-shrink-0" />
                <span>100% Local Storage & JSON Backup</span>
              </div>
            </div>

          </div>

          {/* Right Column: Stageshow Phone Stage with Interactive Live Demo */}
          <div className="lg:col-span-5 flex justify-center items-center relative pt-4 lg:pt-0">
            
            {/* Ambient Shadow & Stage Backing */}
            <div className="relative p-3 sm:p-5 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20 backdrop-blur-md shadow-2xl">
              
              {/* Stageshow Android Phone */}
              <div className="relative group">
                <Phone
                  width={300}
                  frame="android"
                  time="15:13"
                  status={false}
                  island={false}
                  dark
                  className="mx-auto select-none"
                >
                  <video
                    ref={videoRef}
                    src={`${import.meta.env.BASE_URL}fitcheck-demo.mp4`}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={togglePlay}
                    title="Click to play or pause video demo"
                  />

                  {/* On-video Floating Controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-xs opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="hover:text-[#fd91cc] transition-colors flex items-center gap-1 font-pixel text-[10px]"
                      aria-label={isPlaying ? "Pause video" : "Play video"}
                    >
                      {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                      <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                    </button>
                    <span className="text-white/30">|</span>
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="hover:text-[#fd91cc] transition-colors"
                      aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                    >
                      {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                  </div>
                </Phone>
              </div>

              {/* Satellite 1: Top Right Compatibility Score Chip */}
              <div className="absolute -top-3 -right-2 sm:-right-6 border border-[#fd91cc] bg-[#09318D]/95 backdrop-blur-md px-3.5 py-2.5 shadow-xl max-w-[210px] pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span className="font-pixel text-[9px] text-[#fd91cc]">VISION STYLIST</span>
                </div>
                <div className="font-pixel text-sm text-white mt-0.5">98% MATCH</div>
                <div className="text-[11px] text-white/70 font-sans truncate">Striped Casual + Linen</div>
              </div>

              {/* Satellite 2: Mid Left Swipe Stack Callout */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-3 sm:-left-7 border border-white/30 bg-[#09318D]/95 backdrop-blur-md px-3 py-2 shadow-xl flex items-center gap-2 pointer-events-none">
                <div className="w-6 h-6 rounded-full bg-[#fd91cc]/20 border border-[#fd91cc] flex items-center justify-center text-[#fd91cc]">
                  <PixelIcon name="sparkles" size={12} />
                </div>
                <div>
                  <div className="font-pixel text-[9px] text-white">SWIPE TO BROWSE</div>
                  <div className="text-[10px] text-white/60">Tap to log wear</div>
                </div>
              </div>

              {/* Satellite 3: Bottom Right Offline Backup */}
              <div className="absolute -bottom-3 -right-2 sm:-right-5 border border-white/30 bg-[#09318D]/95 backdrop-blur-md px-3 py-2 shadow-xl flex items-center gap-2 pointer-events-none">
                <div className="w-6 h-6 rounded-full bg-[#10B981]/20 border border-[#10B981] flex items-center justify-center text-[#10B981]">
                  <ShieldCheck size={12} />
                </div>
                <div>
                  <div className="font-pixel text-[9px] text-white">OFFLINE FIRST</div>
                  <div className="text-[10px] text-white/60">Full JSON Backup</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
