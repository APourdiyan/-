import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Place } from '../types';
import { 
  toPersianDigits, 
  getPlaceTypeName, 
  calculateDistance, 
  formatDistance, 
  getNextPrayerInfo, 
  getNavigationLinks 
} from '../utils/persianUtils';
import { 
  Navigation, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  Clock, 
  ArrowLeft, 
  X, 
  Star, 
  CheckCircle2, 
  Building2,
  Sparkles,
  Compass,
  Layers
} from 'lucide-react';
import { NavigationOptionsModal } from './NavigationOptionsModal';

interface DezfulMapProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place | null) => void;
  onOpenDetails?: (place: Place) => void;
  userCoords: [number, number] | null;
  isFullView?: boolean;
  onToggleFullView?: () => void;
  onRequestUserLocation?: () => void;
  heightClass?: string;
}

interface ClusterGroup {
  id: string;
  center: [number, number];
  places: Place[];
}

export const DezfulMap: React.FC<DezfulMapProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetails,
  userCoords,
  isFullView = false,
  onToggleFullView,
  onRequestUserLocation,
  heightClass = 'h-[380px] md:h-[500px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const clusterMarkersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  
  const [currentZoom, setCurrentZoom] = useState<number>(14);
  const [navPlace, setNavPlace] = useState<Place | null>(null);

  // 1. PIN CREATORS
  // Individual Pin Creator with Historic Star badge
  const createIndividualPinIcon = (place: Place, isSelected: boolean) => {
    let bgColor = '#0E7C86'; // Mosque Turquoise
    let ringColor = 'rgba(14, 124, 134, 0.35)';
    let symbol = '🕌';
    let typeBadge = 'مسجد';

    if (place.type === 'hussainiya') {
      bgColor = '#B4552D'; // Hussainiya Terracotta Brick
      ringColor = 'rgba(180, 85, 45, 0.35)';
      symbol = '🏴';
      typeBadge = 'حسینیه';
    } else if (place.type === 'shrine') {
      bgColor = '#B38B1C'; // Shrine Gold
      ringColor = 'rgba(179, 139, 28, 0.35)';
      symbol = '✨';
      typeBadge = 'بقعه';
    } else if (place.type === 'historic_mosque') {
      bgColor = '#0A6B74';
      ringColor = 'rgba(10, 107, 116, 0.35)';
      symbol = '🏛️';
      typeBadge = 'مسجد کهن';
    }

    const starBadge = place.isHistoric
      ? `<div style="background-color: #FFB800; border: 1.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.25);" 
              class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-stone-900 font-bold z-10">
           ★
         </div>`
      : '';

    const selectedClasses = isSelected
      ? 'scale-125 z-50 ring-4 ring-[#FFB800] shadow-2xl'
      : 'hover:scale-110';

    return L.divIcon({
      className: 'custom-dezful-single-pin',
      html: `
        <div class="relative flex flex-col items-center group transition-transform duration-200 ${selectedClasses}" style="direction: rtl;">
          ${starBadge}
          <div style="background-color: ${bgColor}; box-shadow: 0 4px 14px ${ringColor};" 
               class="w-9 h-9 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg cursor-pointer">
            <span class="text-sm select-none">${symbol}</span>
          </div>
          <div style="border-top-color: ${bgColor};" 
               class="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-[1px]">
          </div>
          <span style="background-color: #1F2430;" class="mt-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-md whitespace-nowrap opacity-90">
            ${place.name.length > 14 ? place.name.slice(0, 12) + '...' : place.name}
          </span>
        </div>
      `,
      iconSize: [44, 52],
      iconAnchor: [22, 36],
      popupAnchor: [0, -34],
    });
  };

  // Cluster Pin Creator
  const createClusterPinIcon = (cluster: ClusterGroup) => {
    const count = cluster.places.length;
    const hasHistoric = cluster.places.some((p) => p.isHistoric);
    const hasMosque = cluster.places.some((p) => p.type === 'mosque' || p.type === 'historic_mosque');
    const hasHussainiya = cluster.places.some((p) => p.type === 'hussainiya');

    let bgGradient = 'linear-gradient(135deg, #0E7C86 0%, #B4552D 100%)';
    if (!hasHussainiya) bgGradient = 'linear-gradient(135deg, #0E7C86 0%, #08555C 100%)';
    if (!hasMosque && hasHussainiya) bgGradient = 'linear-gradient(135deg, #B4552D 0%, #8A3715 100%)';

    const starBadge = hasHistoric
      ? `<div style="background-color: #FFB800; border: 1.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.25);" 
              class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-stone-900 font-bold z-10">
           ★
         </div>`
      : '';

    return L.divIcon({
      className: 'custom-dezful-cluster-pin',
      html: `
        <div class="relative flex flex-col items-center group transition-transform duration-200 hover:scale-110 cursor-pointer" style="direction: rtl;">
          ${starBadge}
          <div style="background: ${bgGradient}; box-shadow: 0 6px 18px rgba(180, 85, 45, 0.35);" 
               class="w-11 h-11 rounded-full flex flex-col items-center justify-center text-white border-2 border-white shadow-xl ring-2 ring-white/50 animate-in zoom-in">
            <span class="text-xs font-black leading-none">${toPersianDigits(count)}</span>
            <span class="text-[8px] font-bold leading-none opacity-90">مکان</span>
          </div>
          <div style="border-top-color: #B4552D;" 
               class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] -mt-[1px]">
          </div>
        </div>
      `,
      iconSize: [48, 54],
      iconAnchor: [24, 38],
    });
  };

  // User Location Pin Creator
  const createUserLocationIcon = () => {
    return L.divIcon({
      className: 'user-location-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-9 h-9 bg-blue-500/25 rounded-full animate-ping"></div>
          <div class="w-5 h-5 bg-blue-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  // 2. INITIALIZE MAP
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Dezful Center
    const dezfulCenter: [number, number] = [32.3842, 48.4018];

    const map = L.map(mapContainerRef.current, {
      center: dezfulCenter,
      zoom: 14,
      zoomControl: false,
    });

    // Base Tile Layer (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control in bottom left
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Track Zoom
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Dismiss snap card on clicking empty map area
    map.on('click', (e) => {
      // If clicked outside marker
      if ((e.originalEvent.target as HTMLElement)?.closest('.leaflet-marker-icon')) return;
      onSelectPlace(null);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. SPATIAL CLUSTERING ALGORITHM
  // Groups nearby places when zoom < 15, smoothly expands to individual pins when zoomed in!
  const clusteredData = useMemo(() => {
    if (currentZoom >= 15) {
      // Zoomed in: render all places as individual pins
      return { clusters: [], singles: places };
    }

    // Distance threshold in km for clustering based on current zoom
    const thresholdKm = currentZoom <= 12 ? 1.5 : currentZoom === 13 ? 0.9 : 0.45;

    const clusters: ClusterGroup[] = [];
    const singles: Place[] = [];
    const visited = new Set<string>();

    places.forEach((place, i) => {
      if (visited.has(place.id)) return;

      const group: Place[] = [place];
      visited.add(place.id);

      places.forEach((otherPlace, j) => {
        if (i === j || visited.has(otherPlace.id)) return;
        const dist = calculateDistance(
          place.coordinates[0],
          place.coordinates[1],
          otherPlace.coordinates[0],
          otherPlace.coordinates[1]
        );

        if (dist <= thresholdKm) {
          group.push(otherPlace);
          visited.add(otherPlace.id);
        }
      });

      if (group.length > 1) {
        // Calculate average cluster center
        const avgLat = group.reduce((acc, p) => acc + p.coordinates[0], 0) / group.length;
        const avgLng = group.reduce((acc, p) => acc + p.coordinates[1], 0) / group.length;
        clusters.push({
          id: `cluster-${place.id}-${group.length}`,
          center: [avgLat, avgLng],
          places: group,
        });
      } else {
        singles.push(place);
      }
    });

    return { clusters, singles };
  }, [places, currentZoom]);

  // 4. RENDER MARKERS (CLUSTERS & SINGLES)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing individual markers
    Object.values(markersRef.current).forEach((marker: L.Marker) => {
      marker.remove();
    });
    markersRef.current = {};

    // Clear existing cluster markers
    clusterMarkersRef.current.forEach((marker) => marker.remove());
    clusterMarkersRef.current = [];

    // Render Cluster Pins
    clusteredData.clusters.forEach((cluster) => {
      const clusterIcon = createClusterPinIcon(cluster);
      const marker = L.marker(cluster.center, { icon: clusterIcon }).addTo(map);

      // On clicking cluster, fly to cluster and zoom in to expand pins!
      marker.on('click', () => {
        const nextZoom = Math.min(map.getZoom() + 2, 17);
        map.flyTo(cluster.center, nextZoom, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
      });

      clusterMarkersRef.current.push(marker);
    });

    // Render Single Pins
    clusteredData.singles.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const icon = createIndividualPinIcon(place, isSelected);
      const marker = L.marker(place.coordinates, { icon }).addTo(map);

      marker.on('click', () => {
        onSelectPlace(place);
      });

      markersRef.current[place.id] = marker;
    });
  }, [clusteredData, selectedPlace, onSelectPlace]);

  // 5. FLY TO SELECTED PLACE
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace) return;

    map.flyTo(selectedPlace.coordinates, 16, {
      duration: 0.9,
    });
  }, [selectedPlace]);

  // 6. SYNC USER LOCATION MARKER
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userCoords) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(userCoords);
      } else {
        const userIcon = createUserLocationIcon();
        userMarkerRef.current = L.marker(userCoords, { icon: userIcon }).addTo(map);
        userMarkerRef.current.bindPopup(
          '<div dir="rtl" class="text-xs font-semibold text-center p-1 font-[\'Vazirmatn\',sans-serif]">موقعیت کنونی شما</div>'
        );
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoords]);

  // Centering helpers
  const handleCenterUser = () => {
    if (userCoords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(userCoords, 16, { duration: 1 });
    } else if (onRequestUserLocation) {
      onRequestUserLocation();
    }
  };

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([32.3842, 48.4018], 14, { duration: 1 });
    }
  };

  // Calculate distance for snap card
  const selectedDistanceStr = useMemo(() => {
    if (!selectedPlace || !userCoords) return '';
    const dist = calculateDistance(
      userCoords[0],
      userCoords[1],
      selectedPlace.coordinates[0],
      selectedPlace.coordinates[1]
    );
    return formatDistance(dist);
  }, [selectedPlace, userCoords]);

  // Next prayer time info for selected place
  const nextPrayer = useMemo(() => {
    if (!selectedPlace) return null;
    return getNextPrayerInfo(selectedPlace.prayerTimes);
  }, [selectedPlace]);

  return (
    <div
      id="dezful-map-wrapper"
      className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-stone-200/90 bg-stone-100 ${heightClass} transition-all duration-300 font-['Vazirmatn',sans-serif]`}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Legend (Top Right) */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2 pointer-events-auto">
        <div className="bg-[#F7F3EC]/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-md border border-stone-200/90 text-xs flex items-center gap-2.5 sm:gap-3.5">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0E7C86] inline-block ring-2 ring-white shadow-2xs"></span>
            <span className="font-semibold text-[#1F2430] text-[11px] sm:text-xs">مسجد</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B4552D] inline-block ring-2 ring-white shadow-2xs"></span>
            <span className="font-semibold text-[#1F2430] text-[11px] sm:text-xs">حسینیه</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFB800] text-stone-900 font-black text-[9px] inline-flex items-center justify-center ring-1 ring-white">★</span>
            <span className="font-semibold text-[#1F2430] text-[11px] sm:text-xs">اثر تاریخی</span>
          </div>
        </div>
      </div>

      {/* Control Buttons (Floating Top Left) */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 pointer-events-auto">
        {onToggleFullView && (
          <button
            onClick={onToggleFullView}
            className="w-10 h-10 bg-white/95 hover:bg-white text-stone-700 rounded-xl shadow-md flex items-center justify-center border border-stone-200 transition-all active:scale-95 cursor-pointer"
            title={isFullView ? 'نمای عادی' : 'تمام صفحه'}
            aria-label="تغییر اندازه نقشه"
          >
            {isFullView ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}

        <button
          onClick={handleCenterUser}
          className="w-10 h-10 bg-white/95 hover:bg-white text-[#0E7C86] rounded-xl shadow-md flex items-center justify-center border border-stone-200 transition-all active:scale-95 cursor-pointer"
          title="موقعیت من (GPS)"
          aria-label="موقعیت من"
        >
          <Crosshair size={18} />
        </button>

        <button
          onClick={handleResetCenter}
          className="w-10 h-10 bg-white/95 hover:bg-white text-stone-700 rounded-xl shadow-md flex items-center justify-center border border-stone-200 transition-all active:scale-95 cursor-pointer"
          title="مرکز شهر دزفول"
          aria-label="مرکز شهر دزفول"
        >
          <MapPin size={18} />
        </button>
      </div>

      {/* Floating Counter Pill (Bottom Left when no card is selected) */}
      {!selectedPlace && (
        <div className="absolute bottom-3 right-3 z-[400] bg-[#1F2430]/90 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 pointer-events-none animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{toPersianDigits(places.length)} مکان در دزفول</span>
        </div>
      )}

      {/* 7. BOTTOM SNAP CARD (WHEN PIN TOUCHED) */}
      {selectedPlace && (
        <div
          dir="rtl"
          id="map-bottom-snap-card"
          className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto sm:w-[380px] z-[500] bg-[#FAF7F2] rounded-3xl p-3.5 sm:p-4 shadow-2xl border border-stone-300 animate-in slide-in-from-bottom-4 duration-250 backdrop-blur-md font-['Vazirmatn',sans-serif]"
        >
          {/* Card Header with Close button */}
          <div className="flex items-start gap-3 relative">
            {/* Thumbnail Image */}
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 bg-stone-200 border border-stone-300/80 shadow-2xs">
              <img
                src={selectedPlace.images[0]}
                alt={selectedPlace.name}
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute top-1 right-1 text-[8px] font-black px-1.5 py-0.5 rounded text-white shadow-2xs ${
                  selectedPlace.type === 'hussainiya'
                    ? 'bg-[#B4552D]'
                    : selectedPlace.type === 'shrine'
                    ? 'bg-[#B38B1C]'
                    : 'bg-[#0E7C86]'
                }`}
              >
                {getPlaceTypeName(selectedPlace.type)}
              </span>
            </div>

            {/* Place Info */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-start justify-between">
                <h3 className="font-extrabold text-sm sm:text-base text-[#1F2430] truncate leading-snug">
                  {selectedPlace.name}
                </h3>
                <button
                  type="button"
                  onClick={() => onSelectPlace(null)}
                  className="w-6 h-6 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors shrink-0 -mt-1 -ml-1 cursor-pointer"
                  aria-label="بستن کارت"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Neighborhood & Distance */}
              <div className="flex items-center gap-1 text-xs text-stone-600 mt-1">
                <MapPin size={12} className="text-[#0E7C86] shrink-0" />
                <span className="truncate">{selectedPlace.neighborhood}</span>
                {selectedDistanceStr && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="font-bold text-[#B4552D] shrink-0">{selectedDistanceStr}</span>
                  </>
                )}
              </div>

              {/* Status & Next Prayer */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {/* Open/Closed Badge */}
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedPlace.isOpenNow
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedPlace.isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-stone-500'
                    }`}
                  />
                  {selectedPlace.isOpenNow ? 'اکنون باز است' : 'بسته'}
                </span>

                {/* Historic Badge */}
                {selectedPlace.isHistoric && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    <span>★</span>
                    <span>اثر تاریخی</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Next Prayer Info Line */}
          {nextPrayer && (
            <div className="mt-2.5 pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-600 bg-white/70 px-2.5 py-1.5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <Clock size={13} className="text-[#0E7C86]" />
                <span>{nextPrayer.label}</span>
              </div>
              {selectedPlace.hasShavadan && (
                <span className="text-[10px] text-[#B4552D] font-bold">شوادون سنتی</span>
              )}
            </div>
          )}

          {/* TWO LARGE ACTION BUTTONS: مسیریابی & جزئیات */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNavPlace(selectedPlace)}
              className="flex-1 bg-[#B4552D] hover:bg-[#963E19] active:scale-[0.98] text-white py-2.5 px-3 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Navigation size={15} />
              <span>مسیریابی (نشان/بلد)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenDetails) {
                  onOpenDetails(selectedPlace);
                }
              }}
              className="flex-1 bg-[#0E7C86] hover:bg-[#0A6B74] active:scale-[0.98] text-white py-2.5 px-3 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>مشاهده جزئیات</span>
              <ArrowLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation App Selector Modal */}
      {navPlace && (
        <NavigationOptionsModal
          place={navPlace}
          onClose={() => setNavPlace(null)}
        />
      )}
    </div>
  );
};
