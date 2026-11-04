import { useState, useMemo, useCallback, useEffect } from 'react';
import { PixelIcon } from '@/components/icons/PixelIcons';
import { 
  DEMO_PERSONAS, 
  DEMO_GARMENTS, 
  type DemoGarment, 
  type DemoPerson, 
  type GarmentGroup 
} from '@/data/demoData';
import { 
  evaluateOutfit, 
  evaluateOutfitInBrowser, 
  type InferenceResult, 
  type OccasionContext 
} from '@/services/inferenceEngine';
import { removeGarmentBackground } from '@/services/imageProcessing';
import { 
  BOTTOM_CATEGORIES, 
  LAYER_CATEGORIES, 
  ONE_PIECE_CATEGORIES,
  saveRecommendationToHistory,
} from '@/services/recommendationService';
import type { WardrobeItem, OutfitRecommendation } from '@/types';
import { toast } from 'sonner';

interface BrowserDemoProps {
  userWardrobe?: WardrobeItem[];
  equippedGarment?: DemoGarment | null;
  onClearEquipped?: () => void;
  equippedOutfit?: {
    top?: WardrobeItem;
    bottom?: WardrobeItem;
    layer?: WardrobeItem;
    onePiece?: WardrobeItem;
  } | null;
  onClearEquippedOutfit?: () => void;
}

export function BrowserDemo({
  userWardrobe = [],
  equippedGarment = null,
  onClearEquipped,
  equippedOutfit = null,
  onClearEquippedOutfit,
}: BrowserDemoProps) {
  // Model Persona Selection
  const [selectedPerson, setSelectedPerson] = useState<DemoPerson>(DEMO_PERSONAS[0]);

  // Default to a realistic 2-piece base outfit (White Button Down + Jeans)
  const defaultBaseTop = DEMO_GARMENTS.find(g => g.group === 'base_top') || null;
  const defaultBottom = DEMO_GARMENTS.find(g => g.group === 'bottom') || null;

  const [selectedBaseTop, setSelectedBaseTop] = useState<DemoGarment | null>(defaultBaseTop);
  const [selectedBottom, setSelectedBottom] = useState<DemoGarment | null>(defaultBottom);
  const [selectedLayer, setSelectedLayer] = useState<DemoGarment | null>(null);
  const [selectedOnePiece, setSelectedOnePiece] = useState<DemoGarment | null>(null);

  const [activeGarmentTab, setActiveGarmentTab] = useState<GarmentGroup>('base_top');
  const [formalityFilter, setFormalityFilter] = useState<string>('ALL');
  const [rackSearch, setRackSearch] = useState<string>('');
  const [occasion, setOccasion] = useState<OccasionContext['occasion']>('Casual');
  const [temperatureC, setTemperatureC] = useState<number>(31);
  const [viewMode, setViewMode] = useState<'hanger' | 'model'>('hanger');
  const [customWardrobe, setCustomWardrobe] = useState<DemoGarment[]>(DEMO_GARMENTS);
  const [customPersonImage, setCustomPersonImage] = useState<string | null>(null);

  // Weather context reacting to both occasion and selected temperature
  const weatherContext: OccasionContext = useMemo(() => ({
    occasion,
    temperatureC,
    weatherDesc: temperatureC > 32 ? 'Hot & Humid' : (temperatureC < 25 ? 'Pleasant Evening' : 'Chennai Warm'),
  }), [occasion, temperatureC]);

  // Merge user's personal wardrobe items into the customWardrobe rack
  useEffect(() => {
    if (userWardrobe.length > 0) {
      const converted: DemoGarment[] = userWardrobe.map(item => {
        const cat = item.analysis.category;
        let group: GarmentGroup = 'base_top';
        if (BOTTOM_CATEGORIES.has(cat)) group = 'bottom';
        else if (LAYER_CATEGORIES.has(cat)) group = 'layer';
        else if (ONE_PIECE_CATEGORIES.has(cat)) group = 'one_piece';

        return {
          id: `closet-${item.id}`,
          name: item.analysis.summary || cat,
          category: cat,
          group,
          description: item.analysis.analyzed_garment || 'From your wardrobe inventory',
          imageUrl: item.imageUrl,
          attributes: {
            formality: 'Casual',
            fabric: 'Wardrobe',
            season: 'All Weather',
          },
        };
      });

      setCustomWardrobe(prev => {
        const withoutOldCloset = prev.filter(g => !g.id.startsWith('closet-'));
        return [...converted, ...withoutOldCloset];
      });
    }
  }, [userWardrobe]);

  // Handle incoming equipped garment from outside (e.g. WardrobeGallery)
  useEffect(() => {
    if (equippedGarment) {
      handleSelectGarment(equippedGarment);
      setActiveGarmentTab(equippedGarment.group);
      onClearEquipped?.();
    }
  }, [equippedGarment, onClearEquipped]);

  // Handle incoming full outfit from DailyRecommendation
  useEffect(() => {
    if (equippedOutfit) {
      if (equippedOutfit.onePiece) {
        const op: DemoGarment = {
          id: `equipped-${equippedOutfit.onePiece.id}`,
          name: equippedOutfit.onePiece.analysis.summary,
          category: equippedOutfit.onePiece.analysis.category,
          group: 'one_piece',
          description: equippedOutfit.onePiece.analysis.analyzed_garment,
          imageUrl: equippedOutfit.onePiece.imageUrl,
          attributes: { formality: 'Festive', fabric: 'Ethnic', season: 'All Weather' },
        };
        setSelectedOnePiece(op);
        setSelectedBaseTop(null);
        setSelectedBottom(null);
        setSelectedLayer(null);
      } else {
        setSelectedOnePiece(null);
        if (equippedOutfit.top) {
          setSelectedBaseTop({
            id: `equipped-${equippedOutfit.top.id}`,
            name: equippedOutfit.top.analysis.summary,
            category: equippedOutfit.top.analysis.category,
            group: 'base_top',
            description: equippedOutfit.top.analysis.analyzed_garment,
            imageUrl: equippedOutfit.top.imageUrl,
            attributes: { formality: 'Casual', fabric: 'Cotton', season: 'All Weather' },
          });
        }
        if (equippedOutfit.bottom) {
          setSelectedBottom({
            id: `equipped-${equippedOutfit.bottom.id}`,
            name: equippedOutfit.bottom.analysis.summary,
            category: equippedOutfit.bottom.analysis.category,
            group: 'bottom',
            description: equippedOutfit.bottom.analysis.analyzed_garment,
            imageUrl: equippedOutfit.bottom.imageUrl,
            attributes: { formality: 'Casual', fabric: 'Denim', season: 'All Weather' },
          });
        }
        if (equippedOutfit.layer) {
          setSelectedLayer({
            id: `equipped-${equippedOutfit.layer.id}`,
            name: equippedOutfit.layer.analysis.summary,
            category: equippedOutfit.layer.analysis.category,
            group: 'layer',
            description: equippedOutfit.layer.analysis.analyzed_garment,
            imageUrl: equippedOutfit.layer.imageUrl,
            attributes: { formality: 'Formal', fabric: 'Wool', season: 'All Weather' },
          });
        } else {
          setSelectedLayer(null);
        }
      }
      toast.success('Outfit loaded into Studio');
      onClearEquippedOutfit?.();
    }
  }, [equippedOutfit, onClearEquippedOutfit]);

  // Real-time model inference state
  const [inference, setInference] = useState<InferenceResult>(() =>
    evaluateOutfitInBrowser(
      selectedBaseTop,
      selectedBottom,
      selectedLayer,
      selectedOnePiece,
      selectedPerson,
      weatherContext
    )
  );
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    setIsEvaluating(true);

    evaluateOutfit(
      selectedBaseTop,
      selectedBottom,
      selectedLayer,
      selectedOnePiece,
      selectedPerson,
      weatherContext
    ).then((res) => {
      if (isCurrent) {
        setInference(res);
        setIsEvaluating(false);
      }
    }).catch(() => {
      if (isCurrent) setIsEvaluating(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [selectedBaseTop, selectedBottom, selectedLayer, selectedOnePiece, selectedPerson, weatherContext]);

  // Garment counts by category
  const garmentCounts = useMemo(() => {
    const counts: Record<GarmentGroup, number> = {
      base_top: 0,
      bottom: 0,
      layer: 0,
      one_piece: 0,
    };
    for (const g of customWardrobe) {
      if (counts[g.group] !== undefined) {
        counts[g.group]++;
      }
    }
    return counts;
  }, [customWardrobe]);

  // Filter garments by current category tab, formality filter, and search
  const displayedGarments = useMemo(() => {
    return customWardrobe.filter(g => {
      if (g.group !== activeGarmentTab) return false;
      if (formalityFilter !== 'ALL' && g.attributes.formality.toUpperCase() !== formalityFilter) {
        return false;
      }
      if (rackSearch.trim()) {
        const q = rackSearch.toLowerCase().trim();
        return (
          g.name.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [customWardrobe, activeGarmentTab, formalityFilter, rackSearch]);

  // Single-click selection handler with immediate state updates
  const handleSelectGarment = (garment: DemoGarment) => {
    if (garment.group === 'one_piece') {
      if (selectedOnePiece?.id === garment.id) {
        setSelectedOnePiece(null);
      } else {
        setSelectedOnePiece(garment);
        setSelectedBaseTop(null);
        setSelectedBottom(null);
      }
    } else if (garment.group === 'base_top') {
      setSelectedOnePiece(null);
      if (selectedBaseTop?.id === garment.id) {
        setSelectedBaseTop(null);
      } else {
        setSelectedBaseTop(garment);
        if (!selectedBottom) {
          const firstBot = customWardrobe.find(g => g.group === 'bottom');
          if (firstBot) setSelectedBottom(firstBot);
        }
      }
    } else if (garment.group === 'bottom') {
      setSelectedOnePiece(null);
      if (selectedBottom?.id === garment.id) {
        setSelectedBottom(null);
      } else {
        setSelectedBottom(garment);
        if (!selectedBaseTop) {
          const firstTop = customWardrobe.find(g => g.group === 'base_top');
          if (firstTop) setSelectedBaseTop(firstTop);
        }
      }
    } else if (garment.group === 'layer') {
      if (selectedLayer?.id === garment.id) {
        setSelectedLayer(null);
      } else {
        setSelectedLayer(garment);
      }
    }
  };

  // Quick slot cycle helpers
  const handleCycleTop = () => {
    const tops = customWardrobe.filter(g => g.group === 'base_top');
    if (tops.length <= 1) return;
    setSelectedOnePiece(null);
    const currIdx = tops.findIndex(t => t.id === selectedBaseTop?.id);
    const nextIdx = (currIdx + 1) % tops.length;
    setSelectedBaseTop(tops[nextIdx]);
  };

  const handleCycleBottom = () => {
    const bottoms = customWardrobe.filter(g => g.group === 'bottom');
    if (bottoms.length <= 1) return;
    setSelectedOnePiece(null);
    const currIdx = bottoms.findIndex(b => b.id === selectedBottom?.id);
    const nextIdx = (currIdx + 1) % bottoms.length;
    setSelectedBottom(bottoms[nextIdx]);
  };

  const handleCycleLayer = () => {
    const layers = customWardrobe.filter(g => g.group === 'layer');
    if (layers.length === 0) return;
    if (!selectedLayer) {
      setSelectedLayer(layers[0]);
    } else {
      const currIdx = layers.findIndex(l => l.id === selectedLayer.id);
      if (currIdx === layers.length - 1) {
        setSelectedLayer(null); // Toggle off after cycling through all
      } else {
        setSelectedLayer(layers[currIdx + 1]);
      }
    }
  };

  // One-click styling presets for instant satisfaction
  const applyPreset = (presetName: 'casual' | 'formal' | 'ethnic' | 'festive') => {
    setSelectedOnePiece(null);
    setSelectedLayer(null);

    if (presetName === 'casual') {
      setOccasion('Casual');
      const top = customWardrobe.find(g => g.group === 'base_top' && (g.name.includes('Button Down') || g.name.includes('Shirt') || g.category === 'Shirt'));
      const bot = customWardrobe.find(g => g.group === 'bottom' && (g.name.includes('Jeans') || g.category === 'Jeans'));
      if (top) setSelectedBaseTop(top);
      if (bot) setSelectedBottom(bot);
    } else if (presetName === 'formal') {
      setOccasion('Formal');
      const top = customWardrobe.find(g => g.group === 'base_top' && (g.name.includes('Button Down') || g.name.includes('Slip') || g.category === 'Shirt'));
      const bot = customWardrobe.find(g => g.group === 'bottom' && (g.name.includes('Trousers') || g.category === 'Pants'));
      const lay = customWardrobe.find(g => g.group === 'layer');
      if (top) setSelectedBaseTop(top);
      if (bot) setSelectedBottom(bot);
      if (lay) setSelectedLayer(lay);
    } else if (presetName === 'ethnic') {
      setOccasion('Casual');
      const isMen = selectedPerson.id === 'rahul';
      const top = isMen
        ? customWardrobe.find(g => g.group === 'base_top' && (g.name.includes('Kurta') || g.category === 'Kurta'))
        : customWardrobe.find(g => g.group === 'base_top' && (g.name.includes('Kurti') || g.category === 'Kurti'));
      const bot = isMen
        ? customWardrobe.find(g => g.group === 'bottom' && (g.name.includes('Pajama') || g.category === 'Pajama' || g.category === 'Churidar'))
        : customWardrobe.find(g => g.group === 'bottom' && (g.name.includes('Palazzo') || g.category === 'Palazzo'));
      if (top) setSelectedBaseTop(top);
      if (bot) setSelectedBottom(bot);
    } else if (presetName === 'festive') {
      setOccasion('Festive');
      const isMen = selectedPerson.id === 'rahul';
      if (isMen) {
        const top = customWardrobe.find(g => g.group === 'base_top' && (g.name.includes('Kurta') || g.category === 'Kurta'));
        const bot = customWardrobe.find(g => g.group === 'bottom' && (g.category === 'Churidar' || g.category === 'Pajama'));
        const lay = customWardrobe.find(g => g.group === 'layer' && (g.name.includes('Nehru') || g.category === 'Jacket'));
        if (top) setSelectedBaseTop(top);
        if (bot) setSelectedBottom(bot);
        if (lay) setSelectedLayer(lay);
        setSelectedOnePiece(null);
      } else {
        const onePiece = customWardrobe.find(g => g.group === 'one_piece' && g.category === 'Saree');
        if (onePiece) {
          setSelectedOnePiece(onePiece);
          setSelectedBaseTop(null);
          setSelectedBottom(null);
        }
      }
    }
  };

  // Random pairing
  const handleRandomPair = useCallback(() => {
    const tops = customWardrobe.filter(g => g.group === 'base_top');
    const bottoms = customWardrobe.filter(g => g.group === 'bottom');
    const layers = customWardrobe.filter(g => g.group === 'layer');

    setSelectedOnePiece(null);
    if (tops.length && bottoms.length) {
      const randTop = tops[Math.floor(Math.random() * tops.length)];
      const randBot = bottoms[Math.floor(Math.random() * bottoms.length)];
      setSelectedBaseTop(randTop);
      setSelectedBottom(randBot);
      
      if (Math.random() > 0.7 && layers.length) {
        setSelectedLayer(layers[Math.floor(Math.random() * layers.length)]);
      } else {
        setSelectedLayer(null);
      }
    }
  }, [customWardrobe]);

  // Clear current outfit
  const handleClearOutfit = () => {
    setSelectedBaseTop(null);
    setSelectedBottom(null);
    setSelectedLayer(null);
    setSelectedOnePiece(null);
  };

  // Explicit user-triggered evaluation
  const handleRunEvaluation = () => {
    if (!hasOutfit) {
      toast.error('Select garments first');
      return;
    }
    setIsEvaluating(true);
    evaluateOutfit(
      selectedBaseTop,
      selectedBottom,
      selectedLayer,
      selectedOnePiece,
      selectedPerson,
      weatherContext
    ).then((res) => {
      setInference(res);
      setIsEvaluating(false);
      toast.success(`Evaluated look: ${res.score}/100 - ${res.verdict}`);
    }).catch(() => {
      setIsEvaluating(false);
    });
  };

  // Save current look to Daily Outfits history
  const handleSaveToLookbook = () => {
    if (!selectedOnePiece && (!selectedBaseTop || !selectedBottom)) {
      toast.error('Pick a top and bottom first');
      return;
    }

    const outfitId = `saved-${Date.now()}`;
    const rec: OutfitRecommendation = {
      id: outfitId,
      outfitType: selectedOnePiece ? 'one_piece' : (selectedLayer ? 'three_piece' : 'two_piece'),
      topGarment: selectedBaseTop ? {
        id: selectedBaseTop.id,
        imageUrl: selectedBaseTop.imageUrl,
        uploadedAt: new Date(),
        analysis: {
          category: selectedBaseTop.category,
          summary: selectedBaseTop.name,
          analyzed_garment: selectedBaseTop.description,
        }
      } : undefined,
      bottomGarment: selectedBottom ? {
        id: selectedBottom.id,
        imageUrl: selectedBottom.imageUrl,
        uploadedAt: new Date(),
        analysis: {
          category: selectedBottom.category,
          summary: selectedBottom.name,
          analyzed_garment: selectedBottom.description,
        }
      } : undefined,
      layerGarment: selectedLayer ? {
        id: selectedLayer.id,
        imageUrl: selectedLayer.imageUrl,
        uploadedAt: new Date(),
        analysis: {
          category: selectedLayer.category,
          summary: selectedLayer.name,
          analyzed_garment: selectedLayer.description,
        }
      } : undefined,
      standaloneGarment: selectedOnePiece ? {
        id: selectedOnePiece.id,
        imageUrl: selectedOnePiece.imageUrl,
        uploadedAt: new Date(),
        analysis: {
          category: selectedOnePiece.category,
          summary: selectedOnePiece.name,
          analyzed_garment: selectedOnePiece.description,
        }
      } : undefined,
      colorLogic: inference.colorAnalysis,
      silhouetteLogic: inference.silhouetteAnalysis,
      occasion: occasion,
      weather: `${weatherContext.temperatureC}°C, ${weatherContext.weatherDesc}`,
      createdAt: new Date(),
    };

    saveRecommendationToHistory(rec);
    toast.success('Outfit logged to wear history');
  };


  // Custom garment upload handler
  const handleGarmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      const cleanImageUrl = await removeGarmentBackground(b64);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const newGarment: DemoGarment = {
        id: `custom-${Date.now()}`,
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        category: activeGarmentTab === 'layer' ? 'Layer / Jacket' : (activeGarmentTab === 'base_top' ? 'Custom Top' : (activeGarmentTab === 'bottom' ? 'Custom Bottom' : 'Custom One-Piece')),
        group: activeGarmentTab,
        description: 'User uploaded piece',
        imageUrl: cleanImageUrl,
        attributes: {
          formality: 'Casual',
          fabric: 'Custom',
          season: 'All Weather',
        },
      };
      setCustomWardrobe(prev => [newGarment, ...prev]);
      handleSelectGarment(newGarment);
      toast.success(`Equipped ${newGarment.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Keyboard shortcut listener [R, 1, 2, 3, 4]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'r' || e.key === 'R') {
        handleRandomPair();
      } else if (e.key === '1') {
        setActiveGarmentTab('base_top');
      } else if (e.key === '2') {
        setActiveGarmentTab('bottom');
      } else if (e.key === '3') {
        setActiveGarmentTab('layer');
      } else if (e.key === '4') {
        setActiveGarmentTab('one_piece');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRandomPair]);

  const hasOutfit = Boolean(selectedOnePiece || selectedBaseTop || selectedBottom);

  // Score styling logic
  const scoreColor = inference.score >= 85 
    ? 'text-[#10B981]' 
    : inference.score >= 70 
    ? 'text-[#38BDF8]' 
    : inference.score >= 50 
    ? 'text-[#F59E0B]' 
    : 'text-[#F43F5E]';

  const scoreBarWidth = `${Math.min(100, Math.max(8, inference.score))}%`;

  return (
    <div className="space-y-6">
      
      {/* 1. Interactive Master Toolbar */}
      <div className="border border-white/20 bg-white/5 p-4 rounded-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: Quick Try Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-pixel text-[11px] text-[#fd91cc] mr-1">QUICK TRY:</span>
          {[
            { id: 'casual' as const, label: 'Weekend Casual' },
            { id: 'formal' as const, label: 'Office Formal' },
            { id: 'ethnic' as const, label: 'Ethnic Co-ord' },
            { id: 'festive' as const, label: 'Silk Saree' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className="px-2.5 py-1 text-xs font-sans border border-white/20 text-white/90 hover:border-[#fd91cc] hover:text-[#fd91cc] hover:bg-white/5 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Right: Controls & Context */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Avatar Switcher */}
          <div className="flex items-center border border-white/20 bg-black/20 text-xs">
            <span className="px-2 py-1 font-pixel text-[10px] text-white/50">MODEL:</span>
            {DEMO_PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPerson(p);
                  setCustomPersonImage(null);
                }}
                className={`px-2 py-1 font-pixel text-[11px] transition-colors ${
                  selectedPerson.id === p.id && !customPersonImage
                    ? 'bg-white text-[#09318D]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Occasion Mode Selector */}
          <div className="flex items-center border border-white/20 bg-black/20 text-xs">
            <span className="px-2 py-1 font-pixel text-[10px] text-white/50">EVENT:</span>
            {(['Casual', 'Formal', 'Party', 'Festive'] as const).map(occ => (
              <button
                key={occ}
                onClick={() => setOccasion(occ)}
                className={`px-2.5 py-1 font-pixel text-[11px] transition-colors ${
                  occasion === occ
                    ? 'bg-[#fd91cc] text-[#09318D]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>

          {/* Climate Presets */}
          <div className="flex items-center border border-white/20 bg-black/20 text-xs">
            <span className="px-2 py-1 font-pixel text-[10px] text-white/50">TEMP:</span>
            {[
              { label: '22°', val: 22 },
              { label: '31°', val: 31 },
              { label: '36°', val: 36 },
            ].map(t => (
              <button
                key={t.val}
                onClick={() => setTemperatureC(t.val)}
                className={`px-2 py-1 font-pixel text-[11px] transition-colors ${
                  temperatureC === t.val
                    ? 'bg-white text-[#09318D]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Random Fit [R] */}
          <button
            onClick={handleRandomPair}
            className="px-3 py-1.5 text-xs font-pixel border border-white/30 text-white hover:border-[#fd91cc] hover:text-[#fd91cc] flex items-center gap-1.5 transition-colors"
            title="Randomize fit (press R)"
          >
            <PixelIcon name="redo" size={14} />
            <span>SHUFFLE [R]</span>
          </button>

          {/* Clear Fit */}
          {hasOutfit && (
            <button
              onClick={handleClearOutfit}
              className="px-2 py-1 text-xs font-pixel text-white/50 hover:text-red-400 transition-colors"
              title="Clear outfit slots"
            >
              CLEAR
            </button>
          )}

        </div>
      </div>

      {/* 2. Interactive 2-Pane Dressing Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT PANE (5 cols): The Dressing Board & Stylist Score */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="border border-white/20 bg-white/5 p-4 rounded-sm space-y-4">
            
            {/* Header: View Toggle & Status */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isEvaluating ? 'bg-amber-400 animate-ping' : 'bg-[#10B981]'}`} />
                <span className="font-pixel text-xs text-white">DRESSING MANNEQUIN</span>
              </div>

              {/* View Mode Toggle: Clean Deck vs Avatar Silhouette */}
              <div className="flex items-center border border-white/20 text-[10px] font-pixel">
                <button
                  onClick={() => setViewMode('hanger')}
                  className={`px-2 py-0.5 transition-colors ${viewMode === 'hanger' ? 'bg-[#fd91cc] text-[#09318D]' : 'text-white/70 hover:text-white'}`}
                >
                  OUTFIT DECK
                </button>
                <button
                  onClick={() => setViewMode('model')}
                  className={`px-2 py-0.5 transition-colors ${viewMode === 'model' ? 'bg-[#fd91cc] text-[#09318D]' : 'text-white/70 hover:text-white'}`}
                >
                  ON MODEL
                </button>
              </div>
            </div>

            {/* Visual Mannequin Stage */}
            <div className="relative min-h-[380px] w-full bg-black/40 border border-white/10 p-4 flex flex-col justify-between overflow-hidden">
              
              {/* Optional On-Model Silhouette Background */}
              {viewMode === 'model' && (
                <div className="absolute inset-0 pointer-events-none opacity-25">
                  <img
                    src={customPersonImage || selectedPerson.fullBodyUrl}
                    alt={selectedPerson.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-[#09318D] border border-white/20 text-[9px] font-pixel text-white/80">
                    {selectedPerson.name} ({selectedPerson.height})
                  </div>
                </div>
              )}

              {/* In-Flight Scanning Shimmer */}
              {isEvaluating && (
                <div className="absolute inset-x-0 top-0 h-1 bg-[#fd91cc] animate-pulse z-20" />
              )}

              {/* Outfit Slots Container */}
              {selectedOnePiece ? (
                /* One-Piece Mode */
                <div className="relative z-10 my-auto p-4 bg-black/70 backdrop-blur-sm border border-[#fd91cc] space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-pixel text-[10px] text-[#fd91cc]">STANDALONE ENSEMBLE</span>
                    <button
                      onClick={() => setSelectedOnePiece(null)}
                      className="text-white/50 hover:text-red-400 font-pixel text-[10px]"
                    >
                      REMOVE [×]
                    </button>
                  </div>
                  <div className="h-52 w-full flex items-center justify-center">
                    <img
                      src={selectedOnePiece.imageUrl}
                      alt={selectedOnePiece.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white truncate">{selectedOnePiece.name}</div>
                    <div className="text-[11px] text-white/60">{selectedOnePiece.category} · {selectedOnePiece.attributes.formality}</div>
                  </div>
                </div>
              ) : (
                /* 2-Piece / 3-Piece Coordinated Stack */
                <div className="relative z-10 space-y-3 my-auto">
                  
                  {/* Top Garment Card Slot */}
                  {selectedBaseTop ? (
                    <div className="p-3 bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-between gap-3 group">
                      <div className="w-16 h-16 bg-black/40 border border-white/10 flex-shrink-0 p-1 flex items-center justify-center">
                        <img
                          src={selectedBaseTop.imageUrl}
                          alt={selectedBaseTop.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-pixel text-[9px] text-[#fd91cc] flex items-center gap-1.5">
                          <span>TOP PIECE</span>
                          <span className="text-white/40">·</span>
                          <span className="text-white/70">{selectedBaseTop.category}</span>
                        </div>
                        <div className="text-xs font-medium text-white truncate mt-0.5">{selectedBaseTop.name}</div>
                        <div className="text-[10px] text-white/60">{selectedBaseTop.attributes.formality}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleCycleTop}
                          className="p-1.5 border border-white/20 text-white/70 hover:border-[#fd91cc] hover:text-[#fd91cc] transition-colors"
                          title="Cycle to next top"
                          aria-label="Cycle to next top"
                        >
                          <PixelIcon name="redo" size={12} />
                        </button>
                        <button
                          onClick={() => setSelectedBaseTop(null)}
                          className="p-1.5 border border-white/20 text-white/50 hover:text-red-400 hover:border-red-400 transition-colors"
                          title="Clear top"
                          aria-label="Clear top"
                        >
                          <PixelIcon name="close" size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setActiveGarmentTab('base_top')}
                      className="cursor-pointer p-4 border border-dashed border-white/30 hover:border-[#fd91cc] bg-black/20 text-center transition-colors group"
                    >
                      <div className="font-pixel text-xs text-white/60 group-hover:text-[#fd91cc] flex items-center justify-center gap-2">
                        <span className="font-pixel text-sm leading-none">+</span>
                        <span>PICK A TOP FROM THE RACK</span>
                      </div>
                    </div>
                  )}

                  {/* Optional Outerwear Layer */}
                  {selectedLayer ? (
                    <div className="p-2.5 bg-[#fd91cc]/15 backdrop-blur-md border border-[#fd91cc] flex items-center justify-between gap-3">
                      <div className="w-14 h-14 bg-black/40 border border-white/10 flex-shrink-0 p-1 flex items-center justify-center">
                        <img
                          src={selectedLayer.imageUrl}
                          alt={selectedLayer.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-pixel text-[9px] text-[#fd91cc]">OUTERWEAR LAYER</div>
                        <div className="text-xs font-medium text-white truncate">{selectedLayer.name}</div>
                        <div className="text-[10px] text-white/70">{selectedLayer.category}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleCycleLayer}
                          className="p-1.5 border border-white/20 text-white/70 hover:border-[#fd91cc] hover:text-[#fd91cc]"
                          title="Cycle layer"
                          aria-label="Cycle layer"
                        >
                          <PixelIcon name="redo" size={12} />
                        </button>
                        <button
                          onClick={() => setSelectedLayer(null)}
                          className="p-1.5 border border-white/20 text-white/50 hover:text-red-400"
                          title="Remove layer"
                          aria-label="Remove layer"
                        >
                          <PixelIcon name="close" size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <button
                        onClick={handleCycleLayer}
                        className="text-[10px] font-pixel text-white/40 hover:text-[#fd91cc] transition-colors"
                      >
                        + ADD OUTER LAYER (BLAZER/JACKET)
                      </button>
                    </div>
                  )}

                  {/* Bottom Garment Card Slot */}
                  {selectedBottom ? (
                    <div className="p-3 bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-between gap-3 group">
                      <div className="w-16 h-16 bg-black/40 border border-white/10 flex-shrink-0 p-1 flex items-center justify-center">
                        <img
                          src={selectedBottom.imageUrl}
                          alt={selectedBottom.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-pixel text-[9px] text-[#fd91cc] flex items-center gap-1.5">
                          <span>BOTTOM PIECE</span>
                          <span className="text-white/40">·</span>
                          <span className="text-white/70">{selectedBottom.category}</span>
                        </div>
                        <div className="text-xs font-medium text-white truncate mt-0.5">{selectedBottom.name}</div>
                        <div className="text-[10px] text-white/60">{selectedBottom.attributes.formality}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleCycleBottom}
                          className="p-1.5 border border-white/20 text-white/70 hover:border-[#fd91cc] hover:text-[#fd91cc] transition-colors"
                          title="Cycle to next bottom"
                          aria-label="Cycle to next bottom"
                        >
                          <PixelIcon name="redo" size={12} />
                        </button>
                        <button
                          onClick={() => setSelectedBottom(null)}
                          className="p-1.5 border border-white/20 text-white/50 hover:text-red-400 hover:border-red-400 transition-colors"
                          title="Clear bottom"
                          aria-label="Clear bottom"
                        >
                          <PixelIcon name="close" size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setActiveGarmentTab('bottom')}
                      className="cursor-pointer p-4 border border-dashed border-white/30 hover:border-[#fd91cc] bg-black/20 text-center transition-colors group"
                    >
                      <div className="font-pixel text-xs text-white/60 group-hover:text-[#fd91cc] flex items-center justify-center gap-2">
                        <span className="font-pixel text-sm leading-none">+</span>
                        <span>PICK A BOTTOM FROM THE RACK</span>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* Climate Context Footnote */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-pixel text-white/60 border-t border-white/10 pt-2 mt-2">
                <span>SIMULATED: {weatherContext.temperatureC}°C ({weatherContext.weatherDesc})</span>
                <span className="text-[#fd91cc]">{occasion.toUpperCase()} SETTING</span>
              </div>

            </div>

            {/* High-Impact Primary Action Button */}
            <button
              onClick={handleRunEvaluation}
              disabled={!hasOutfit || isEvaluating}
              className={`w-full py-4 px-6 font-pixel text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2.5 transition-all duration-150 border-2 active:scale-[0.98] shadow-lg cursor-pointer ${
                isEvaluating
                  ? 'bg-amber-400 text-black border-white cursor-wait animate-pulse'
                  : 'bg-[#fd91cc] hover:bg-white text-[#09318D] border-white shadow-[#fd91cc]/25 hover:shadow-[#fd91cc]/50 font-bold'
              }`}
            >
              {isEvaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#09318D] border-t-transparent animate-spin rounded-full" />
                  <span>EVALUATING PAIRING WITH QWEN3-VL 2B...</span>
                </>
              ) : (
                <>
                  <PixelIcon name="zap" size={16} />
                  <span>EVALUATE PAIRING WITH AI STYLIST</span>
                </>
              )}
            </button>

            {/* AI Stylist Compatibility Verdict */}
            <div className="border border-white/20 bg-black/30 p-4 rounded-sm space-y-3">
              
              {/* Score Meter Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-pixel text-[11px] text-[#fd91cc] flex items-center gap-1.5">
                    <PixelIcon name="sparkles" size={14} />
                    <span>TASK B COMPATIBILITY</span>
                  </div>
                  <div className="font-pixel text-2xl tracking-wider flex items-baseline gap-1">
                    <span className={scoreColor}>{isEvaluating ? '...' : inference.score}</span>
                    <span className="text-xs text-white/50">/100</span>
                  </div>
                </div>

                {/* Animated Visual Gauge */}
                <div className="w-full h-2 bg-white/10 rounded-none overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      inference.score >= 85 
                        ? 'bg-[#10B981]' 
                        : inference.score >= 70 
                        ? 'bg-[#38BDF8]' 
                        : inference.score >= 50 
                        ? 'bg-[#F59E0B]' 
                        : 'bg-[#F43F5E]'
                    }`}
                    style={{ width: isEvaluating ? '50%' : scoreBarWidth }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-pixel ${scoreColor}`}>
                    {isEvaluating ? 'Model computing synergy...' : inference.verdict}
                  </span>
                  <span className="font-mono text-white/50">
                    {inference.latencyMs}ms on HF Space
                  </span>
                </div>
              </div>

              {/* Model Styling Rationale */}
              <div className="space-y-2 border-t border-white/10 pt-3 text-xs">
                <div>
                  <span className="font-pixel text-[10px] text-white/50 block">COLOR & HARMONY RATIONALE</span>
                  <p className="text-white/90 text-[11px] leading-relaxed mt-0.5">
                    {inference.colorAnalysis}
                  </p>
                </div>

                <div>
                  <span className="font-pixel text-[10px] text-white/50 block">SILHOUETTE & OCCASION</span>
                  <p className="text-white/80 text-[11px] leading-relaxed mt-0.5">
                    {inference.silhouetteAnalysis}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <button
                  onClick={handleSaveToLookbook}
                  className="w-full py-3 px-4 bg-[#10B981] hover:bg-emerald-400 text-black font-pixel text-xs tracking-wider transition-all active:scale-[0.98] flex items-center justify-center gap-2 font-bold shadow-md cursor-pointer"
                >
                  <PixelIcon name="check" size={16} />
                  <span>WEAR TODAY · LOG TO CALENDAR</span>
                </button>
                <button
                  onClick={handleRandomPair}
                  className="w-full border border-white/30 hover:border-[#fd91cc] hover:text-[#fd91cc] p-2.5 font-pixel text-xs text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PixelIcon name="redo" size={14} />
                  <span>SHUFFLE NEXT LOOK</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT PANE (7 cols): Responsive Interactive Wardrobe Rack */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="border border-white/20 bg-white/5 p-4 rounded-sm space-y-4">
            
            {/* Category Nav Tabs with Counts */}
            <div className="flex items-center justify-between border-b border-white/20 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: 'base_top' as GarmentGroup, label: 'Tops', count: garmentCounts.base_top, keybind: '1' },
                  { key: 'bottom' as GarmentGroup, label: 'Bottoms', count: garmentCounts.bottom, keybind: '2' },
                  { key: 'layer' as GarmentGroup, label: 'Outerwear', count: garmentCounts.layer, keybind: '3' },
                  { key: 'one_piece' as GarmentGroup, label: 'One-Piece', count: garmentCounts.one_piece, keybind: '4' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveGarmentTab(tab.key)}
                    className={`px-3 py-1.5 text-xs font-pixel transition-colors flex items-center gap-1.5 ${
                      activeGarmentTab === tab.key
                        ? 'bg-white text-[#09318D]'
                        : 'border border-white/20 text-white/80 hover:border-white/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-[10px] opacity-75">({tab.count})</span>
                    <span className="text-[9px] opacity-50 hidden sm:inline">[{tab.keybind}]</span>
                  </button>
                ))}
              </div>

              {/* Upload Item Link */}
              <label className="cursor-pointer text-xs font-pixel text-[#fd91cc] border border-[#fd91cc]/40 px-2.5 py-1 hover:bg-[#fd91cc]/10 transition-colors flex items-center gap-1.5">
                <PixelIcon name="upload" size={12} />
                <span>UPLOAD PIECE</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleGarmentUpload}
                />
              </label>
            </div>

            {/* Filter Bar: Formality Chips & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              {/* Formality Chips */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
                {['ALL', 'CASUAL', 'FORMAL', 'FESTIVE'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFormalityFilter(f)}
                    className={`px-2.5 py-1 text-[11px] font-pixel transition-colors whitespace-nowrap ${
                      formalityFilter === f
                        ? 'bg-[#fd91cc]/20 border border-[#fd91cc] text-[#fd91cc]'
                        : 'border border-white/20 text-white/60 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Text Search */}
              <div className="relative min-w-[200px]">
                <input
                  type="text"
                  placeholder={`Search ${activeGarmentTab.replace('_', ' ')}...`}
                  value={rackSearch}
                  onChange={e => setRackSearch(e.target.value)}
                  className="w-full bg-black/30 border border-white/20 px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#fd91cc]"
                />
                {rackSearch && (
                  <button
                    onClick={() => setRackSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

            </div>

            {/* Garments Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
              {displayedGarments.map(g => {
                const isEquipped =
                  selectedBaseTop?.id === g.id ||
                  selectedBottom?.id === g.id ||
                  selectedLayer?.id === g.id ||
                  selectedOnePiece?.id === g.id;

                return (
                  <div
                    key={g.id}
                    onClick={() => handleSelectGarment(g)}
                    className={`group cursor-pointer border p-2.5 bg-black/25 hover:bg-white/10 transition-all duration-150 relative flex flex-col justify-between ${
                      isEquipped
                        ? 'border-[#fd91cc] bg-[#fd91cc]/15 shadow-sm ring-1 ring-[#fd91cc]'
                        : 'border-white/20 hover:border-white/50'
                    }`}
                  >
                    {/* Equipped Badge */}
                    {isEquipped && (
                      <div className="absolute top-1.5 right-1.5 bg-[#fd91cc] text-[#09318D] font-pixel text-[9px] px-1.5 py-0.5 leading-none flex items-center gap-1 z-10">
                        <PixelIcon name="check" size={10} />
                        <span>IN FIT</span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="aspect-square w-full mb-2 bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center p-2 relative">
                      <img
                        src={g.imageUrl}
                        alt={g.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-150"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[#fd91cc]/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="font-pixel text-[10px] bg-[#09318D] px-2 py-1 text-white border border-white/30 shadow-md">
                          {isEquipped ? 'REMOVE' : 'EQUIP'}
                        </span>
                      </div>
                    </div>

                    {/* Garment Details */}
                    <div>
                      <div className="text-xs font-medium text-white truncate group-hover:text-[#fd91cc] transition-colors">
                        {g.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-white/60 mt-1">
                        <span className="truncate">{g.category}</span>
                        <span className="font-mono text-[9px] border border-white/20 px-1 py-0.2">
                          {g.attributes.formality}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayedGarments.length === 0 && (
                <div className="col-span-full py-12 text-center text-white/50 font-pixel text-xs border border-dashed border-white/20">
                  NO GARMENTS FOUND IN THIS FILTER
                </div>
              )}
            </div>

          </div>

          {/* 3. Research Telemetry & Paper Proofs (Collapsible) */}
          <details className="border border-white/20 bg-white/5 p-3 rounded-sm text-xs font-mono group">
            <summary className="cursor-pointer font-pixel text-[11px] text-white/70 hover:text-[#fd91cc] flex items-center justify-between">
              <span>MODEL VERIFICATION METRICS (IEEE DOCUMENT 11681836)</span>
              <span className="text-[10px] text-white/40 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2 text-[11px] text-white/80">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="border border-white/10 p-2 bg-black/20">
                  <span className="text-white/50 block text-[9px]">ENGINE</span>
                  <span className="text-white font-bold">{inference.engine}</span>
                </div>
                <div className="border border-white/10 p-2 bg-black/20">
                  <span className="text-white/50 block text-[9px]">LATENCY</span>
                  <span className="text-[#10B981]">{inference.latencyMs} ms</span>
                </div>
                <div className="border border-white/10 p-2 bg-black/20">
                  <span className="text-white/50 block text-[9px]">OUTFIT TYPE</span>
                  <span className="text-white">{inference.outfitType}</span>
                </div>
                <div className="border border-white/10 p-2 bg-black/20">
                  <span className="text-white/50 block text-[9px]">PROBABILITY</span>
                  <span className="text-white">{(inference.score / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="border border-white/10 p-2.5 bg-black/20">
                <span className="text-white/50 block text-[9px] mb-1">STYLING DIRECTIVE</span>
                <p className="text-white/90 leading-relaxed text-[11px]">
                  {inference.stylistTip}
                </p>
              </div>

              {/* Upload custom model photo */}
              <div className="flex items-center justify-between pt-1 text-[10px]">
                <span className="text-white/50">Custom full-body model photo:</span>
                <label className="text-[#fd91cc] cursor-pointer hover:underline">
                  <span>Upload custom avatar</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => setCustomPersonImage(r.result as string);
                    r.readAsDataURL(f);
                  }} />
                </label>
              </div>
            </div>
          </details>

        </div>

      </div>

    </div>
  );
}
