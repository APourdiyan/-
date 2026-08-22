import React from 'react';
import { Place } from '../types';
import { toPersianDigits, formatDistance, calculateDistance, getPlaceTypeName } from '../utils/persianUtils';
import { MapPin, Sparkles, Bookmark, ArrowLeft, Clock, ShieldCheck } from 'lucide-react';

interface FeaturedPlacesCarouselProps {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  userCoords: [number, number] | null;
  savedPlaceIds: string[];
  onToggleSave: (placeId: string) => void;
}

export const FeaturedPlacesCarousel: React.FC<FeaturedPlacesCarouselProps> = ({
  places,
  onSelectPlace,
  userCoords,
  savedPlaceIds,
  onToggleSave,
}) => {
  const featuredPlaces = places.filter((p) => p.isFeatured);

  return (
    <section className="py-4">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B4552D]"></span>
            <h2 className="font-extrabold text-base sm:text-lg text-[#1F2430]">
              اماکن شاخص و کهن دزفول
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            برترین پایگاه‌های تاریخی و آیینی
          </span>
        </div>

        {/* Horizontal Carousel */}
        <div className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1 scroll-smooth">
          {featuredPlaces.map((place) => {
            const isSaved = savedPlaceIds.includes(place.id);
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
                id={`featured-card-${place.id}`}
                onClick={() => onSelectPlace(place)}
                className="w-[280px] sm:w-[320px] bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-xs hover:shadow-md transition-all duration-200 shrink-0 flex flex-col cursor-pointer group"
              >
                {/* Card Top Image & Badges */}
                <div className="relative h-40 bg-stone-200 overflow-hidden">
                  <img
                    src={place.images[0]}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Type Badge */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full text-white shadow-xs backdrop-blur-md ${
                        place.type === 'hussainiya'
                          ? 'bg-[#B4552D]/90'
                          : place.type === 'shrine'
                          ? 'bg-[#B38B1C]/90'
                          : 'bg-[#0E7C86]/90'
                      }`}
                    >
                      {getPlaceTypeName(place.type)}
                    </span>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(place.id);
                    }}
                    className={`absolute top-2.5 left-2.5 p-2 rounded-full backdrop-blur-md transition-colors ${
                      isSaved
                        ? 'bg-[#B4552D] text-white shadow-md'
                        : 'bg-black/40 text-white hover:bg-black/60'
                    }`}
                    aria-label="ذخیره مکان"
                  >
                    <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>

                  {/* Bottom overlay inside image: Title & Neighborhood */}
                  <div className="absolute bottom-2.5 right-2.5 left-2.5 text-white">
                    <h3 className="font-bold text-base leading-tight drop-shadow-sm mb-1">
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-200">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-[#F7F3EC]" />
                        {place.neighborhood}
                      </span>
                      {distanceStr && (
                        <span className="bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                          {distanceStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {place.description}
                  </p>

                  {/* Feature Tags (Shavadan, Women, etc.) */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {place.hasShavadan && (
                      <span className="text-[10px] bg-[#B4552D]/10 text-[#B4552D] px-2 py-0.5 rounded-md font-semibold border border-[#B4552D]/20">
                        شوادون تاریخی
                      </span>
                    )}
                    {place.features.womenSection && (
                      <span className="text-[10px] bg-[#0E7C86]/10 text-[#0E7C86] px-2 py-0.5 rounded-md font-medium">
                        بخش بانوان
                      </span>
                    )}
                    {place.features.quranClasses && (
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-medium">
                        جلسه قرآن
                      </span>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-stone-500">
                      <Clock size={12} className="text-[#0E7C86]" />
                      <span>نماز ظهر: {place.prayerTimes.dhuhr}</span>
                    </div>
                    <span className="text-[#0E7C86] group-hover:text-[#0A6B74] font-bold flex items-center gap-0.5">
                      جزئیات و مسیر
                      <ArrowLeft size={13} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
