import { useState, useEffect } from 'react';
import { PixelIcon } from '@/components/icons/PixelIcons';
import { checkLMStudioHealth } from '@/services/lmStudioService';

export function LMStudioStatus() {
  const [isReady, setIsReady] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    const healthy = await checkLMStudioHealth();
    setIsReady(healthy);
    setIsChecking(false);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="border border-white/30 px-2.5 py-1 flex items-center gap-2 text-xs">
        <span 
          className={`w-2 h-2 ${isReady ? 'bg-[#fd91cc]' : 'bg-white/40'}`} 
          aria-hidden="true" 
        />
        <span className="font-pixel text-[11px] text-white">
          AI MODEL: {isReady === null ? 'CHECKING...' : isReady ? 'ONLINE (24/7 LFM)' : 'CLIENT-SIDE FALLBACK'}
        </span>
      </div>
      
      {isReady === false && (
        <button 
          onClick={checkStatus}
          disabled={isChecking}
          className="border border-white/30 px-2 py-0.5 text-[11px] font-pixel text-white/80 hover:text-[#fd91cc] hover:border-[#fd91cc] transition-colors flex items-center gap-1"
        >
          <PixelIcon name="redo" size={12} className={isChecking ? 'animate-spin' : ''} />
          <span>RETRY</span>
        </button>
      )}
    </div>
  );
}
