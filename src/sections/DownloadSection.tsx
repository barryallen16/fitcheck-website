import { Download, ExternalLink, Smartphone, CheckCircle2, Shield } from 'lucide-react';

export function DownloadSection() {
  return (
    <section id="download" className="py-20 border-b border-white/20 bg-[#09318D] scroll-mt-16">
      <div className="container max-w-7xl mx-auto px-4">
        
        <div className="border border-white/25 bg-white/5 p-8 sm:p-12 rounded-md max-w-4xl mx-auto relative overflow-hidden">
          
          {/* Subtle Corner Glow */}
          <div 
            aria-hidden="true" 
            className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 bg-[#fd91cc]/15 rounded-full blur-3xl" 
          />

          <div className="flex flex-col items-start gap-4">
            
            <div className="inline-flex items-center gap-2 border border-[#fd91cc]/40 bg-[#fd91cc]/10 px-3 py-1 text-xs font-pixel text-[#fd91cc]">
              <Smartphone size={14} />
              <span>ANDROID PREVIEW BUILD</span>
            </div>

            <h2 className="font-pixel text-3xl sm:text-4xl text-white tracking-wide">
              Download FitCheck v2.1.0
            </h2>

            <p className="font-sans text-sm sm:text-base text-white/80 max-w-xl leading-relaxed">
              Install the standalone preview APK directly on your Android phone. 
              No Google Play account or cloud sign-in required.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4 w-full sm:w-auto">
              <a
                href="https://github.com/barryallen16/fitcheck/releases/download/v2.1.0/FitCheck-v2.1.0.apk"
                className="font-pixel text-xs tracking-wider bg-[#fd91cc] hover:bg-[#fd91cc]/90 text-[#09318D] font-bold px-7 py-4 flex items-center justify-center gap-2.5 transition-transform active:scale-95 shadow-lg shadow-[#fd91cc]/25 border border-white"
              >
                <Download size={18} />
                <span>DOWNLOAD APK (51 MB)</span>
              </a>

              <a
                href="https://github.com/barryallen16/fitcheck/releases/tag/v2.1.0"
                target="_blank"
                rel="noreferrer"
                className="font-pixel text-xs tracking-wider border border-white/30 hover:border-white hover:bg-white/10 text-white px-5 py-4 flex items-center justify-center gap-2 transition-colors"
              >
                <span>RELEASE NOTES</span>
                <ExternalLink size={14} />
              </a>
            </div>

            {/* Installation Steps */}
            <div className="mt-8 pt-8 border-t border-white/15 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
              <div className="flex flex-col gap-1.5">
                <div className="font-pixel text-[#fd91cc] flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>STEP 1: DOWNLOAD</span>
                </div>
                <div className="text-white/70 font-sans">
                  Tap the download button above to save FitCheck-v2.1.0.apk to your phone.
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="font-pixel text-[#fd91cc] flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  <span>STEP 2: OPEN FILE</span>
                </div>
                <div className="text-white/70 font-sans">
                  Tap the completed download notification or open it from your Files app.
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="font-pixel text-[#fd91cc] flex items-center gap-1.5">
                  <Shield size={14} />
                  <span>STEP 3: CONFIRM</span>
                </div>
                <div className="text-white/70 font-sans">
                  If prompted, allow &quot;Install unknown apps&quot; in settings to finish installation.
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
