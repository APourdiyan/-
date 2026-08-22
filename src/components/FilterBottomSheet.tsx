import React from 'react';
import { NeighborhoodCategory, PlaceType } from '../types';
import { toPersianDigits } from '../utils/persianUtils';
import { X, Check, Filter, Sparkles, RotateCcw, Building2, CheckSquare } from 'lucide-react';

export interface FilterState {
  placeType: 'all' | 'mosque' | 'hussainiya' | 'shrine' | 'historic';
  isOpenNowOnly: boolean;
  neighborhoodCategory: NeighborhoodCategory | 'all';
  hasParking: boolean;
  hasWomenSection: boolean;
  hasAblutionArea: boolean;
  hasWheelchairAccessible: boolean;
  hasShavadan: boolean;
  hasQuranClasses: boolean;
}

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  resultCount: number;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onResetFilters,
  resultCount,
}) => {
  if (!isOpen) return null;

  const handleTypeChange = (type: FilterState['placeType']) => {
    onFiltersChange({ ...filters, placeType: type });
  };

  const handleToggleOpenNow = () => {
    onFiltersChange({ ...filters, isOpenNowOnly: !filters.isOpenNowOnly });
  };

  const handleNeighborhoodChange = (cat: FilterState['neighborhoodCategory']) => {
    onFiltersChange({ ...filters, neighborhoodCategory: cat });
  };

  const handleFacilityToggle = (key: keyof Pick<FilterState, 'hasParking' | 'hasWomenSection' | 'hasAblutionArea' | 'hasWheelchairAccessible' | 'hasShavadan' | 'hasQuranClasses'>) => {
    onFiltersChange({ ...filters, [key]: !filters[key] });
  };

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
    <div className="fixed inset-0 z-[1000] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet Drawer */}
      <div 
        dir="rtl"
        className="relative z-10 w-full max-w-xl bg-[#FAF7F2] rounded-t-3xl shadow-2xl border-t border-stone-300 max-h-[88vh] flex flex-col animate-in slide-in-from-bottom duration-300 font-['Vazirmatn',sans-serif]"
      >
        {/* Handle Bar */}
        <div className="pt-3 pb-1 flex justify-center cursor-grab">
          <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#B4552D]/10 text-[#B4552D] flex items-center justify-center">
              <Filter size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#1F2430]">فیلترهای پیشرفته نقشه</h2>
              <p className="text-[11px] text-stone-500">
                {activeFiltersCount > 0
                  ? `${toPersianDigits(activeFiltersCount)} فیلتر فعال است`
                  : 'اماکن را بر اساس مشخصات و خدمات فیلتر کنید'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={onResetFilters}
                className="text-xs font-semibold text-[#B4552D] hover:text-[#963E19] flex items-center gap-1 bg-[#B4552D]/5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>بازنشانی</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-200/70 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="بستن فیلترها"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-right no-scrollbar">
          
          {/* 1. TYPE OF PLACE */}
          <div>
            <label className="block text-xs font-bold text-[#1F2430] mb-2">
              نوع مکان مذهبی
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'همه اماکن', icon: '🏛️' },
                { id: 'mosque', label: 'مسجد', icon: '🕌' },
                { id: 'hussainiya', label: 'حسینیه', icon: '🏴' },
                { id: 'shrine', label: 'بقعه و زیارتگاه', icon: '✨' },
                { id: 'historic', label: 'آثار تاریخی', icon: '⭐' },
              ].map((item) => {
                const isSelected = filters.placeType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTypeChange(item.id as FilterState['placeType'])}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0E7C86] text-white border-[#0E7C86] shadow-sm font-bold scale-[1.02]'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. OPEN NOW TOGGLE SWITCH */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${filters.isOpenNowOnly ? 'bg-emerald-500 animate-pulse' : 'bg-stone-300'}`} />
              <div>
                <span className="font-bold text-xs sm:text-sm text-[#1F2430] block">
                  فقط اماکن «بازِ الان»
                </span>
                <span className="text-[11px] text-stone-500">
                  نمایش اماکنی که در این ساعت برای نماز یا مراسم باز هستند
                </span>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={filters.isOpenNowOnly}
              onClick={handleToggleOpenNow}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                filters.isOpenNowOnly ? 'bg-[#0E7C86]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  filters.isOpenNowOnly ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. NEIGHBORHOOD SELECTOR */}
          <div>
            <label className="block text-xs font-bold text-[#1F2430] mb-2">
              محله‌های عرفی دزفول
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'all', title: 'همه محلات دزفول', sub: 'تمام نقاط شهر' },
                { id: 'historic', title: 'بافت کهن و تاریخی', sub: 'محلات قلعه، کرناسیون، میاندره، لوریان' },
                { id: 'bazaar_center', title: 'مرکز شهر و بازار کهنه', sub: 'خیابان‌های امام، شریعتی، طالقانی، سبزقبا' },
                { id: 'old_quarters', title: 'محلات سنتی و قدیمی', sub: 'صحرابدر، ساکیان، سیاهپوشان، لب‌خندق' },
                { id: 'new_towns', title: 'کوی‌ها و شهرک‌های جدید', sub: 'کوی آزادگان، فرهنگ‌شهر، زیباشهر، بهاران' },
              ].map((n) => {
                const isSelected = filters.neighborhoodCategory === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNeighborhoodChange(n.id as FilterState['neighborhoodCategory'])}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#B4552D]/10 border-[#B4552D] text-[#B4552D]'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{n.title}</div>
                      <div className="text-[10px] text-stone-500">{n.sub}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#B4552D] text-white flex items-center justify-center shrink-0">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. SERVICES & FACILITIES CHECKBOXES */}
          <div>
            <label className="block text-xs font-bold text-[#1F2430] mb-2">
              خدمات و امکانات رفاهی
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'hasWomenSection', label: 'بخش مجزای بانوان', icon: '🧕' },
                { key: 'hasParking', label: 'پارکینگ خودرو / موتور', icon: '🚗' },
                { key: 'hasAblutionArea', label: 'وضوخانه بهداشتی', icon: '💧' },
                { key: 'hasWheelchairAccessible', label: 'دسترسی توان‌یابان (رمپ)', icon: '♿' },
                { key: 'hasShavadan', label: 'دارای شوادون دزفولی', icon: '🏺' },
                { key: 'hasQuranClasses', label: 'جلسات و کانون قرآن', icon: '📖' },
              ].map((item) => {
                const checked = filters[item.key as keyof FilterState] as boolean;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleFacilityToggle(item.key as any)}
                    className={`p-2.5 rounded-xl border text-right flex items-center gap-2 transition-all cursor-pointer ${
                      checked
                        ? 'bg-[#0E7C86]/10 border-[#0E7C86] text-[#0E7C86] font-bold'
                        : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-xs truncate flex-1">{item.label}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        checked
                          ? 'bg-[#0E7C86] border-[#0E7C86] text-white'
                          : 'border-stone-300 bg-white'
                      }`}
                    >
                      {checked && <Check size={11} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer with Apply Action */}
        <div className="p-4 border-t border-stone-200 bg-white/90 backdrop-blur-md flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-[#B4552D] hover:bg-[#963E19] active:scale-[0.98] text-white py-3 px-4 rounded-2xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>نمایش نتایج</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono">
              {toPersianDigits(resultCount)} مکان
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
