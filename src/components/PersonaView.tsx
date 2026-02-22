import { useState } from 'react';
import type { Garment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  User, 
  Shirt, 
  Sparkles, 
  Camera,
  Upload,
  X
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GarmentCard } from './GarmentCard';

interface PersonaViewProps {
  garments: Garment[];
  fullBodyImage?: string;
  onUpdateFullBody?: (imageUrl: string) => void;
}

export function PersonaView({ 
  garments, 
  fullBodyImage,
  onUpdateFullBody 
}: PersonaViewProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewImage(url);
    }
  };

  const confirmUpload = () => {
    if (previewImage && onUpdateFullBody) {
      onUpdateFullBody(previewImage);
      setPreviewImage(null);
    }
  };

  const cancelUpload = () => {
    setPreviewImage(null);
  };

  const stats = {
    total: garments.length,
    tops: garments.filter(g => {
      const type = g.attributes.specific_type.toLowerCase();
      return type.includes('kurti') || type.includes('shirt') || type.includes('top') || type.includes('blouse');
    }).length,
    bottoms: garments.filter(g => {
      const type = g.attributes.specific_type.toLowerCase();
      return type.includes('pant') || type.includes('jean') || type.includes('skirt') || type.includes('sharara');
    }).length,
    accessories: garments.filter(g => g.attributes.category === 'Accessory').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <h2 className="text-xl font-bold">My Style Persona</h2>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Full Body Image */}
        <Card className="md:col-span-1 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-[3/4] bg-muted">
              {fullBodyImage ? (
                <>
                  <img
                    src={fullBodyImage}
                    alt="Full body"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" className="w-full">
                          <Camera className="w-4 h-4 mr-2" />
                          Update Photo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Full Body Photo</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                            {previewImage ? (
                              <img
                                src={previewImage}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center">
                                <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Upload a full body photo
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => document.getElementById('fullbody-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Select Photo
                            </Button>
                            <input
                              id="fullbody-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                            {previewImage && (
                              <>
                                <Button onClick={confirmUpload}>
                                  Confirm
                                </Button>
                                <Button variant="ghost" onClick={cancelUpload}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  <User className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground mb-4">
                    Add a full body photo to visualize your style persona
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Camera className="w-4 h-4 mr-2" />
                        Add Photo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Full Body Photo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Upload a full body photo
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => document.getElementById('fullbody-upload-new')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Select Photo
                          </Button>
                          <input
                            id="fullbody-upload-new"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          {previewImage && (
                            <>
                              <Button onClick={confirmUpload}>
                                Confirm
                              </Button>
                              <Button variant="ghost" onClick={cancelUpload}>
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wardrobe Stats & Preview */}
        <div className="md:col-span-2 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.tops}</p>
                <p className="text-sm text-muted-foreground">Tops</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.bottoms}</p>
                <p className="text-sm text-muted-foreground">Bottoms</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{stats.accessories}</p>
                <p className="text-sm text-muted-foreground">Accessories</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Additions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Recent Additions</h3>
                </div>
                <Badge variant="secondary">
                  Last 5 items
                </Badge>
              </div>
              
              {garments.length > 0 ? (
                <ScrollArea className="h-48">
                  <div className="grid grid-cols-5 gap-2">
                    {garments.slice(0, 10).map(garment => (
                      <GarmentCard
                        key={garment.id}
                        garment={garment}
                        showDelete={false}
                        compact
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                  <Shirt className="w-8 h-8 mb-2" />
                  <p className="text-sm">No garments yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Style Distribution */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">Style Distribution</h3>
              <div className="space-y-2">
                {['Indian ethnic', 'Western', 'Accessory'].map(category => {
                  const count = garments.filter(g => g.attributes.category === category).length;
                  const percentage = garments.length > 0 ? (count / garments.length) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span className="text-sm w-24">{category}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            category === 'Indian ethnic' ? 'bg-rose-500' :
                            category === 'Western' ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
