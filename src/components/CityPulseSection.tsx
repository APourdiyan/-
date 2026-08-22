import React, { useState, useRef } from 'react';
import { EventItem, Place } from '../types';
import { toPersianDigits, getNavigationLinks } from '../utils/persianUtils';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Mic2,
  Utensils,
  AlertTriangle,
  Radio,
  Flame,
  X,
  Volume2,
  Compass,
  Building2,
  Calendar,
  Share2
} from 'lucide-react';

interface CityPulseSectionProps {
  events: EventItem[];
  places: Place[];
  onViewAllEvents: () => void;
  onSelectEvent: (event: EventItem) => void;
  onSelectPlaceById?: (placeId: string) => void;
  onOpenSubmitAnnouncement?: () => void;
}

export const CityPulseSection: React.FC<CityPulseSectionProps> = ({
  events,
  places,
  onViewAllEvents,
  onSelectEvent,
  onSelectPlaceById,
  onOpenSubmitAnnouncement,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeNavigationPlace, setActiveNavigationPlace] = useState<{
    name: string;
    coords: [number, number];
  } | null>(null);

  // Filter tonight's prominent events
  const tonightEvents = events.filter((e) => {
    return (
      e.isTonightFeatured ||
      e.dayOffset === 0 ||
      e.status === 'live' ||
      e.dateFilterGroup === 'today' ||
      e.isUrgent
    );
  });

  // Urgent and high-priority notices for ticker marquee
  const urgentAnnouncements = [
    {
      id: 'ann-1',
      tag: 'تغییر مکان',
      text: 'مسجد جامع تاریخی: به علت گرمای هوا، مراسم امشب در شبستان زیرزمینی و خنک شوادون برگزار می‌شود.',
      isUrgent: true,
      time: 'امشب ۲۰:۳۰',
    },
    {
      id: 'ann-2',
      tag: 'توزیع نذری',
      text: 'حسینیه اعظم چولیان: طبخ و توزیع قیمه سنتی دزفولی و اطعام تبرکی امشب پس از عزاداری.',
      isUrgent: false,
      time: 'امشب ۲۱:۱۵',
    },
    {
      id: 'ann-3',
      tag: 'مراسم کشوری',
      text: 'حسینیه ثارالله: دعای کمیل با نوای حاج صادق آهنگران امشب ساعت ۲۱:۰۰ و پخش زنده.',
      isUrgent: false,
      time: 'امشب ۲۱:۰۰',
    },
    {
      id: 'ann-4',
      tag: 'محفل قرآن',
      text: 'آستانه سبزقبا (ع): محفل تلاوت مجلسی قاریان ممتاز همراه با زیارت امین‌الله هم‌اکنون در صحن مطهر.',
      isUrgent: false,
      time: 'در حال برگزاری',
    },
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 360;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="city-pulse-tonight-section"
      className="py-6 bg-gradient-to-b from-[#FAF7F2] via-[#F4EFE6]/80 to-[#FAF7F2] border-y border-stone-200/90 font-['Vazirmatn',sans-serif]"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto px-4">
        
        {/* ========================================================================= */}
        {/* 1. SECTION HEADER (تیتر نبض شهر + لینک مشاهده همه)                       */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between gap-3 mb-4">
          
          {/* Right: Title & Live indicator badge */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#B4552D] to-[#d66f42] text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-[#1F2430] tracking-tight">
                  نبض شهر: رویدادهای امشب دزفول
                </h2>
                <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 text-[11px] font-black border border-rose-500/20">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  <span>زنده و امشب</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                مراسم‌ها، محافل دعا، سخنرانی‌ها و توزیع نذورات امشب در بافت تاریخی و محلات
              </p>
            </div>
          </div>

          {/* Left: View All link + Scroll arrows for desktop */}
          <div className="flex items-center gap-2">
            {/* Desktop scroll arrows */}
            <div className="hidden md:flex items-center gap-1 bg-white p-1 rounded-2xl border border-stone-200 shadow-2xs">
              <button
                onClick={() => handleScroll('right')}
                className="w-8 h-8 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="قبلی"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => handleScroll('left')}
                className="w-8 h-8 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="بعدی"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {/* Khadem Quick Submit Button */}
            {onOpenSubmitAnnouncement && (
              <button
                type="button"
                onClick={onOpenSubmitAnnouncement}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-100 border border-stone-700 text-xs font-black shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ثبت اطلاعیه خادم</span>
              </button>
            )}

            {/* View All Button */}
            <button
              id="view-all-tonight-events-btn"
              onClick={onViewAllEvents}
              className="group px-3.5 py-2 rounded-2xl bg-white hover:bg-[#B4552D] text-[#B4552D] hover:text-white border border-[#B4552D]/30 hover:border-[#B4552D] text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
            >
              <span>مشاهده همه</span>
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. URGENT ANNOUNCEMENTS MARQUEE TICKER (نوار اطلاعیه‌های فوری متنی)      */}
        {/* ========================================================================= */}
        <div className="mb-4 bg-stone-900 text-stone-100 rounded-2xl p-2.5 sm:p-3 shadow-md border border-stone-800 flex items-center gap-3 overflow-hidden">
          {/* Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#B4552D] text-white text-xs font-black shrink-0 shadow-xs">
            <Volume2 size={14} className="animate-bounce" />
            <span className="whitespace-nowrap">تابلوی فوری</span>
          </div>

          {/* Marquee Container */}
          <div className="flex-1 overflow-hidden relative">
            <div className="flex items-center gap-8 whitespace-nowrap animate-marquee hover:[animation-play-state:paused] text-xs font-bold text-stone-200">
              {urgentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="flex items-center gap-2 cursor-pointer hover:text-amber-300 transition-colors"
                  onClick={onViewAllEvents}
                >
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      ann.isUrgent
                        ? 'bg-amber-400 text-stone-950'
                        : 'bg-stone-800 text-amber-300 border border-stone-700'
                    }`}
                  >
                    {ann.tag}
                  </span>
                  <span>{ann.text}</span>
                  <span className="text-[10px] text-stone-400 font-normal">({ann.time})</span>
                  <span className="text-stone-600 mr-4">✦</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. HORIZONTAL CAROUSEL OF LARGE RECTANGULAR CARDS                         */}
        {/* ========================================================================= */}
        <div
          ref={scrollContainerRef}
          id="city-pulse-carousel"
          className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory no-scrollbar"
        >
          {tonightEvents.map((event) => {
            const place = places.find((p) => p.id === event.placeId);
            const bgImage =
              event.coverImage ||
              place?.images?.[0] ||
              'https://images.unsplash.com/photo-1590076212470-36e2f18374a4?auto=format&fit=crop&w=800&q=80';
            const avatarUrl =
              event.placeAvatar ||
              place?.images?.[0] ||
              'https://images.unsplash.com/photo-1590076212470-36e2f18374a4?auto=format&fit=crop&w=300&q=80';

            const isLiveNow = event.status === 'live';

            return (
              <div
                key={event.id}
                id={`city-pulse-card-${event.id}`}
                onClick={() => onSelectEvent(event)}
                className="group relative flex-shrink-0 w-[290px] xs:w-[330px] sm:w-[360px] h-[370px] sm:h-[410px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl border border-stone-700/60 snap-start cursor-pointer transition-all duration-300 transform hover:-translate-y-1 bg-stone-950 flex flex-col justify-between"
              >
                {/* Background Image with Zoom & Dark Gradient Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={bgImage}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out brightness-[0.75]"
                  />
                  {/* Layered high-contrast gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-900/35" />
                  <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-transparent to-stone-950/90" />
                </div>

                {/* ================= CARD TOP: LOGO, PLACE NAME & STATUS BADGE ================= */}
                <div className="relative z-10 p-4 sm:p-5 flex items-start justify-between gap-3">
                  {/* Mosque Avatar Logo + Title */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={avatarUrl}
                      alt={event.placeName}
                      className="w-11 h-11 rounded-2xl object-cover border-2 border-white/30 shadow-md shrink-0 bg-stone-800"
                    />
                    <div className="min-w-0">
                      <h4 className="text-white font-black text-xs sm:text-sm drop-shadow-md truncate">
                        {event.placeName}
                      </h4>
                      <p className="text-stone-300 text-[11px] font-medium flex items-center gap-1 truncate mt-0.5">
                        <MapPin size={11} className="text-[#B4552D] shrink-0" />
                        <span>{event.neighborhood}</span>
                      </p>
                    </div>
                  </div>

                  {/* Top Status Pill */}
                  <div className="shrink-0">
                    {event.isUrgent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500 text-stone-950 text-[10px] font-black shadow-md animate-pulse">
                        <AlertTriangle size={12} />
                        <span>فوری</span>
                      </span>
                    ) : isLiveNow ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black shadow-md animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>هم‌اکنون</span>
                      </span>
                    ) : event.hasNazri ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/90 backdrop-blur-md text-stone-950 text-[10px] font-black shadow-md">
                        <Utensils size={11} />
                        <span>نذری</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md text-white text-[10px] font-black border border-white/20 shadow-md">
                        <span>{event.typeName}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* ================= CARD MIDDLE: BIG WHITE HEADLINE & SPEAKERS ================= */}
                <div className="relative z-10 px-4 sm:px-5 my-auto">
                  {/* Urgent note if present */}
                  {event.isUrgent && event.urgentNote && (
                    <div className="mb-2 p-2 rounded-xl bg-amber-500/20 border border-amber-400/50 backdrop-blur-md text-amber-200 text-[11px] font-bold">
                      ⚠️ {event.urgentNote}
                    </div>
                  )}

                  {/* Main Title */}
                  <h3 className="text-white font-black text-base sm:text-lg leading-snug drop-shadow-lg line-clamp-2 group-hover:text-amber-200 transition-colors">
                    {event.title}
                  </h3>

                  {/* Speakers / Eulogist chips */}
                  {(event.speaker || event.eulogist) && (
                    <div className="flex items-center gap-2 flex-wrap mt-2.5">
                      {event.speaker && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-stone-200 border border-white/15 text-[11px] font-bold">
                          <Mic2 size={11} className="text-[#0E7C86]" />
                          <span>{event.speaker}</span>
                        </span>
                      )}
                      {event.eulogist && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-stone-200 border border-white/15 text-[11px] font-bold">
                          <span className="text-[#B4552D]">🏴</span>
                          <span>{event.eulogist}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Nazri / Services feature tags */}
                  {event.hasNazri && (
                    <p className="text-amber-300 text-xs font-black mt-2 flex items-center gap-1 drop-shadow-sm">
                      <Utensils size={13} />
                      <span>{event.nazriDetails || 'توزیع نذری و اطعام تبرکی'}</span>
                    </p>
                  )}
                </div>

                {/* ================= CARD BOTTOM: TIME & GLASSMORPHISM NAVIGATION BUTTON ================= */}
                <div className="relative z-10 p-4 sm:p-5 pt-3 border-t border-white/15 bg-gradient-to-t from-stone-950 to-transparent flex items-center justify-between gap-2">
                  
                  {/* Exact Time Info */}
                  <div className="flex items-center gap-1.5 text-stone-200">
                    <Clock size={15} className="text-[#B4552D]" />
                    <span className="font-black text-xs sm:text-sm text-white drop-shadow-md">
                      {event.relativeTimeBadge || `امشب ساعت ${event.time}`}
                    </span>
                  </div>

                  {/* Transparent Glassmorphism Navigation Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNavigationPlace({
                        name: event.placeName,
                        coords: event.coordinates,
                      });
                    }}
                    className="backdrop-blur-md bg-white/20 hover:bg-white/35 active:scale-95 border border-white/40 hover:border-white/60 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0"
                    aria-label={`مسیریابی به ${event.placeName}`}
                  >
                    <Navigation size={14} className="text-white" />
                    <span>مسیریابی</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION MODAL (انتخاب نشان، بلد، گوگل مپ)                               */}
      {/* ========================================================================= */}
      {activeNavigationPlace && (
        <div
          id="city-pulse-nav-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/70 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="absolute inset-0" onClick={() => setActiveNavigationPlace(null)} />
          <div className="relative z-10 w-full max-w-sm bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-stone-200 font-['Vazirmatn',sans-serif]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-[#0E7C86]" />
                <h3 className="font-black text-sm text-[#1F2430] truncate">
                  مسیریابی به {activeNavigationPlace.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveNavigationPlace(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="py-4 space-y-2.5">
              <p className="text-xs text-stone-600 mb-2">
                برنامه مسیریاب مورد نظر خود را انتخاب فرمایید:
              </p>

              {/* Neshan */}
              <a
                href={getNavigationLinks(activeNavigationPlace.coords[0], activeNavigationPlace.coords[1], activeNavigationPlace.name).neshan}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs font-bold text-stone-800 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                    ن
                  </span>
                  <span>مسیریاب نشان (پیشنهادی)</span>
                </div>
                <ChevronLeft size={16} className="text-stone-400" />
              </a>

              {/* Balad */}
              <a
                href={getNavigationLinks(activeNavigationPlace.coords[0], activeNavigationPlace.coords[1], activeNavigationPlace.name).balad}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs font-bold text-stone-800 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                    ب
                  </span>
                  <span>مسیریاب بلد</span>
                </div>
                <ChevronLeft size={16} className="text-stone-400" />
              </a>

              {/* Google Maps */}
              <a
                href={getNavigationLinks(activeNavigationPlace.coords[0], activeNavigationPlace.coords[1], activeNavigationPlace.name).google}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs font-bold text-stone-800 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs">
                    G
                  </span>
                  <span>گوگل مپ (Google Maps)</span>
                </div>
                <ChevronLeft size={16} className="text-stone-400" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
