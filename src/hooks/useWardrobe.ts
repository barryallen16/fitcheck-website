import { useState, useCallback, useEffect } from 'react';
import type { Garment, GarmentAttribute } from '@/types';

const WARDROBE_STORAGE_KEY = 'fitcheck_wardrobe';

export function useWardrobe() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wardrobe from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(WARDROBE_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setGarments(parsed.map((g: Garment) => ({
          ...g,
          uploadedAt: new Date(g.uploadedAt)
        })));
      } catch (e) {
        console.error('Failed to parse wardrobe:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save wardrobe to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(WARDROBE_STORAGE_KEY, JSON.stringify(garments));
    }
  }, [garments, isLoading]);

  const addGarment = useCallback((
    imageUrl: string,
    attributes: GarmentAttribute,
    caption: string
  ): Garment => {
    const newGarment: Garment = {
      id: `garment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUrl,
      attributes,
      caption,
      uploadedAt: new Date(),
    };

    setGarments(prev => [newGarment, ...prev]);
    return newGarment;
  }, []);

  const removeGarment = useCallback((id: string) => {
    setGarments(prev => prev.filter(g => g.id !== id));
  }, []);

  const getGarmentById = useCallback((id: string): Garment | undefined => {
    return garments.find(g => g.id === id);
  }, [garments]);

  const getGarmentsByCategory = useCallback((category: string): Garment[] => {
    return garments.filter(g => g.attributes.category === category);
  }, [garments]);

  const getGarmentsByOccasion = useCallback((occasion: string): Garment[] => {
    return garments.filter(g => 
      g.attributes.occasions.some(o => 
        o.toLowerCase().includes(occasion.toLowerCase())
      )
    );
  }, [garments]);

  const getGarmentsByColor = useCallback((color: string): Garment[] => {
    return garments.filter(g => 
      g.attributes.color_primary.toLowerCase().includes(color.toLowerCase())
    );
  }, [garments]);

  const getTops = useCallback((): Garment[] => {
    return garments.filter(g => {
      const type = g.attributes.specific_type.toLowerCase();
      return type.includes('kurti') || 
             type.includes('shirt') || 
             type.includes('top') || 
             type.includes('blouse') ||
             type.includes('t-shirt') ||
             type.includes('tunic');
    });
  }, [garments]);

  const getBottoms = useCallback((): Garment[] => {
    return garments.filter(g => {
      const type = g.attributes.specific_type.toLowerCase();
      return type.includes('pant') || 
             type.includes('jean') || 
             type.includes('skirt') || 
             type.includes('legging') ||
             type.includes('sharara') ||
             type.includes('palazzo') ||
             type.includes('dhoti') ||
             type.includes('salwar');
    });
  }, [garments]);

  const getAccessories = useCallback((): Garment[] => {
    return garments.filter(g => g.attributes.category === 'Accessory');
  }, [garments]);

  const getIndianEthnic = useCallback((): Garment[] => {
    return garments.filter(g => g.attributes.category === 'Indian ethnic');
  }, [garments]);

  const getWestern = useCallback((): Garment[] => {
    return garments.filter(g => g.attributes.category === 'Western');
  }, [garments]);

  const getStats = useCallback(() => {
    return {
      total: garments.length,
      indianEthnic: getIndianEthnic().length,
      western: getWestern().length,
      accessories: getAccessories().length,
      tops: getTops().length,
      bottoms: getBottoms().length,
    };
  }, [garments, getIndianEthnic, getWestern, getAccessories, getTops, getBottoms]);

  const clearWardrobe = useCallback(() => {
    setGarments([]);
  }, []);

  return {
    garments,
    isLoading,
    addGarment,
    removeGarment,
    getGarmentById,
    getGarmentsByCategory,
    getGarmentsByOccasion,
    getGarmentsByColor,
    getTops,
    getBottoms,
    getAccessories,
    getIndianEthnic,
    getWestern,
    getStats,
    clearWardrobe,
  };
}
