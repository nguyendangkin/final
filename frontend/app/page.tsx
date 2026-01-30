'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search, Crosshair, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useMapPersistence } from '@/components/providers';
import { Spinner } from '@/components/ui';
import type { Location, Category } from '@/types';

export default function HomePage() {
  const {
    locations,
    categories,
    latitude,
    longitude,
    gpsLoading,
    getCurrentPosition,
    setFilteredLocations,
    setMapCenter,
  } = useMapPersistence();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  // Compute parent and child categories
  const parentCategories = useMemo(() =>
    categories.filter(cat => !cat.parentId),
    [categories]
  );

  const getChildren = useMemo(() => {
    const childrenMap = new Map<string, Category[]>();
    categories.forEach(cat => {
      if (cat.parentId) {
        const existing = childrenMap.get(cat.parentId) || [];
        childrenMap.set(cat.parentId, [...existing, cat]);
      }
    });
    return (parentId: string) => childrenMap.get(parentId) || [];
  }, [categories]);

  // Get locations directly attached to a parent category (not via child)
  const getParentLocations = useMemo(() => {
    return (parentId: string) => locations.filter(loc => loc.categoryId === parentId);
  }, [locations]);

  // Filter locations and sync with provider
  useEffect(() => {
    const filtered = locations.filter((loc) => {
      const matchesSearch = !searchQuery ||
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.note?.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedLocationId) {
        return matchesSearch && loc.id === selectedLocationId;
      }
      const matchesCategory = !selectedCategory || loc.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredLocations(filtered);
  }, [locations, searchQuery, selectedCategory, selectedLocationId, setFilteredLocations]);

  const handleCenterOnMe = () => {
    getCurrentPosition();
    if (latitude && longitude) {
      setMapCenter([latitude, longitude]);
    }
  };

  const handleParentClick = (cat: Category) => {
    const children = getChildren(cat.id);
    const parentLocs = getParentLocations(cat.id);
    if (children.length > 0 || parentLocs.length > 0) {
      if (expandedParent === cat.id) {
        setExpandedParent(null);
      } else {
        setExpandedParent(cat.id);
        setSelectedCategory(null);
        setSelectedLocationId(null);
      }
    } else {
      setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
      setExpandedParent(null);
      setSelectedLocationId(null);
    }
  };

  const handleChildClick = (cat: Category) => {
    setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
    setSelectedLocationId(null);
  };

  const handleLocationBadgeClick = (loc: Location) => {
    setSelectedLocationId(selectedLocationId === loc.id ? null : loc.id);
    setSelectedCategory(null);
  };

  const handleAllClick = () => {
    setSelectedCategory(null);
    setExpandedParent(null);
    setSelectedLocationId(null);
  };

  const expandedChildren = expandedParent ? getChildren(expandedParent) : [];
  const expandedLocations = expandedParent ? getParentLocations(expandedParent) : [];

  return (
    <div className="h-[calc(100vh-56px)] relative" style={{ pointerEvents: 'none' }}>
      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-10" style={{ pointerEvents: 'auto' }}>
        <div className="bg-white rounded-xl shadow-lg p-2 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Tìm kiếm địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Category Filter - Parent Badges */}
      <div className="absolute top-20 left-4 right-4 z-10" style={{ pointerEvents: 'auto' }}>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={handleAllClick}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategory && !expandedParent
              ? 'bg-teal-500 text-white'
              : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
              }`}
          >
            Tất cả
          </button>
          {parentCategories.map((cat) => {
            const hasChildren = getChildren(cat.id).length > 0;
            const hasDirectLocations = getParentLocations(cat.id).length > 0;
            const isExpandable = hasChildren || hasDirectLocations;
            const isExpanded = expandedParent === cat.id;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleParentClick(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${isSelected || isExpanded
                  ? 'text-white'
                  : 'bg-white text-gray-600 shadow-sm hover:bg-gray-50'
                  }`}
                style={{
                  backgroundColor: isSelected || isExpanded ? (cat.iconColor || '#0d9488') : undefined,
                }}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
                {isExpandable && (
                  isExpanded
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                )}
              </button>
            );
          })}
        </div>

        {/* Child Badges + Location Badges (when parent is expanded) */}
        {(expandedChildren.length > 0 || expandedLocations.length > 0) && (
          <div className="flex gap-2 overflow-x-auto pb-2 mt-2 scrollbar-hide">
            {/* Child Category Badges */}
            {expandedChildren.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleChildClick(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isSelected
                    ? 'text-white'
                    : 'bg-white/90 text-gray-600 shadow-sm hover:bg-white'
                    }`}
                  style={{
                    backgroundColor: isSelected ? (cat.iconColor || '#0d9488') : undefined,
                  }}
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </button>
              );
            })}
            {/* Location Badges */}
            {expandedLocations.map((loc) => {
              const isSelected = selectedLocationId === loc.id;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleLocationBadgeClick(loc)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${isSelected
                    ? 'bg-teal-500 text-white'
                    : 'bg-amber-50 text-amber-700 shadow-sm hover:bg-amber-100 border border-amber-200'
                    }`}
                >
                  <MapPin className="w-3 h-3" />
                  {loc.name}
                </button>
              );
            })}
          </div>
        )}
      </div>


      {/* Center on Me Button */}
      <button
        onClick={handleCenterOnMe}
        disabled={gpsLoading}
        className="absolute bottom-6 left-6 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
        style={{ pointerEvents: 'auto' }}
        title="Vị trí của tôi"
      >
        {gpsLoading ? (
          <Spinner size="sm" />
        ) : (
          <Crosshair className="w-5 h-5 text-teal-600" />
        )}
      </button>

      {/* Map is rendered at layout level by MapPersistenceProvider */}
      {/* This div is transparent, allowing the persistent map to show through */}
    </div>
  );
}

