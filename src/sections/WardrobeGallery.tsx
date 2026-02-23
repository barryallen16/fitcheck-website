import { useState } from 'react';
import { Trash2, Eye, Sparkles, Shirt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { WardrobeItem } from '@/types';
import { removeWardrobeItem } from '@/services/storageService';

interface WardrobeGalleryProps {
  items: WardrobeItem[];
  onItemsChange: () => void;
}

export function WardrobeGallery({ items, onItemsChange }: WardrobeGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  const handleDelete = (id: string) => {
    removeWardrobeItem(id);
    onItemsChange();
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Kurti': 'bg-rose-100 text-rose-700',
      'Lehenga': 'bg-purple-100 text-purple-700',
      'Dupatta': 'bg-pink-100 text-pink-700',
      'Palazzo': 'bg-blue-100 text-blue-700',
      'Churidar': 'bg-green-100 text-green-700',
      'Salwar': 'bg-amber-100 text-amber-700',
      'Saree': 'bg-red-100 text-red-700',
      'Sherwani': 'bg-indigo-100 text-indigo-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="p-4 rounded-full bg-muted mb-4">
            <Shirt className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Your wardrobe is empty</h3>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
            Upload photos of your garments to start getting personalized outfit recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-rose-500" />
          Your Wardrobe
        </h2>
        <Badge variant="secondary">{items.length} items</Badge>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pr-4">
          {items.map((item) => (
            <Card 
              key={item.id} 
              className="group overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative aspect-[3/4]">
                <img
                  src={item.imageUrl}
                  alt={item.analysis.analyzed_garment}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                
                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Category Badge */}
                <div className="absolute bottom-2 left-2">
                  <Badge className={`text-xs ${getCategoryColor(item.analysis.category)}`}>
                    {item.analysis.category}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-3">
                <p className="text-xs line-clamp-2 text-muted-foreground">
                  {item.analysis.analyzed_garment}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Garment Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.analysis.analyzed_garment}
                className="w-full h-64 object-contain rounded-lg bg-muted"
              />
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="text-sm">{selectedItem.analysis.analyzed_garment}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                  <Badge className={getCategoryColor(selectedItem.analysis.category)}>
                    {selectedItem.analysis.category}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Pairing Attributes</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedItem.analysis.pairing_attributes.map((attr, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {attr}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Added On</h4>
                  <p className="text-sm">
                    {new Date(selectedItem.uploadedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
