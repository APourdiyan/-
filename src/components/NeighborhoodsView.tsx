import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { Place, Neighborhood, NeighborhoodCategory } from '../types';
import { DEZFUL_NEIGHBORHOODS } from '../data/dezfulData';
import { 
  toPersianDigits, 
  getPlaceTypeName, 
  calculateDistance, 
  formatDistance, 
  getNavigationLinks 
} from '../utils/persianUtils';
import {
  MapPin,
  Navigation,
  Bookmark,
  Landmark,
  Compass,
  Sparkles,
  ChevronDown,
  Building2,
  Phone,
  Clock,
  Car,
  Users,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Info,
  Maximize2,
  Flame,
  Check,
  Eye
} from 'lucide-react';

interface NeighborhoodsViewProps {
  places: Place[];
  userCoords: [number, number] | null;
  savedPlaceIds: string[];
  onToggleSave: (placeId: string) => void;
  onSelectPlace: (place: Place) => void;
  selectedCategory: NeighborhoodCategory | null;
  onSelectCategory: (cat: NeighborhoodCategory | null) => void;
}

type InnerFilter = 'all' | 'open_now' | 'historic' | 'women_section' | 'parking';

export const NeighborhoodsView: React.FC<NeighborhoodsViewProps> = ({
  places,
  userCoords,
  savedPlaceIds,
  onToggleSave,
  onSelectPlace,
  selectedCategory,
  onSelectCategory,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const listSectionRef = useRef<HTMLDivElement>(null);

  const [activeInnerFilter, setActiveInnerFilter] = useState<InnerFilter>('all');

  // Find currently active neighborhood object
  const activeNeighborhood = useMemo(() => {
    return DEZFUL_NEIGHBORHOODS.find((nh) => nh.category === selectedCategory) || null;
  }, [selectedCategory]);

  // Leaflet Map Initialization & Interactive Zone Drawing
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [32.3880, 48.4010],
        zoom: 13.5,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        minZoom: 12,
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    layersGroup.clearLayers();

    // 1. Draw Neighborhood Colored Polygons (نواحی رنگی محله‌ها)
    DEZFUL_NEIGHBORHOODS.forEach((nh) => {
      const isSelected = selectedCategory === nh.category;
      
      const polygon = L.polygon(nh.polygon, {
        color: nh.color,
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.8,
        fillColor: nh.color,
        fillOpacity: isSelected ? 0.38 : 0.18,
        dashArray: isSelected ? undefined : '5, 5',
      });

      polygon.bindTooltip(
        `<div class="font-['Vazirmatn'] text-xs font-bold text-stone-900 text-right px-1" dir="rtl">
          <div class="flex items-center gap-1.5">
            <span style="background-color: ${nh.color}" class="w-2.5 h-2.5 rounded-full inline-block"></span>
            <span>${nh.name}</span>
          </div>
          <div class="text-[10px] text-stone-600 font-medium mt-0.5">${nh.oneLiner}</div>
        </div>`,
        { permanent: false, direction: 'top', className: 'dezful-map-tooltip' }
      );

      polygon.on('click', () => {
        onSelectCategory(nh.category);
        setTimeout(() => {
          if (listSectionRef.current) {
            listSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      });

      polygon.addTo(layersGroup);

      // Label DivIcon inside the zone on the map
      const labelIcon = L.divIcon({
        className: 'nh-map-label',
        html: `
          <div style="border-color: ${nh.color}; ${
            isSelected 
              ? `background-color: ${nh.color}; color: white; box-shadow: 0 4px 12px ${nh.color}60;` 
              : 'background-color: rgba(255,255,255,0.95); color: #1F2430;'
          }" 
               class="px-2.5 py-1 rounded-xl text-[11px] font-black shadow-md border flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-transform hover:scale-105">
            <span class="w-2 h-2 rounded-full ${isSelected ? 'bg-white' : ''}" style="${!isSelected ? `background-color: ${nh.color};` : ''}"></span>
            <span>${nh.categoryName}</span>
          </div>
        `,
        iconSize: [110, 26],
        iconAnchor: [55, 13],
      });

      const labelMarker = L.marker(nh.coordinates, { icon: labelIcon });
      labelMarker.on('click', () => {
        onSelectCategory(nh.category);
        setTimeout(() => {
          if (listSectionRef.current) {
            listSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      });
      labelMarker.addTo(layersGroup);
    });

    // 2. Add Pins for Places in Selected Category (or highlight them)
    const activePlaces = selectedCategory 
      ? places.filter(p => p.neighborhoodCategory === selectedCategory)
      : places;

    activePlaces.forEach((place) => {
      const pinColor = place.type === 'hussainiya' ? '#B4552D' : place.type === 'shrine' ? '#B38B1C' : '#0E7C86';
      
      const placeIcon = L.divIcon({
        className: 'place-nh-pin',
        html: `
          <div style="background-color: ${pinColor};" 
               class="w-6 h-6 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform text-[11px]">
            ${place.type === 'hussainiya' ? '🏴' : '🕌'}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(place.coordinates, { icon: placeIcon });
      marker.bindPopup(`
        <div class="font-['Vazirmatn'] text-right p-1.5" dir="rtl">
          <div class="flex items-center gap-1 mb-1">
            <span style="background-color: ${pinColor}" class="w-2 h-2 rounded-full inline-block"></span>
            <h4 class="font-black text-xs text-stone-900">${place.name}</h4>
          </div>
          <p class="text-[10px] text-stone-600">${place.address}</p>
        </div>
      `);
      marker.on('click', () => {
        onSelectPlace(place);
      });
      marker.addTo(layersGroup);
    });

    // Fly to center of selected neighborhood if chosen
    if (selectedCategory && activeNeighborhood) {
      map.flyTo(activeNeighborhood.coordinates, 14.5, { duration: 0.8 });
    } else {
      map.flyTo([32.3880, 48.4010], 13.5, { duration: 0.8 });
    }

  }, [selectedCategory, activeNeighborhood, places]);

  // Filter and sort places for the selected neighborhood
  const placesForSelectedCategory = useMemo(() => {
    if (!selectedCategory) return [];

    let list = places.filter((p) => p.neighborhoodCategory === selectedCategory);

    // Apply inner filter chips
    if (activeInnerFilter === 'open_now') {
      list = list.filter((p) => p.isOpenNow);
    } else if (activeInnerFilter === 'historic') {
      list = list.filter((p) => p.isHistoric);
    } else if (activeInnerFilter === 'women_section') {
      list = list.filter((p) => p.features.womenSection);
    } else if (activeInnerFilter === 'parking') {
      list = list.filter((p) => p.features.parking);
    }

    // Sort by distance to user if location available
    if (userCoords) {
      list.sort((a, b) => {
        const distA = calculateDistance(userCoords[0], userCoords[1], a.coordinates[0], a.coordinates[1]);
        const distB = calculateDistance(userCoords[0], userCoords[1], b.coordinates[0], b.coordinates[1]);
        return distA - distB;
      });
    }

    return list;
  }, [places, selectedCategory, activeInnerFilter, userCoords]);

  return (
    <div className="w-full space-y-6 pb-10 font-['Vazirmatn',sans-serif]" dir="rtl">
      
      {/* 1. TOP HEADER & INTERACTIVE MINI MAP (بالای صفحه: نقشهٔ کوچک دزفول با ناحیه‌های رنگیِ محله‌ها) */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
        
        {/* Title & Local Guide Intro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-[#B4552D] animate-pulse" />
              <h1 className="text-lg sm:text-2xl font-black text-[#1F2430]">
                نقشه و راهنمای محله‌های دزفول
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-medium">
              پیمایش نقشه‌محور پهنه‌های پنج‌گانهٔ دزفول، شناخت هویت سنتی کوچه‌ها و شناسنامه اماکن هر محله
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <span className="text-xs font-bold text-stone-600 bg-[#FAF7F2] px-3 py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5">
              <Layers size={14} className="text-[#0E7C86]" />
              <span>{toPersianDigits(DEZFUL_NEIGHBORHOODS.length)} پهنهٔ شهری و هویتی</span>
            </span>
          </div>
        </div>

        {/* The Leaflet Mini Map of Dezful with 5 colored zones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <Compass size={15} className="text-[#B4552D]" />
              <span>پهنه‌های پنج‌گانه روی نقشه دزفول:</span>
            </span>
            <span className="text-[11px] text-stone-500 font-medium hidden sm:inline-block">
              روی محدوده هر محله در نقشه کلیک کنید تا مساجد آن نمایش داده شود
            </span>
          </div>

          {/* Map Container */}
          <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-stone-300 shadow-inner z-0">
            <div ref={mapContainerRef} className="w-full h-full" />
            
            {/* Map Legend & Quick Zone Buttons */}
            <div className="absolute bottom-2.5 right-2.5 left-2.5 z-[400] bg-white/95 backdrop-blur-md rounded-2xl p-2 border border-stone-200/90 shadow-md flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {DEZFUL_NEIGHBORHOODS.map((nh) => {
                  const isSelected = selectedCategory === nh.category;
                  return (
                    <button
                      key={nh.id}
                      onClick={() => {
                        onSelectCategory(nh.category);
                        setTimeout(() => {
                          if (listSectionRef.current) {
                            listSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 150);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#1F2430] text-white shadow-xs scale-105 ring-2 ring-stone-900/20' 
                          : 'bg-[#FAF7F2] text-stone-700 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: nh.color }}
                      />
                      <span>{nh.categoryName}</span>
                    </button>
                  );
                })}
              </div>

              {selectedCategory && (
                <button
                  onClick={() => onSelectCategory(null)}
                  className="text-[11px] font-black text-[#B4552D] hover:underline shrink-0 px-2 cursor-pointer"
                >
                  نمایش کل شهر ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. NEIGHBORHOOD CARDS GRID (زیر نقشه: کارتهای محله) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#B4552D]/10 flex items-center justify-center text-[#B4552D]">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-[#1F2430]">
                کارت‌های معرفی محله‌های دزفول
              </h2>
              <p className="text-[11px] text-stone-500">
                یک محله را انتخاب کنید تا فهرست اماکن، مسافت‌ها و مشخصات آن در بخش زیرین باز شود
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-stone-500 bg-white px-2.5 py-1 rounded-xl border border-stone-200 hidden sm:inline-block">
            {toPersianDigits(DEZFUL_NEIGHBORHOODS.length)} پهنه هویتی
          </span>
        </div>

        {/* 5 Distinct Cards for the 5 dezful neighborhoods */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEZFUL_NEIGHBORHOODS.map((nh) => {
            const isSelected = selectedCategory === nh.category;

            return (
              <div
                key={nh.id}
                id={`neighborhood-card-${nh.category}`}
                onClick={() => {
                  onSelectCategory(isSelected ? null : nh.category);
                  setTimeout(() => {
                    if (!isSelected && listSectionRef.current) {
                      listSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 150);
                }}
                className={`group relative rounded-3xl p-4 sm:p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'bg-white border-2 shadow-lg ring-4'
                    : 'bg-white hover:bg-[#FAF7F2] border-stone-200/90 shadow-2xs hover:shadow-md'
                }`}
                style={{
                  borderColor: isSelected ? nh.color : undefined,
                  boxShadow: isSelected ? `0 12px 28px -6px ${nh.color}35` : undefined,
                }}
              >
                {/* Top Accent Color Stripe */}
                <div
                  className="absolute top-0 right-0 left-0 h-1.5"
                  style={{ backgroundColor: nh.color }}
                />

                <div>
                  {/* Name + Category Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: nh.color }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                      <h3 className="font-black text-base text-[#1F2430] group-hover:text-stone-950 leading-tight">
                        {nh.name}
                      </h3>
                    </div>

                    <span
                      className="text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: `${nh.color}15`,
                        color: nh.color,
                      }}
                    >
                      {nh.categoryName}
                    </span>
                  </div>

                  {/* ONE-LINER INFORMAL DESCRIPTION (یک خط توضیح عرفی) */}
                  <p className="text-xs text-stone-700 leading-relaxed font-semibold mb-3">
                    «{nh.oneLiner}»
                  </p>
                </div>

                {/* 3 COUNTERS: تعداد مسجد / تعداد حسینیه / تعداد اثر تاریخی */}
                <div className="pt-3 border-t border-stone-100 mt-2 space-y-2.5">
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    
                    {/* Counter 1: تعداد مسجد */}
                    <div className="bg-[#FAF7F2] p-2 rounded-2xl border border-stone-200/80 group-hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-stone-500 block mb-0.5">مسجد</span>
                      <span className="text-xs sm:text-sm font-black text-[#0E7C86]">
                        {toPersianDigits(nh.mosquesCount)}
                      </span>
                    </div>

                    {/* Counter 2: تعداد حسینیه */}
                    <div className="bg-[#FAF7F2] p-2 rounded-2xl border border-stone-200/80 group-hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-stone-500 block mb-0.5">حسینیه</span>
                      <span className="text-xs sm:text-sm font-black text-[#B4552D]">
                        {toPersianDigits(nh.hussainiyasCount)}
                      </span>
                    </div>

                    {/* Counter 3: تعداد اثر تاریخی */}
                    <div className="bg-[#FAF7F2] p-2 rounded-2xl border border-stone-200/80 group-hover:bg-white transition-colors">
                      <span className="text-[10px] font-bold text-stone-500 block mb-0.5">اثر تاریخی</span>
                      <span className="text-xs sm:text-sm font-black text-[#B38B1C]">
                        {toPersianDigits(nh.historicCount)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Select / Open Cue */}
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-stone-400 font-medium truncate max-w-[170px]">
                      {nh.highlight}
                    </span>
                    <span
                      className="font-black shrink-0 flex items-center gap-0.5 transition-transform group-hover:-translate-x-1"
                      style={{ color: nh.color }}
                    >
                      <span>{isSelected ? 'بستن فهرست' : 'مشاهده اماکن'}</span>
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. EXPANDED SECTION: لیست مکان‌های محله با چیپ‌های فیلتر و مرتب‌سازی بر اساس فاصله */}
      {selectedCategory && activeNeighborhood && (
        <section 
          ref={listSectionRef}
          className="bg-white rounded-3xl p-4 sm:p-6 border-2 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 space-y-4"
          style={{ borderColor: `${activeNeighborhood.color}40` }}
        >
          {/* A. Local Guide Narrative (روایت صمیمی راهنمای محلی دانا) */}
          <div 
            className="p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 relative overflow-hidden"
            style={{ 
              backgroundColor: `${activeNeighborhood.color}08`, 
              borderColor: `${activeNeighborhood.color}30` 
            }}
          >
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{ backgroundColor: activeNeighborhood.color }}
            >
              <Info size={20} />
            </div>

            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-black text-stone-900">
                  روایت راهنمای محلی از «{activeNeighborhood.name}»
                </span>
                <span 
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: activeNeighborhood.color }}
                >
                  {toPersianDigits(placesForSelectedCategory.length)} مکان در دسترس
                </span>
              </div>
              <p className="text-stone-700 leading-relaxed font-medium">
                «{activeNeighborhood.guideTip}»
              </p>
            </div>
          </div>

          {/* B. Filter Chips (بازِ الان / تاریخی / بانوان / پارکینگ) */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                onClick={() => setActiveInnerFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  activeInnerFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                همه ({toPersianDigits(places.filter(p => p.neighborhoodCategory === selectedCategory).length)})
              </button>

              <button
                onClick={() => setActiveInnerFilter('open_now')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  activeInnerFilter === 'open_now'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Clock size={13} />
                <span>بازِ الان</span>
              </button>

              <button
                onClick={() => setActiveInnerFilter('historic')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  activeInnerFilter === 'historic'
                    ? 'bg-[#B4552D] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Landmark size={13} />
                <span>تاریخی و ملی</span>
              </button>

              <button
                onClick={() => setActiveInnerFilter('women_section')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  activeInnerFilter === 'women_section'
                    ? 'bg-[#0E7C86] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Users size={13} />
                <span>بخش بانوان</span>
              </button>

              <button
                onClick={() => setActiveInnerFilter('parking')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                  activeInnerFilter === 'parking'
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Car size={13} />
                <span>دارای پارکینگ</span>
              </button>
            </div>

            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            >
              بستن این بخش ✕
            </button>
          </div>

          {/* C. Distance Sorted Places List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {placesForSelectedCategory.length > 0 ? (
              placesForSelectedCategory.map((place) => {
                const isSaved = savedPlaceIds.includes(place.id);
                const navLinks = getNavigationLinks(place.coordinates[0], place.coordinates[1], place.name);

                let distanceStr = '';
                if (userCoords) {
                  const dist = calculateDistance(
                    userCoords[0],
                    userCoords[1],
                    place.coordinates[0],
                    place.coordinates[1]
                  );
                  distanceStr = formatDistance(dist);
                }

                return (
                  <div
                    key={place.id}
                    id={`place-item-${place.id}`}
                    className="bg-[#FAF7F2] rounded-2xl p-3.5 border border-stone-200 hover:border-stone-300 transition-all flex flex-col justify-between shadow-2xs hover:shadow-sm group"
                  >
                    <div>
                      {/* Top: Image + Info */}
                      <div className="flex items-start gap-3 mb-2.5">
                        <div 
                          onClick={() => onSelectPlace(place)}
                          className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-200 cursor-pointer"
                        >
                          <img
                            src={place.images[0]}
                            alt={place.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {place.isOpenNow && (
                            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                              place.type === 'hussainiya'
                                ? 'bg-[#B4552D]/15 text-[#B4552D]'
                                : place.type === 'shrine'
                                ? 'bg-[#B38B1C]/15 text-[#B38B1C]'
                                : 'bg-[#0E7C86]/15 text-[#0E7C86]'
                            }`}>
                              {getPlaceTypeName(place.type)}
                            </span>

                            {distanceStr && (
                              <span className="text-[10px] font-bold text-[#B4552D] bg-[#B4552D]/10 px-2 py-0.5 rounded-md font-mono">
                                {distanceStr}
                              </span>
                            )}
                          </div>

                          <h4 
                            onClick={() => onSelectPlace(place)}
                            className="font-black text-sm text-[#1F2430] hover:text-[#0E7C86] truncate cursor-pointer"
                          >
                            {place.name}
                          </h4>

                          <p className="text-[11px] text-stone-500 truncate mt-0.5">
                            {place.address}
                          </p>

                          {place.hasShavadan && (
                            <span className="inline-block text-[10px] font-bold text-[#B4552D] bg-white border border-[#B4552D]/20 px-1.5 py-0.2 rounded mt-1">
                              دارای شوادون سنتی دزفول
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Controls: Digital Passport & Direct Navigation */}
                    <div className="pt-2.5 border-t border-stone-200/80 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => onSelectPlace(place)}
                        className="bg-white hover:bg-stone-100 text-stone-900 font-bold px-3 py-1.5 rounded-xl border border-stone-300 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span>شناسنامه و ساعت نماز</span>
                        <ChevronDown size={13} className="-rotate-90" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={navLinks.neshan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#B4552D] hover:bg-[#963E19] text-white font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs transition-colors"
                          title="مسیریابی با نشان"
                        >
                          <Navigation size={12} />
                          <span className="text-[11px]">مسیریابی</span>
                        </a>

                        <button
                          onClick={() => onToggleSave(place.id)}
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            isSaved
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                          }`}
                          title="نشان کردن"
                        >
                          <Bookmark size={13} fill={isSaved ? '#D97706' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center bg-[#FAF7F2] rounded-2xl border border-stone-200">
                <p className="text-xs text-stone-600 font-bold">
                  مکانی با فیلتر انتخاب‌شده در این محله یافت نشد.
                </p>
                <button
                  onClick={() => setActiveInnerFilter('all')}
                  className="mt-2 text-xs text-[#0E7C86] font-bold underline cursor-pointer"
                >
                  نمایش همه مساجد این محله
                </button>
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
};
