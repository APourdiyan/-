import React from 'react';
import { Navigation, Map, Sparkles, Clock, Compass } from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';

interface HeroSectionProps {
  onFindNearest: () => void;
  onOpenFullMap: () => void;
  isLocating: boolean;
  totalPlacesCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onFindNearest,
  onOpenFullMap,
  isLocating,
  totalPlacesCount,
}) => {
  return (
    <section className="relative overflow-hidden pt-5 pb-3 px-4">
      {/* Subtle brick decorative background element */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#B4552D]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute top-12 left-0 w-40 h-40 bg-[#0E7C86]/5 rounded-full blur-3xl pointer-events-none -ml-12" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Live Date & City Pill */}
        <div className="inline-flex items-center gap-2 bg-[#F0EAE1] text-stone-700 px-3 py-1 rounded-full text-xs font-medium mb-3 border border-stone-300/60 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#0E7C86] animate-pulse"></span>
          <span>دزفول • پنج‌شنبه ۲ شهریور ۱۴۰۵</span>
          <span className="text-stone-300">|</span>
          <span className="text-[#B4552D] font-semibold">
            {toPersianDigits(totalPlacesCount)} مکان ثبت‌شده
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1F2430] tracking-tight leading-snug sm:leading-tight mb-2">
          نقشهٔ زنده مساجد و حسینیه‌های دزفول
        </h1>

        {/* One line subtitle */}
        <p className="text-stone-600 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-5">
          راهنمای شهری برای یافتن نزدیک‌ترین مساجد، زمان اقامه نماز، شوادون‌های کهن و مجالس آیینی دزفول
        </p>

        {/* Two Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
          {/* Primary Button: Nearest Mosque */}
          <button
            id="btn-nearest-mosque"
            onClick={onFindNearest}
            disabled={isLocating}
            className="flex-1 sm:flex-initial min-w-[170px] bg-gradient-to-r from-[#B4552D] to-[#9E421B] hover:from-[#9E421B] hover:to-[#833413] text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-[#B4552D]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Navigation
              size={18}
              className={`${isLocating ? 'animate-spin' : ''} text-[#FAF7F2]`}
            />
            <span>{isLocating ? 'در حال موقعیت‌یابی…' : 'نزدیک‌ترین مسجد به من'}</span>
          </button>

          {/* Secondary Button: Full Map */}
          <button
            id="btn-full-map"
            onClick={onOpenFullMap}
            className="flex-1 sm:flex-initial min-w-[140px] bg-white hover:bg-stone-50 text-[#0E7C86] border border-[#0E7C86]/30 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Map size={18} className="text-[#0E7C86]" />
            <span>نقشهٔ کامل شهر</span>
          </button>
        </div>
      </div>
    </section>
  );
};
