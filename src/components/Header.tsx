import React from 'react';
import { Search, X, Bookmark, Compass, Sun, Moon } from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenQuickFinder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  savedCount,
  onOpenSaved,
  onOpenQuickFinder,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#F7F3EC]/90 backdrop-blur-md border-b border-[#B4552D]/15 transition-all">
      {/* Delicate Dezful Brick Geometric Texture Subtle Header Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#B4552D] via-[#0E7C86] to-[#B4552D] opacity-80" />

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Minimal Linear Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B4552D] to-[#923E1C] flex items-center justify-center text-white shadow-sm border border-[#B4552D]/20">
            {/* Minimal Linear Brick Dome Icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-[#F7F3EC]"
            >
              {/* Pointed Iranian Brick Arch */}
              <path d="M12 2C9 5.5 5 9 5 14v7h14v-7c0-5-4-8.5-7-12z" />
              <path d="M12 2v2" />
              {/* Brick horizontal bands */}
              <line x1="7" y1="14" x2="17" y2="14" />
              <line x1="9" y1="10" x2="15" y2="10" />
              {/* Gate arch */}
              <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-[#1F2430]">مساجد دزفول</span>
              <span className="text-[10px] bg-[#0E7C86]/10 text-[#0E7C86] px-1.5 py-0.5 rounded font-semibold border border-[#0E7C86]/20">
                سامانه زنده
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-medium">پایگاه جامع مساجد و حسینیه‌ها</span>
          </div>
        </div>

        {/* Search Bar with Input & Clear */}
        <div className="flex-1 max-w-md relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="جست‌وجوی مسجد، حسینیه یا محله…"
              className="w-full bg-white/95 text-stone-800 placeholder-stone-400 text-xs sm:text-sm pl-8 pr-10 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C86]/30 focus:border-[#0E7C86] transition-all shadow-2xs"
            />
            <Search
              size={18}
              className="absolute right-3 text-stone-400 pointer-events-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-2.5 text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition-colors"
                aria-label="پاک کردن جستجو"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Header Action: Saved & Quick Compass */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenSaved}
            className="relative p-2.5 rounded-xl text-stone-600 hover:text-[#B4552D] hover:bg-stone-200/60 transition-colors border border-stone-200/80"
            title="اماکن نشان‌شده"
            aria-label="نشان‌شده‌ها"
          >
            <Bookmark size={19} />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#B4552D] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-xs">
                {toPersianDigits(savedCount)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
