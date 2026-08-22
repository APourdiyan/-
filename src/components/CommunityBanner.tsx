import React from 'react';
import { PlusCircle, Sparkles, Building, CheckCircle2 } from 'lucide-react';

interface CommunityBannerProps {
  onOpenSubmit: () => void;
  onOpenSubmitAnnouncement?: () => void;
}

export const CommunityBanner: React.FC<CommunityBannerProps> = ({
  onOpenSubmit,
  onOpenSubmitAnnouncement,
}) => {
  return (
    <section className="py-4">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#B4552D] via-[#A04520] to-[#7D3213] text-white p-5 sm:p-6 shadow-md border border-[#B4552D]/30">
          {/* Geometric Pattern Watermark */}
          <div className="absolute -left-10 -bottom-10 w-44 h-44 border-[12px] border-white/10 rounded-full pointer-events-none" />
          <div className="absolute right-12 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-semibold">
                <Sparkles size={13} className="text-[#C9A227]" />
                <span>مشارکت شهروندان و خادمین دزفول</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                اطلاع‌رسانی سریع مراسمات و برنامه‌های مساجد
              </h3>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                خادمین و مسئولین هیئات می‌توانند اطلاعیه‌های فوری، مجالس عزاداری، سخنرانی‌ها و توزیع نذورات محله خود را در لحظه منتشر کنند.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
              {onOpenSubmitAnnouncement && (
                <button
                  type="button"
                  onClick={onOpenSubmitAnnouncement}
                  className="w-full sm:w-auto bg-[#1F2430] hover:bg-stone-900 text-white font-extrabold px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-stone-600"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>ثبت سریع اطلاعیه (پنل خادم)</span>
                </button>
              )}

              <button
                id="btn-community-submit"
                onClick={onOpenSubmit}
                className="w-full sm:w-auto bg-[#F7F3EC] hover:bg-white text-[#B4552D] font-extrabold px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle size={18} className="text-[#B4552D]" />
                <span>ثبت مسجد جدید</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
