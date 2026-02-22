import { useState } from 'react';
import type { Garment } from '@/types';
import { GarmentCard } from './GarmentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  LayoutList,
  Shirt,
  Sparkles,
  X
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WardrobeGridProps {
  garments: Garment[];
  onDeleteGarment?: (id: string) => void;
}

export function WardrobeGrid({ garments, onDeleteGarment }: WardrobeGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Extract unique categories and colors
  const categories = [...new Set(garments.map(g => g.attributes.category))];
  const colors = [...new Set(garments.map(g => g.attributes.color_primary))];

  // Filter garments
  const filteredGarments = garments.filter(garment => {
    const matchesSearch = 
      garment.attributes.specific_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      garment.attributes.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
      garment.attributes.occasions.some(o => o.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      selectedCategories.length === 0 || 
      selectedCategories.includes(garment.attributes.category);
    
    const matchesColor = 
      selectedColors.length === 0 || 
      selectedColors.includes(garment.attributes.color_primary);

    return matchesSearch && matchesCategory && matchesColor;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedColors([]);
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || selectedColors.length > 0;

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Shirt className="w-5 h-5" />
          <h2 className="text-xl font-bold">My Wardrobe</h2>
          <Badge variant="secondary">{garments.length}</Badge>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search garments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Categories</p>
                {categories.map(category => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCategories([...selectedCategories, category]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(c => c !== category));
                      }
                    }}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
              <div className="p-2 border-t">
                <p className="text-sm font-medium mb-2">Colors</p>
                {colors.slice(0, 10).map(color => (
                  <DropdownMenuCheckboxItem
                    key={color}
                    checked={selectedColors.includes(color)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedColors([...selectedColors, color]);
                      } else {
                        setSelectedColors(selectedColors.filter(c => c !== color));
                      }
                    }}
                  >
                    {color}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {selectedCategories.map(cat => (
            <Badge key={cat} variant="secondary" className="gap-1">
              {cat}
              <button onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {selectedColors.map(color => (
            <Badge key={color} variant="secondary" className="gap-1">
              {color}
              <button onClick={() => setSelectedColors(selectedColors.filter(c => c !== color))}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Garment Grid */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="ethnic">Indian Ethnic</TabsTrigger>
          <TabsTrigger value="western">Western</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {filteredGarments.length > 0 ? (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
                : 'grid-cols-1'
            }`}>
              {filteredGarments.map(garment => (
                <GarmentCard
                  key={garment.id}
                  garment={garment}
                  onDelete={onDeleteGarment}
                  compact={viewMode === 'grid'}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No garments found</h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters 
                  ? 'Try adjusting your filters or search query'
                  : 'Upload some garments to get started'
                }
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ethnic">
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
              : 'grid-cols-1'
          }`}>
            {filteredGarments
              .filter(g => g.attributes.category === 'Indian ethnic')
              .map(garment => (
                <GarmentCard
                  key={garment.id}
                  garment={garment}
                  onDelete={onDeleteGarment}
                  compact={viewMode === 'grid'}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="western">
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
              : 'grid-cols-1'
          }`}>
            {filteredGarments
              .filter(g => g.attributes.category === 'Western')
              .map(garment => (
                <GarmentCard
                  key={garment.id}
                  garment={garment}
                  onDelete={onDeleteGarment}
                  compact={viewMode === 'grid'}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="accessories">
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
              : 'grid-cols-1'
          }`}>
            {filteredGarments
              .filter(g => g.attributes.category === 'Accessory')
              .map(garment => (
                <GarmentCard
                  key={garment.id}
                  garment={garment}
                  onDelete={onDeleteGarment}
                  compact={viewMode === 'grid'}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
