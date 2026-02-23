import { useState, useEffect } from 'react';
import { Server, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isReady === null ? 'outline' : isReady ? 'default' : 'destructive'}
        className="gap-1.5"
      >
        {isChecking ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isReady === null ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isReady ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        <Server className="h-3 w-3" />
        LM Studio
        {isReady === null ? '' : isReady ? ' (Ready)' : ' (Offline)'}
      </Badge>
      
      {isReady === false && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={checkStatus}
          className="h-6 text-xs"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
