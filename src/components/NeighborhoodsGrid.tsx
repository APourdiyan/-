import React from 'react';
import { Neighborhood } from '../types';
import { toPersianDigits } from '../utils/persianUtils';
import { Landmark, Store, History, Building2, ChevronLeft, MapPin, Waves } from 'lucide-react';

interface NeighborhoodsGridProps {
  neighborhoods: Neighborhood[];
  selectedCategory: string | null;
  onSelectNeighborhood: (category: string) => void;
}

export const NeighborhoodsGrid: React.FC<NeighborhoodsGridProps> = ({
  neighborhoods,
  selectedCategory,
  onSelectNeighborhood,
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'historic':
        return <Landmark size={18} className="text-[#B4552D]" />;
      case 'bazaar_center':
        return <Store size={18} className="text-[#0E7C86]" />;
      case 'old_quarters':
        return <History size={18} className="text-[#B38B1C]" />;
      case 'new_towns':
        return <Building2 size={18} className="text-blue-600" />;
      case 'riverside_suburbs':
        return <Waves size={18} className="text-emerald-600" />;
      default:
        return <MapPin size={18} className="text-stone-600" />;
    }
  };

  return (
    <section className="py-4 bg-[#F0EAE1]/50 border-y border-stone-200/60 my-3 font-['Vazirmatn',sans-serif]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0E7C86]"></span>
            <h2 className="font-extrabold text-base sm:text-lg text-[#1F2430]">
              محله‌های عرفی و تاریخی دزفول
            </h2>
          </div>
          {selectedCategory && (
            <button
              onClick={() => onSelectNeighborhood('')}
              className="text-xs text-[#B4552D] hover:underline font-semibold cursor-pointer"
            >
              نمایش همه محلات
            </button>
          )}
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {neighborhoods.map((nh) => {
            const isSelected = selectedCategory === nh.category;
            return (
              <div
                key={nh.id}
                id={`neighborhood-card-${nh.id}`}
                onClick={() => onSelectNeighborhood(nh.category)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#0E7C86] shadow-md ring-2 ring-[#0E7C86]/20'
                    : 'bg-white/95 hover:bg-white border-stone-200/90 shadow-2xs hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                        {getCategoryIcon(nh.category)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1F2430] leading-tight">
                          {nh.name}
                        </h3>
                        <span className="text-[10px] text-stone-500 font-medium">
                          {nh.categoryName}
                        </span>
                      </div>
                    </div>

                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${nh.color}15`,
                        color: nh.color,
                      }}
                    >
                      {toPersianDigits(nh.placesCount || (nh.mosquesCount + nh.hussainiyasCount))} مکان
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed mb-2.5 font-medium line-clamp-2">
                    {nh.oneLiner || nh.description}
                  </p>
                </div>

                {/* 3 Counters */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 text-[10px] text-stone-600 font-semibold">
                    <span>🕌 {toPersianDigits(nh.mosquesCount)} مسجد</span>
                    <span>•</span>
                    <span>🏴 {toPersianDigits(nh.hussainiyasCount)} حسینیه</span>
                    <span>•</span>
                    <span>🏛 {toPersianDigits(nh.historicCount)} اثر ملی</span>
                  </div>
                  <span className="text-[#0E7C86] font-bold shrink-0 flex items-center">
                    <ChevronLeft size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

