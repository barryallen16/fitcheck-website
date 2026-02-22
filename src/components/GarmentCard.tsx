import type { Garment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Trash2, 
  Info, 
  Palette, 
  Sparkles, 
  Calendar,
  CloudSun,
  Shirt
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GarmentCardProps {
  garment: Garment;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
  compact?: boolean;
}

export function GarmentCard({ 
  garment, 
  onDelete, 
  showDelete = true,
  compact = false 
}: GarmentCardProps) {
  const { attributes } = garment;

  const categoryColors: Record<string, string> = {
    'Indian ethnic': 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
    'Western': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    'Accessory': 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  };

  if (compact) {
    return (
      <div className="relative group">
        <div className="aspect-square rounded-lg overflow-hidden bg-muted">
          <img
            src={garment.imageUrl}
            alt={attributes.specific_type}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-white text-xs font-medium truncate">
            {attributes.specific_type}
          </p>
          <p className="text-white/70 text-xs truncate">
            {attributes.color_primary}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
      <div className="relative aspect-square bg-muted">
        <img
          src={garment.imageUrl}
          alt={attributes.specific_type}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <Badge className={categoryColors[attributes.category] || 'bg-gray-100'}>
            {attributes.category}
          </Badge>
        </div>
        {showDelete && onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(garment.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">
              {attributes.specific_type}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {attributes.style}
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Info className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shirt className="w-5 h-5" />
                  {attributes.specific_type}
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={garment.imageUrl}
                      alt={attributes.specific_type}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Color</p>
                        <p className="text-sm font-medium">{attributes.color_primary}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Style</p>
                        <p className="text-sm font-medium">{attributes.style}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Occasions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {attributes.occasions.map((occasion, idx) => (
                        <Badge key={idx} variant="secondary">
                          {occasion}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CloudSun className="w-4 h-4" />
                      Weather Suitability
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {attributes.weather.map((w, idx) => (
                        <Badge key={idx} variant="outline">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {garment.caption}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Added on {garment.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
