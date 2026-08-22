import React from 'react';
import { Place } from '../types';
import { toPersianDigits, formatDistance, calculateDistance, getPlaceTypeName } from '../utils/persianUtils';
import { MapPin, Clock, Bookmark, ArrowLeft, Building, Users, Compass, CheckCircle2 } from 'lucide-react';

interface PlacesListViewProps {
  places: Place[];
  onSelectPlace: (place: Place) => void;
  userCoords: [number, number] | null;
  savedPlaceIds: string[];
  onToggleSave: (placeId: string) => void;
}

export const PlacesListView: React.FC<PlacesListViewProps> = ({
  places,
  onSelectPlace,
  userCoords,
  savedPlaceIds,
  onToggleSave,
}) => {
  if (places.length === 0) {
    return (
      <div className="py-12 px-4 text-center space-y-2 bg-white rounded-3xl border border-stone-200 my-4 max-w-6xl mx-auto">
        <Building size={36} className="mx-auto text-stone-300" />
        <h3 className="text-sm font-bold text-stone-700">هیچ مکانی با این مشخصات یافت نشد</h3>
        <p className="text-xs text-stone-500">
          لطفاً فیلترهای جستجو را بازنشانی کرده یا عبارت دیگری را جست‌وجو نمایید.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-6xl mx-auto px-4 py-2">
      {places.map((place) => {
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
            id={`place-card-${place.id}`}
            onClick={() => onSelectPlace(place)}
            className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
          >
            <div className="flex items-start gap-3.5">
              {/* Thumbnail Image */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-stone-100">
                <img
                  src={place.images[0]}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span
                  className={`absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded text-white shadow-xs backdrop-blur-xs ${
                    place.type === 'hussainiya'
                      ? 'bg-[#B4552D]'
                      : place.type === 'shrine'
                      ? 'bg-[#B38B1C]'
                      : 'bg-[#0E7C86]'
                  }`}
                >
                  {getPlaceTypeName(place.type)}
                </span>
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-sm sm:text-base text-[#1F2430] truncate">
                    {place.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSave(place.id);
                    }}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                      isSaved ? 'text-[#B4552D]' : 'text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
                  <MapPin size={13} className="text-[#0E7C86] shrink-0" />
                  <span className="truncate">{place.neighborhood}</span>
                  {distanceStr && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-[#B4552D] shrink-0">{distanceStr}</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-2">
                  {place.description}
                </p>
              </div>
            </div>

            {/* Badges and Footer */}
            <div className="pt-2.5 mt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {place.hasShavadan && (
                  <span className="text-[10px] bg-[#B4552D]/10 text-[#B4552D] px-2 py-0.5 rounded-md font-semibold border border-[#B4552D]/20">
                    شوادون دزفولی
                  </span>
                )}
                {place.features.womenSection && (
                  <span className="text-[10px] bg-[#0E7C86]/10 text-[#0E7C86] px-2 py-0.5 rounded-md font-medium">
                    بانوان
                  </span>
                )}
                {place.features.wheelchairAccessible && (
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                    رمپ معلولین
                  </span>
                )}
              </div>

              <span className="text-[#0E7C86] group-hover:text-[#0A6B74] font-bold text-xs flex items-center gap-0.5 shrink-0">
                مشاهده و مسیر
                <ArrowLeft size={13} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
