import React from 'react';
import { Place } from '../types';
import { toPersianDigits, getPlaceTypeName } from '../utils/persianUtils';
import { X, Bookmark, MapPin, ArrowLeft, Trash2 } from 'lucide-react';

interface FavoritesModalProps {
  savedPlaces: Place[];
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  onRemoveSave: (placeId: string) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  savedPlaces,
  onClose,
  onSelectPlace,
  onRemoveSave,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#FAF7F2] border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bookmark size={20} className="text-[#B4552D]" />
            <div>
              <h3 className="font-bold text-base text-[#1F2430]">اماکن نشان‌شده شما</h3>
              <span className="text-xs text-stone-500">
                {toPersianDigits(savedPlaces.length)} مکان برگزیده
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {savedPlaces.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-stone-400">
              <Bookmark size={36} className="mx-auto opacity-40 text-[#B4552D]" />
              <p className="text-xs font-medium">هنوز مکانی را نشان نکرده‌اید.</p>
              <p className="text-[11px] text-stone-400">
                با زدن دکمه بوک‌مارک در هر مسجد یا حسینیه، دسترسی سریع ایجاد کنید.
              </p>
            </div>
          ) : (
            savedPlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => {
                  onSelectPlace(place);
                  onClose();
                }}
                className="p-3 bg-[#FAF7F2] hover:bg-stone-100 rounded-2xl border border-stone-200/80 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={place.images[0]}
                    alt={place.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900 leading-tight">
                      {place.name}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-1">
                      <MapPin size={11} className="text-[#0E7C86]" />
                      <span>{place.neighborhood}</span>
                      <span>•</span>
                      <span className="text-[#B4552D] font-medium">
                        {getPlaceTypeName(place.type)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSave(place.id);
                    }}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="حذف از نشان‌شده‌ها"
                  >
                    <Trash2 size={16} />
                  </button>

                  <ArrowLeft size={16} className="text-[#0E7C86]" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
