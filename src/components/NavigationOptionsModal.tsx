import React, { useState } from 'react';
import { Place } from '../types';
import { getNavigationLinks, toPersianDigits } from '../utils/persianUtils';
import { X, Navigation, ExternalLink, Copy, Check, MapPin } from 'lucide-react';

interface NavigationOptionsModalProps {
  place: Place | null;
  onClose: () => void;
}

export const NavigationOptionsModal: React.FC<NavigationOptionsModalProps> = ({
  place,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!place) return null;

  const links = getNavigationLinks(place.coordinates[0], place.coordinates[1], place.name);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${place.coordinates[0]}, ${place.coordinates[1]}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal / Sheet Container */}
      <div 
        dir="rtl"
        className="relative z-10 w-full max-w-md bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-300 p-5 space-y-4 animate-in slide-in-from-bottom sm:zoom-in-95 duration-250 font-['Vazirmatn',sans-serif]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0E7C86]/10 text-[#0E7C86] flex items-center justify-center">
              <Navigation size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#1F2430]">
                مسیریابی به «{place.name}»
              </h3>
              <p className="text-xs text-stone-500 truncate max-w-[240px]">
                {place.neighborhood} • {place.address}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation App Options */}
        <div className="space-y-2.5 pt-1">
          <p className="text-xs font-semibold text-stone-700">
            مسیریاب مورد نظر خود را انتخاب کنید:
          </p>

          {/* 1. Neshan */}
          <a
            href={links.neshan}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs transition-all hover:border-[#0E7C86] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00A859]/10 text-[#00A859] flex items-center justify-center text-lg font-black">
                ن
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-[#1F2430] block group-hover:text-[#0E7C86]">
                  مسیریاب نشان
                </span>
                <span className="text-[11px] text-stone-500">
                  پیشنهادی برای معابر و کوچه‌های دزفول
                </span>
              </div>
            </div>
            <ExternalLink size={16} className="text-stone-400 group-hover:text-[#0E7C86]" />
          </a>

          {/* 2. Balad */}
          <a
            href={links.balad}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs transition-all hover:border-[#B4552D] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0070BA]/10 text-[#0070BA] flex items-center justify-center text-lg font-black">
                ب
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-[#1F2430] block group-hover:text-[#B4552D]">
                  مسیریاب بلد
                </span>
                <span className="text-[11px] text-stone-500">
                  مسیریابی هوشمند شهری با ترافیک زنده
                </span>
              </div>
            </div>
            <ExternalLink size={16} className="text-stone-400 group-hover:text-[#B4552D]" />
          </a>

          {/* 3. Google Maps */}
          <a
            href={links.google}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 shadow-2xs transition-all hover:border-amber-600 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-lg font-black">
                G
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-[#1F2430] block group-hover:text-amber-600">
                  گوگل مپ (Google Maps)
                </span>
                <span className="text-[11px] text-stone-500">
                  نقشهٔ بین‌المللی و نمایش ماهواره‌ای
                </span>
              </div>
            </div>
            <ExternalLink size={16} className="text-stone-400 group-hover:text-amber-600" />
          </a>
        </div>

        {/* Copy Coordinates footer */}
        <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-500">
            <MapPin size={13} className="text-[#B4552D]" />
            <span>مختصات جغرافیایی:</span>
            <span className="font-mono text-[11px]">{toPersianDigits(place.coordinates[0])}, {toPersianDigits(place.coordinates[1])}</span>
          </div>

          <button
            onClick={handleCopyCoords}
            className="flex items-center gap-1 text-xs text-[#0E7C86] font-bold hover:underline cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-600" />
                <span className="text-emerald-600">کپی شد</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>کپی مختصات</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
