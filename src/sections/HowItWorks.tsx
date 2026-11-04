import { Camera, Sparkles, RefreshCw } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Snap & Tag',
      subtitle: 'Task A Attribute Extraction',
      description:
        'Photograph your clothes with your phone camera or import from your gallery. Vision AI categorizes piece type, fabric drape, formality rating, and color tones without tedious manual tagging.',
      icon: Camera,
      pill: 'Instant OCR & VLM Tagging',
    },
    {
      num: '02',
      title: 'Match & Reason',
      subtitle: 'Task B Pairwise Stylist',
      description:
        'FitCheck synchronizes with your local weather forecast to evaluate appropriate warmth and humidity. Qwen3-VL 2B pairs tops and bottoms, outputting a compatibility score and specific aesthetic rationale.',
      icon: Sparkles,
      pill: 'Weather-Aware Pairings',
    },
    {
      num: '03',
      title: 'Browse & Log',
      subtitle: 'Daily Rotation & History',
      description:
        'Browse daily outfit candidates with horizontal swipe gestures. Tap Wear Today to log your pick into the 7-day calendar, which shifts worn pieces into cooldown to keep your rotations fresh.',
      icon: RefreshCw,
      pill: '7-Day Outfit Calendar',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-b border-white/20 bg-[#09318D] scroll-mt-16">
      <div className="container max-w-7xl mx-auto px-4">
        
        {/* Section Header */}
        <div className="flex flex-col items-start gap-2 mb-12">
          <div className="font-pixel text-xs text-[#fd91cc] tracking-widest">
            THREE SIMPLE STEPS
          </div>
          <h2 className="font-pixel text-2xl sm:text-4xl text-white tracking-wide">
            How FitCheck organizes your style
          </h2>
          <p className="font-sans text-sm sm:text-base text-white/70 max-w-xl">
            From garment capture to daily wear in three steps, powered by fine-tuned vision models.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => {
            const IconComponent = step.icon;
            return (
              <div 
                key={step.num}
                className="border border-white/20 bg-white/5 p-6 sm:p-7 rounded-sm flex flex-col justify-between hover:border-[#fd91cc]/70 transition-all hover:bg-white/[0.07] group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-pixel text-2xl text-[#fd91cc] group-hover:scale-110 transition-transform">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 border border-white/20 bg-black/20 flex items-center justify-center text-white/80 group-hover:text-[#fd91cc] group-hover:border-[#fd91cc] transition-colors">
                      <IconComponent size={20} />
                    </div>
                  </div>

                  <h3 className="font-pixel text-xl text-white mb-1">
                    {step.title}
                  </h3>
                  <div className="font-sans text-xs text-[#fd91cc] font-medium mb-3">
                    {step.subtitle}
                  </div>
                  <p className="font-sans text-sm text-white/75 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <span className="font-pixel text-[10px] text-white/60 tracking-wider">
                    {step.pill}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
