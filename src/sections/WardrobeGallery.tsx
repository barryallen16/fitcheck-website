import { useState, useEffect, useMemo } from "react";
import { PixelIcon } from "@/components/icons/PixelIcons";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WardrobeItem, OutfitRecommendation } from "@/types";
import { removeWardrobeItem } from "@/services/storageService";
import {
  BASE_TOP_CATEGORIES,
  BOTTOM_CATEGORIES,
  LAYER_CATEGORIES,
  ONE_PIECE_CATEGORIES,
  getAllRecommendations,
} from "@/services/recommendationService";
import { toast } from "sonner";

interface WardrobeGalleryProps {
  items: WardrobeItem[];
  onItemsChange: () => void;
  onStyleInStudio?: (item: WardrobeItem) => void;
}

type CategoryTab = 'ALL' | 'TOPS' | 'BOTTOMS' | 'LAYERS' | '1-PIECE';

export function WardrobeGallery({
  items,
  onItemsChange,
  onStyleInStudio,
}: WardrobeGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitRecommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("ALL");

  useEffect(() => {
    setOutfitHistory(getAllRecommendations(items));
  }, [items]);

  const handleDelete = async (id: string, name: string) => {
    await removeWardrobeItem(id);
    onItemsChange();
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    toast.success("Item removed from wardrobe", {
      description: name,
    });
  };

  const handleStyleItem = (item: WardrobeItem) => {
    if (onStyleInStudio) {
      onStyleInStudio(item);
      setSelectedItem(null);
      toast.success("Loaded into Studio!", {
        description: `Now styling: ${item.analysis.summary || item.analysis.category}`,
      });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Category filter
      const cat = item.analysis.category;
      if (activeCategory === "TOPS" && !BASE_TOP_CATEGORIES.has(cat)) return false;
      if (activeCategory === "BOTTOMS" && !BOTTOM_CATEGORIES.has(cat)) return false;
      if (activeCategory === "LAYERS" && !LAYER_CATEGORIES.has(cat)) return false;
      if (activeCategory === "1-PIECE" && !ONE_PIECE_CATEGORIES.has(cat)) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const summary = (item.analysis.summary || "").toLowerCase();
        const desc = (item.analysis.analyzed_garment || "").toLowerCase();
        const category = cat.toLowerCase();
        return summary.includes(q) || desc.includes(q) || category.includes(q);
      }

      return true;
    });
  }, [items, activeCategory, searchQuery]);

  const pairedGarments = selectedItem
    ? outfitHistory.reduce((acc, rec) => {
        if (rec.topGarment?.id === selectedItem.id && rec.bottomGarment) {
          if (!acc.some((i) => i.id === rec.bottomGarment!.id))
            acc.push(rec.bottomGarment);
        } else if (rec.bottomGarment?.id === selectedItem.id && rec.topGarment) {
          if (!acc.some((i) => i.id === rec.topGarment!.id))
            acc.push(rec.topGarment);
        }
        if (
          rec.layerGarment &&
          (rec.topGarment?.id === selectedItem.id ||
            rec.bottomGarment?.id === selectedItem.id ||
            rec.standaloneGarment?.id === selectedItem.id)
        ) {
          if (
            !acc.some((i) => i.id === rec.layerGarment!.id) &&
            rec.layerGarment.id !== selectedItem.id
          ) {
            acc.push(rec.layerGarment);
          }
        }
        return acc;
      }, [] as WardrobeItem[])
    : [];

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-white/30 p-12 text-center bg-[#09318D]">
        <div className="w-12 h-12 border border-white/30 flex items-center justify-center mx-auto mb-4 text-[#fd91cc]">
          <PixelIcon name="shirt" size={24} />
        </div>
        <h3 className="font-pixel text-sm text-white">WARDROBE EMPTY</h3>
        <p className="text-xs text-white/70 mt-1 max-w-sm mx-auto">
          Upload garment photos to start building your personal AI wardrobe catalog.
        </p>
      </div>
    );
  }

  const categoryCounts = {
    ALL: items.length,
    TOPS: items.filter((i) => BASE_TOP_CATEGORIES.has(i.analysis.category)).length,
    BOTTOMS: items.filter((i) => BOTTOM_CATEGORIES.has(i.analysis.category)).length,
    LAYERS: items.filter((i) => LAYER_CATEGORIES.has(i.analysis.category)).length,
    "1-PIECE": items.filter((i) => ONE_PIECE_CATEGORIES.has(i.analysis.category)).length,
  };

  return (
    <div className="space-y-4">
      {/* Header with Search & Filter Bar */}
      <div className="space-y-3 pb-3 border-b border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-pixel text-sm text-white flex items-center gap-2">
            <PixelIcon name="grid" size={16} className="text-[#fd91cc]" />
            <span>YOUR INVENTORY</span>
          </h2>

          {/* Interactive Search Bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search garments..."
              className="w-full bg-black/20 border border-white/30 px-3 py-1.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#fd91cc] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <PixelIcon name="close" size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Interactive Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(["ALL", "TOPS", "BOTTOMS", "LAYERS", "1-PIECE"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              className={`px-2.5 py-1 text-[11px] font-pixel tracking-wider whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeCategory === tab
                  ? "bg-[#fd91cc] text-[#09318D]"
                  : "border border-white/20 text-white/80 hover:border-white/50 hover:bg-white/5"
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[9px] px-1 py-0.2 ${activeCategory === tab ? "bg-[#09318D] text-white" : "text-white/60"}`}>
                {categoryCounts[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="border border-white/20 p-8 text-center text-xs text-white/70 bg-white/5">
          No garments match your search filter "{searchQuery}".
        </div>
      ) : (
        <ScrollArea className="h-[480px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group border border-white/20 hover:border-[#fd91cc] p-2 bg-[#09318D] cursor-pointer transition-all relative flex flex-col justify-between"
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative aspect-[3/4] bg-black/20 border border-white/10 overflow-hidden mb-2">
                  <img
                    src={item.imageUrl}
                    alt={item.analysis.analyzed_garment}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                  />

                  {/* Top-Right Action Row */}
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onStyleInStudio && (
                      <button
                        type="button"
                        className="bg-[#09318D] border border-[#fd91cc] text-[#fd91cc] p-1 hover:bg-[#fd91cc] hover:text-[#09318D] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStyleItem(item);
                        }}
                        title="Style in Studio"
                      >
                        <PixelIcon name="zap" size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="bg-[#09318D] border border-white/40 text-white p-1 hover:bg-red-500 hover:border-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.analysis.summary || item.analysis.category);
                      }}
                      title="Delete item"
                    >
                      <PixelIcon name="close" size={12} />
                    </button>
                  </div>

                  <div className="absolute bottom-1.5 left-1.5">
                    <span className="bg-[#fd91cc] text-[#09318D] font-pixel text-[9px] px-1.5 py-0.5">
                      {item.analysis.category}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="font-pixel text-[11px] text-white truncate">
                    {item.analysis.summary || item.analysis.category}
                  </p>
                  {onStyleInStudio && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStyleItem(item);
                      }}
                      className="w-full mt-2 border border-white/20 hover:border-[#fd91cc] hover:text-[#fd91cc] text-[10px] font-pixel py-1 text-white/80 transition-colors flex items-center justify-center gap-1"
                    >
                      <PixelIcon name="zap" size={10} />
                      <span>STYLE IN STUDIO</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg bg-[#09318D] border-2 border-white text-white">
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm flex items-center gap-2 text-white">
              <PixelIcon name="eye" size={16} className="text-[#fd91cc]" />
              <span>GARMENT DETAILS</span>
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="aspect-[4/3] w-full overflow-hidden bg-black/30 border border-white/20 p-2">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.analysis.summary || selectedItem.analysis.analyzed_garment}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-pixel text-sm text-white">
                      {selectedItem.analysis.summary}
                    </h3>
                    <span className="inline-block mt-1 bg-[#fd91cc] text-[#09318D] font-pixel text-[10px] px-2 py-0.5">
                      {selectedItem.analysis.category}
                    </span>
                  </div>

                  {onStyleInStudio && (
                    <button
                      onClick={() => handleStyleItem(selectedItem)}
                      className="bg-[#fd91cc] text-[#09318D] px-3 py-1.5 font-pixel text-xs hover:bg-white transition-colors flex items-center gap-1.5"
                    >
                      <PixelIcon name="zap" size={14} />
                      <span>STYLE IN STUDIO</span>
                    </button>
                  )}
                </div>

                <div className="border border-white/20 p-3 bg-white/5 space-y-1">
                  <div className="font-pixel text-[10px] text-[#fd91cc]">VISION ANALYSIS</div>
                  <p className="text-white/90 leading-relaxed text-[11px]">
                    {selectedItem.analysis.analyzed_garment}
                  </p>
                </div>

                {pairedGarments.length > 0 && (
                  <div className="space-y-1">
                    <div className="font-pixel text-[10px] text-[#fd91cc]">AI PAIRING HISTORY</div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {pairedGarments.map((g) => (
                        <div
                          key={g.id}
                          className="w-14 h-14 border border-white/20 bg-black/20 p-1 flex-shrink-0"
                          title={g.analysis.summary}
                        >
                          <img
                            src={g.imageUrl}
                            alt="Paired"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
