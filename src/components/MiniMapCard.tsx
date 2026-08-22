import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Place } from '../types';
import { ExternalLink } from 'lucide-react';
import { getNavigationLinks } from '../utils/persianUtils';

interface MiniMapCardProps {
  place: Place;
}

export const MiniMapCard: React.FC<MiniMapCardProps> = ({ place }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: place.coordinates,
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const pinHtml = `
      <div style="background-color: #B4552D; box-shadow: 0 4px 12px rgba(180,85,45,0.4);" 
           class="w-7 h-7 rounded-full flex items-center justify-center text-white border-2 border-white text-xs font-bold">
        ${place.type === 'hussainiya' ? '🏴' : '🕌'}
      </div>
    `;

    const customIcon = L.divIcon({
      className: 'mini-map-pin',
      html: pinHtml,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker(place.coordinates, { icon: customIcon }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [place]);

  const navLinks = getNavigationLinks(place.coordinates[0], place.coordinates[1], place.name);

  return (
    <div className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden border border-stone-300 shadow-2xs group">
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Floating Action Badge on top of map */}
      <a
        href={navLinks.neshan}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2.5 right-2.5 z-[400] bg-[#FAF7F2]/95 hover:bg-white text-[#0E7C86] backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 shadow-md text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-105"
      >
        <span>مشاهده در نقشه بزرگ</span>
        <ExternalLink size={13} />
      </a>
    </div>
  );
};
