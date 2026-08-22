import React, { useState, useMemo } from 'react';
import { Place, NeighborhoodCategory } from '../types';
import { DezfulMap } from './DezfulMap';
import { PlacesListView } from './PlacesListView';
import { FilterBottomSheet, FilterState } from './FilterBottomSheet';
import { toPersianDigits } from '../utils/persianUtils';
import { 
  Search, 
  SlidersHorizontal, 
  Map as MapIcon, 
  List as ListIcon, 
  X, 
  Compass, 
  Layers,
  Sparkles,
  MapPin
} from 'lucide-react';

interface FullMapScreenProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  onOpenDetails: (place: Place) => void;
  userCoords: [number, number] | null;
  onRequestUserLocation: () => void;
  savedPlaceIds: string[];
  onToggleSave: (placeId: string) => void;
}

export const FullMapScreen: React.FC<FullMapScreenProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetails,
  userCoords,
  onRequestUserLocation,
  savedPlaceIds,
  onToggleSave,
}) => {
  // View mode: 'map' | 'list'
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Advanced Filters State
  const [filters, setFilters] = useState<FilterState>({
    placeType: 'all',
    isOpenNowOnly: false,
    neighborhoodCategory: 'all',
    hasParking: false,
    hasWomenSection: false,
    hasAblutionArea: false,
    hasWheelchairAccessible: false,
    hasShavadan: false,
    hasQuranClasses: false,
  });

  const handleResetFilters = () => {
    setFilters({
      placeType: 'all',
      isOpenNowOnly: false,
      neighborhoodCategory: 'all',
      hasParking: false,
      hasWomenSection: false,
      hasAblutionArea: false,
      hasWheelchairAccessible: false,
      hasShavadan: false,
      hasQuranClasses: false,
    });
  };

  // Filter logic
  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchNeigh = p.neighborhood.toLowerCase().includes(q);
        const matchAddr = p.address.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchImam = p.imamName ? p.imamName.toLowerCase().includes(q) : false;
        if (!matchName && !matchNeigh && !matchAddr && !matchDesc && !matchImam) {
          return false;
        }
      }

      // 2. Place Type
      if (filters.placeType === 'mosque') {
        if (p.type !== 'mosque' && p.type !== 'historic_mosque') return false;
      } else if (filters.placeType === 'hussainiya') {
        if (p.type !== 'hussainiya') return false;
      } else if (filters.placeType === 'shrine') {
        if (p.type !== 'shrine') return false;
      } else if (filters.placeType === 'historic') {
        if (!p.isHistoric) return false;
      }

      // 3. Open Now
      if (filters.isOpenNowOnly && !p.isOpenNow) {
        return false;
      }

      // 4. Neighborhood Category
      if (filters.neighborhoodCategory !== 'all' && p.neighborhoodCategory !== filters.neighborhoodCategory) {
        return false;
      }

      // 5. Facilities
      if (filters.hasParking && !p.features.parking) return false;
      if (filters.hasWomenSection && !p.features.womenSection) return false;
      if (filters.hasAblutionArea && !p.features.ablutionArea) return false;
      if (filters.hasWheelchairAccessible && !p.features.wheelchairAccessible) return false;
      if (filters.hasShavadan && !p.hasShavadan) return false;
      if (filters.hasQuranClasses && !p.features.quranClasses) return false;

      return true;
    });
  }, [places, searchQuery, filters]);

  const activeFiltersCount = 
    (filters.placeType !== 'all' ? 1 : 0) +
    (filters.isOpenNowOnly ? 1 : 0) +
    (filters.neighborhoodCategory !== 'all' ? 1 : 0) +
    (filters.hasParking ? 1 : 0) +
    (filters.hasWomenSection ? 1 : 0) +
    (filters.hasAblutionArea ? 1 : 0) +
    (filters.hasWheelchairAccessible ? 1 : 0) +
    (filters.hasShavadan ? 1 : 0) +
    (filters.hasQuranClasses ? 1 : 0);

  return (
    <div dir="rtl" className="relative flex flex-col h-[calc(100vh-68px)] md:h-[calc(100vh-32px)] w-full overflow-hidden font-['Vazirmatn',sans-serif]">
      
      {/* 1. FLOATING TOP CONTROLS BAR (SEARCH + VIEW SWITCH + FILTER BUTTON) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 z-[450] flex flex-col sm:flex-row items-center gap-2 pointer-events-auto">
        
        {/* Floating Search Bar */}
        <div className="relative flex-1 w-full flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-stone-200/90 px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#0E7C86] transition-all">
          <Search size={18} className="text-[#0E7C86] shrink-0 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جست‌وجوی مسجد، حسینیه یا محله دزفول..."
            className="w-full bg-transparent text-xs sm:text-sm text-[#1F2430] placeholder-stone-400 focus:outline-hidden py-1"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Action Row: Map/List Toggle Switch + Filters Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          
          {/* MAP / LIST SWITCH (سوییچ نقشه / لیست) */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-stone-200/90 shadow-md flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-[#0E7C86] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapIcon size={14} />
              <span>نقشه</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#0E7C86] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <ListIcon size={14} />
              <span>لیست</span>
              <span className="text-[10px] opacity-80 font-mono bg-white/20 px-1 rounded">
                {toPersianDigits(filteredPlaces.length)}
              </span>
            </button>
          </div>

          {/* FILTER BUTTON WITH ACTIVE BADGE (دکمه فیلترها) */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border shadow-md backdrop-blur-md text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeFiltersCount > 0
                ? 'bg-[#B4552D] text-white border-[#B4552D]'
                : 'bg-white/95 text-stone-700 border-stone-200/90 hover:bg-stone-50'
            }`}
          >
            <SlidersHorizontal size={15} />
            <span>فیلترها</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#B4552D] text-[10px] font-black flex items-center justify-center">
                {toPersianDigits(activeFiltersCount)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 2. ACTIVE FILTERS PILL BAR (WHEN ANY FILTER IS ON) */}
      {(activeFiltersCount > 0 || searchQuery) && (
        <div className="absolute top-[88px] sm:top-[74px] left-2.5 right-2.5 sm:left-4 sm:right-4 z-[440] flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-1">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 bg-[#1F2430]/90 text-white text-[11px] px-2.5 py-1 rounded-full shadow-md shrink-0">
              <span>جستجو: {searchQuery}</span>
              <button onClick={() => setSearchQuery('')} className="hover:text-amber-300">
                <X size={12} />
              </button>
            </span>
          )}

          {filters.placeType !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-[#0E7C86] text-white text-[11px] px-2.5 py-1 rounded-full shadow-md shrink-0">
              <span>نوع: {filters.placeType === 'mosque' ? 'مساجد' : filters.placeType === 'hussainiya' ? 'حسینیه‌ها' : filters.placeType === 'shrine' ? 'بقاع' : 'آثار تاریخی'}</span>
              <button onClick={() => setFilters({ ...filters, placeType: 'all' })} className="hover:text-amber-300">
                <X size={12} />
              </button>
            </span>
          )}

          {filters.isOpenNowOnly && (
            <span className="inline-flex items-center gap-1 bg-emerald-700 text-white text-[11px] px-2.5 py-1 rounded-full shadow-md shrink-0">
              <span>بازِ الان</span>
              <button onClick={() => setFilters({ ...filters, isOpenNowOnly: false })} className="hover:text-amber-300">
                <X size={12} />
              </button>
            </span>
          )}

          {filters.neighborhoodCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-[#B4552D] text-white text-[11px] px-2.5 py-1 rounded-full shadow-md shrink-0">
              <span>محله انتخاب‌شده</span>
              <button onClick={() => setFilters({ ...filters, neighborhoodCategory: 'all' })} className="hover:text-amber-300">
                <X size={12} />
              </button>
            </span>
          )}

          <button
            onClick={handleResetFilters}
            className="text-[11px] font-bold text-stone-700 bg-white/90 px-2 py-1 rounded-full shadow-xs shrink-0 hover:bg-white"
          >
            پاک کردن فیلترها
          </button>
        </div>
      )}

      {/* 3. MAIN CONTENT: FULLSCREEN MAP OR LIST VIEW */}
      <div className="flex-1 w-full h-full relative">
        {viewMode === 'map' ? (
          <DezfulMap
            places={filteredPlaces}
            selectedPlace={selectedPlace}
            onSelectPlace={onSelectPlace}
            onOpenDetails={onOpenDetails}
            userCoords={userCoords}
            onRequestUserLocation={onRequestUserLocation}
            heightClass="h-full w-full rounded-none"
            isFullView={true}
          />
        ) : (
          <div className="h-full overflow-y-auto pt-24 sm:pt-20 pb-20 px-2 sm:px-4 bg-[#F7F3EC]">
            <div className="max-w-4xl mx-auto mb-3 flex items-center justify-between px-2">
              <span className="text-xs font-bold text-stone-700">
                نمایش {toPersianDigits(filteredPlaces.length)} مکان در دزفول
              </span>
              <button
                onClick={() => setViewMode('map')}
                className="text-xs font-bold text-[#0E7C86] flex items-center gap-1 hover:underline"
              >
                <MapIcon size={14} />
                <span>نمایش روی نقشه</span>
              </button>
            </div>

            <PlacesListView
              places={filteredPlaces}
              onSelectPlace={(p) => {
                onSelectPlace(p);
                onOpenDetails(p);
              }}
              userCoords={userCoords}
              savedPlaceIds={savedPlaceIds}
              onToggleSave={onToggleSave}
            />
          </div>
        )}
      </div>

      {/* 4. FILTER BOTTOM SHEET */}
      <FilterBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
        onResetFilters={handleResetFilters}
        resultCount={filteredPlaces.length}
      />
    </div>
  );
};
