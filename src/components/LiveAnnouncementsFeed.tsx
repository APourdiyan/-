import React, { useState, useMemo } from 'react';
import { EventItem, EventCategoryFilter, Place } from '../types';
import { toPersianDigits, getNavigationLinks, getPlaceTypeName } from '../utils/persianUtils';
import {
  Bell,
  BellRing,
  SlidersHorizontal,
  MapPin,
  Clock,
  Mic2,
  Calendar,
  Utensils,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Share2,
  Navigation,
  CheckCircle2,
  Building2,
  Radio,
  Plus,
  Flame,
  Check,
  ChevronLeft,
  X,
  Compass,
  Info,
  Layers,
  Heart,
  Volume2
} from 'lucide-react';
import { SubmitAnnouncementModal } from './SubmitAnnouncementModal';

interface LiveAnnouncementsFeedProps {
  events: EventItem[];
  places: Place[];
  onSelectPlaceById?: (placeId: string) => void;
  onSelectEvent?: (event: EventItem) => void;
  onAddEvent?: (newEvent: EventItem) => void;
}

type DateChipKey = 'today' | 'tomorrow' | 'week' | 'muharram';

interface CategoryTabItem {
  id: EventCategoryFilter;
  label: string;
  emoji: string;
}

const CATEGORY_TABS: CategoryTabItem[] = [
  { id: 'all', label: 'همه', emoji: '✨' },
  { id: 'lecture', label: 'سخنرانی', emoji: '🎙️' },
  { id: 'mourning', label: 'مداحی و عزاداری', emoji: '🏴' },
  { id: 'nazri', label: 'توزیع نذری', emoji: '🍲' },
  { id: 'class_camp', label: 'کلاس و اردو', emoji: '⛺' },
  { id: 'urgent', label: 'اطلاعیه فوری', emoji: '⚠️' },
];

export const LiveAnnouncementsFeed: React.FC<LiveAnnouncementsFeedProps> = ({
  events: initialEvents,
  places,
  onSelectPlaceById,
  onSelectEvent,
  onAddEvent,
}) => {
  // Feed List State (allows adding custom announcements live)
  const [feedEvents, setFeedEvents] = useState<EventItem[]>(initialEvents);

  // 1. Date Filter Strip ('today' | 'tomorrow' | 'week' | 'muharram')
  const [activeDateFilter, setActiveDateFilter] = useState<DateChipKey>('today');

  // 2. Quick Category Tab ('all' | 'lecture' | 'mourning' | 'nazri' | 'class_camp' | 'urgent')
  const [activeCategory, setActiveCategory] = useState<EventCategoryFilter>('all');

  // 3. Reminder / Notification State
  const [remindedEventIds, setRemindedEventIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dezful_reminded_events');
    return saved ? JSON.parse(saved) : ['evt-1'];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4. Modals State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [activeNavigationPlace, setActiveNavigationPlace] = useState<{
    name: string;
    coords: [number, number];
  } | null>(null);

  // Advanced Filters State
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');
  const [filterWomenOnly, setFilterWomenOnly] = useState(false);
  const [filterNazriOnly, setFilterNazriOnly] = useState(false);
  const [filterLiveBroadcastOnly, setFilterLiveBroadcastOnly] = useState(false);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle Reminder
  const handleToggleReminder = (event: EventItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const id = event.id;
    let updated: string[];
    if (remindedEventIds.includes(id)) {
      updated = remindedEventIds.filter((item) => item !== id);
      showToast(`یادآوری «${event.placeName}» غیرفعال شد.`);
    } else {
      updated = [...remindedEventIds, id];
      showToast(`🔔 یادآور رویداد «${event.placeName}» تنظیم شد.`);
    }
    setRemindedEventIds(updated);
    localStorage.setItem('dezful_reminded_events', JSON.stringify(updated));
  };

  // Handle Share Announcement
  const handleShareEvent = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📢 رویداد در مساجد دزفول:\n🏛️ ${event.placeName} (${event.neighborhood})\n📋 ${event.title}\n⏰ ${event.relativeTimeBadge || event.time}\n${event.speaker ? `🎙️ سخنران: ${event.speaker}\n` : ''}${event.eulogist ? `🏴 مداح: ${event.eulogist}\n` : ''}سامانه اطلاع‌رسانی مساجد و حسینیه‌های دزفول`;
    if (navigator.share) {
      navigator.share({ title: event.title, text });
    } else {
      navigator.clipboard.writeText(text);
      showToast('📋 متن اطلاعیه در کلیپ‌بورد کپی شد.');
    }
  };

  // Handle New Announcement Submission from Khadem
  const handleAnnouncementSuccess = (newEvent: EventItem) => {
    setFeedEvents((prev) => [newEvent, ...prev]);
    if (onAddEvent) onAddEvent(newEvent);
    showToast('✨ اطلاعیه جدید خادم در فید زنده منتشر شد.');
  };

  // Get Relative Time Badge text & style
  const getSmartTimeBadge = (item: EventItem) => {
    if (item.isUrgent) {
      return {
        text: '⚠️ اطلاعیه فوری',
        className: 'bg-amber-500 text-white font-black animate-pulse',
        isLive: false,
      };
    }
    if (item.status === 'live') {
      return {
        text: '🔴 هم‌اکنون در حال برگزاری',
        className: 'bg-rose-600 text-white font-black animate-pulse',
        isLive: true,
      };
    }
    if (item.relativeTimeBadge) {
      return {
        text: item.relativeTimeBadge,
        className: 'bg-stone-900 text-[#F7F3EC] font-black',
        isLive: false,
      };
    }
    if (item.dayOffset === 0) {
      return {
        text: `امشب ساعت ${item.time}`,
        className: 'bg-[#B4552D] text-white font-black',
        isLive: false,
      };
    }
    if (item.dayOffset === 1) {
      return {
        text: `فردا ساعت ${item.time}`,
        className: 'bg-[#0E7C86] text-white font-bold',
        isLive: false,
      };
    }
    return {
      text: `${item.dateSolar} - ساعت ${item.time}`,
      className: 'bg-stone-800 text-stone-100 font-bold',
      isLive: false,
    };
  };

  // Filter Logic
  const filteredEvents = useMemo(() => {
    return feedEvents.filter((event) => {
      // 1. Date Filter
      if (activeDateFilter === 'today') {
        const isToday = event.dayOffset === 0 || event.dateFilterGroup === 'today' || event.status === 'live' || event.status === 'today';
        if (!isToday && event.dayOffset !== undefined && event.dayOffset > 0) return false;
      } else if (activeDateFilter === 'tomorrow') {
        const isTomorrow = event.dayOffset === 1 || event.dateFilterGroup === 'tomorrow';
        if (!isTomorrow) return false;
      } else if (activeDateFilter === 'week') {
        if (event.dayOffset !== undefined && event.dayOffset > 7) return false;
      } else if (activeDateFilter === 'muharram') {
        const isMuharram = event.tags?.some((t) => t.includes('محرم') || t.includes('عزاداری') || t.includes('اربعین')) || event.type === 'mourning';
        if (!isMuharram) return false;
      }

      // 2. Category Filter
      if (activeCategory === 'lecture') {
        if (event.categoryFilter !== 'lecture' && event.type !== 'lecture') return false;
      } else if (activeCategory === 'mourning') {
        if (event.categoryFilter !== 'mourning' && event.type !== 'mourning' && event.type !== 'dua') return false;
      } else if (activeCategory === 'nazri') {
        if (!event.hasNazri && !event.hasDinner && event.categoryFilter !== 'nazri') return false;
      } else if (activeCategory === 'class_camp') {
        if (event.categoryFilter !== 'class_camp' && event.categoryFilter !== 'kids_youth' && event.type !== 'quran_class') return false;
      } else if (activeCategory === 'urgent') {
        if (!event.isUrgent && event.categoryFilter !== 'urgent') return false;
      }

      // 3. Advanced Filters
      if (selectedNeighborhood !== 'all' && event.neighborhood !== selectedNeighborhood) {
        return false;
      }
      if (filterWomenOnly && !event.isWomenOnly) return false;
      if (filterNazriOnly && !event.hasNazri && !event.hasDinner) return false;
      if (filterLiveBroadcastOnly && !event.hasLiveBroadcast) return false;

      return true;
    });
  }, [
    feedEvents,
    activeDateFilter,
    activeCategory,
    selectedNeighborhood,
    filterWomenOnly,
    filterNazriOnly,
    filterLiveBroadcastOnly,
  ]);

  // Unique neighborhoods for filter
  const neighborhoodsList = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => set.add(p.neighborhood));
    return Array.from(set);
  }, [places]);

  return (
    <div
      id="live-announcements-feed-page"
      className="min-h-screen bg-[#FAF7F2] text-stone-900 pb-28 font-['Vazirmatn',sans-serif] selection:bg-[#B4552D]/20"
      dir="rtl"
    >
      {/* ========================================================================= */}
      {/* 1. STICKY HEADER (هدر چسبان)                                              */}
      {/* ========================================================================= */}
      <header
        id="live-events-sticky-header"
        className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-stone-200/80 shadow-2xs transition-all"
      >
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* Right: Title & Live Pulse */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#B4552D] text-white flex items-center justify-center shadow-xs">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-[#1F2430] tracking-tight">
                  رویدادهای زنده دزفول
                </h1>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                  <span>زنده</span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                تابلوی اعلانات لحظه‌ای مساجد و حسینیه‌ها
              </p>
            </div>
          </div>

          {/* Left: Notifications Bell & Filter Button */}
          <div className="flex items-center gap-1.5">
            {/* Notification Bell with Badge */}
            <button
              id="header-notification-bell"
              onClick={() => setIsNotificationCenterOpen(true)}
              className="relative w-9 h-9 rounded-2xl bg-white border border-stone-200/90 text-stone-700 hover:text-[#B4552D] hover:border-[#B4552D]/40 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
              aria-label="یادآوری‌های من"
            >
              {remindedEventIds.length > 0 ? (
                <BellRing size={18} className="text-[#B4552D]" />
              ) : (
                <Bell size={18} />
              )}
              {remindedEventIds.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B4552D] text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                  {toPersianDigits(remindedEventIds.length)}
                </span>
              )}
            </button>

            {/* Advanced Filter Button */}
            <button
              id="header-advanced-filter-btn"
              onClick={() => setIsAdvancedFilterOpen(true)}
              className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95 ${
                selectedNeighborhood !== 'all' || filterWomenOnly || filterNazriOnly || filterLiveBroadcastOnly
                  ? 'bg-[#0E7C86] text-white border-[#0E7C86]'
                  : 'bg-white border-stone-200/90 text-stone-700 hover:text-[#0E7C86]'
              }`}
              aria-label="فیلتر پیشرفته"
            >
              <SlidersHorizontal size={17} />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. HORIZONTAL DATE STRIP (نوار تاریخ افقی)                                */}
        {/* ========================================================================= */}
        <div className="max-w-xl mx-auto px-4 pb-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {[
              { id: 'today', label: 'امروز (پنج‌شنبه)', sub: '۲ شهریور' },
              { id: 'tomorrow', label: 'فردا (جمعه)', sub: '۳ شهریور' },
              { id: 'week', label: 'این هفته', sub: '۷ روز آینده' },
              { id: 'muharram', label: '🏴 ویژه محرم', sub: 'سوگواری سنتی' },
            ].map((chip) => {
              const isActive = activeDateFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setActiveDateFilter(chip.id as DateChipKey)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[#B4552D] text-white shadow-xs scale-102 ring-2 ring-[#B4552D]/20'
                      : 'bg-white text-stone-700 border border-stone-200/80 hover:bg-stone-50'
                  }`}
                >
                  <span>{chip.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                      isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {chip.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. QUICK CATEGORY TABS (تب‌های دسته‌بندی سریع)                            */}
        {/* ========================================================================= */}
        <div className="max-w-xl mx-auto px-4 pb-2 overflow-x-auto no-scrollbar border-t border-stone-200/40 pt-2">
          <div className="flex items-center gap-1.5 min-w-max">
            {CATEGORY_TABS.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[#1F2430] text-white shadow-xs font-black'
                      : 'bg-white/70 text-stone-600 hover:bg-white hover:text-stone-900 border border-transparent'
                  }`}
                >
                  <span className="text-sm">{cat.emoji}</span>
                  <span>{cat.label}</span>
                  {cat.id === 'urgent' && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TOAST NOTIFICATION (پیام فیدبک سریع)                                      */}
      {/* ========================================================================= */}
      {toastMessage && (
        <div className="fixed top-24 left-4 right-4 z-50 max-w-sm mx-auto p-3 bg-stone-900/90 backdrop-blur-md text-[#FAF7F2] rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-3 border border-stone-700">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACTIVE ADVANCED FILTERS CHIP BAR                                          */}
      {/* ========================================================================= */}
      {(selectedNeighborhood !== 'all' || filterWomenOnly || filterNazriOnly || filterLiveBroadcastOnly) && (
        <div className="max-w-xl mx-auto px-4 pt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-stone-500 font-bold">فیلترهای فعال:</span>
          {selectedNeighborhood !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#0E7C86]/10 text-[#0E7C86] text-xs font-bold border border-[#0E7C86]/20">
              <span>{selectedNeighborhood}</span>
              <X size={12} className="cursor-pointer" onClick={() => setSelectedNeighborhood('all')} />
            </span>
          )}
          {filterNazriOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
              <span>🍲 دارای نذری</span>
              <X size={12} className="cursor-pointer" onClick={() => setFilterNazriOnly(false)} />
            </span>
          )}
          {filterWomenOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-900 text-xs font-bold">
              <span>🧕 ویژه بانوان</span>
              <X size={12} className="cursor-pointer" onClick={() => setFilterWomenOnly(false)} />
            </span>
          )}
          {filterLiveBroadcastOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-900 text-xs font-bold">
              <span>📡 پخش زنده</span>
              <X size={12} className="cursor-pointer" onClick={() => setFilterLiveBroadcastOnly(false)} />
            </span>
          )}
          <button
            onClick={() => {
              setSelectedNeighborhood('all');
              setFilterWomenOnly(false);
              setFilterNazriOnly(false);
              setFilterLiveBroadcastOnly(false);
            }}
            className="text-[11px] text-[#B4552D] font-bold underline cursor-pointer mr-auto"
          >
            پاک کردن همه
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CARDS FEED (فید کارت‌های اطلاعیه و رویدادها)                           */}
      {/* ========================================================================= */}
      <main className="max-w-xl mx-auto px-4 pt-3.5 space-y-3.5">
        
        {/* Count Summary */}
        <div className="flex items-center justify-between text-xs font-black text-stone-500 px-1">
          <span>
            نمایش {toPersianDigits(filteredEvents.length)} اطلاعیه و مراسم فعال
          </span>
          <span className="flex items-center gap-1 text-[#0E7C86]">
            <Radio size={13} className="animate-pulse" />
            <span>به‌روزرسانی خودکار</span>
          </span>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto text-2xl">
              🔍
            </div>
            <h3 className="font-black text-sm text-stone-800">
              اطلاعیه‌ای با این مشخصات یافت نشد
            </h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              می‌توانید فیلترها را تغییر دهید یا به عنوان خادم مسجد، اطلاعیه جدید ثبت کنید.
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setActiveDateFilter('today');
                setSelectedNeighborhood('all');
              }}
              className="px-4 py-2 bg-[#B4552D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              نمایش همه رویدادها
            </button>
          </div>
        ) : (
          /* Cards List */
          filteredEvents.map((event) => {
            const timeBadge = getSmartTimeBadge(event);
            const isReminded = remindedEventIds.includes(event.id);
            const place = places.find((p) => p.id === event.placeId);
            const avatarUrl =
              event.placeAvatar ||
              place?.images?.[0] ||
              'https://images.unsplash.com/photo-1590076212470-36e2f18374a4?auto=format&fit=crop&w=400&q=80';

            return (
              <article
                key={event.id}
                id={`announcement-card-${event.id}`}
                onClick={() => onSelectEvent && onSelectEvent(event)}
                className={`group bg-white rounded-3xl p-4 sm:p-5 border transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer ${
                  event.isUrgent
                    ? 'border-amber-400/80 ring-2 ring-amber-400/20 bg-amber-50/20'
                    : timeBadge.isLive
                    ? 'border-rose-400/70 ring-2 ring-rose-400/20'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                {/* 1. Header: Avatar + Place Name + Neighborhood + Time Badge */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  
                  {/* Mosque Avatar & Details */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={avatarUrl}
                      alt={event.placeName}
                      className="w-12 h-12 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-black text-sm text-[#1F2430] truncate group-hover:text-[#B4552D] transition-colors">
                          {event.placeName}
                        </h2>
                      </div>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 font-medium mt-0.5 truncate">
                        <MapPin size={12} className="text-[#B4552D] shrink-0" />
                        <span>{event.neighborhood}</span>
                      </p>
                    </div>
                  </div>

                  {/* Smart Relative Time Badge */}
                  <div className="shrink-0">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-xl text-[11px] leading-tight shadow-2xs ${timeBadge.className}`}
                    >
                      {timeBadge.text}
                    </span>
                  </div>
                </div>

                {/* 2. Urgent Notice Alert if present */}
                {event.isUrgent && event.urgentNote && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-700 shrink-0" />
                    <span>{event.urgentNote}</span>
                  </div>
                )}

                {/* 3. Main Title */}
                <h3 className="font-black text-sm sm:text-base text-[#1F2430] leading-snug mb-2.5">
                  {event.title}
                </h3>

                {/* 4. Speaker & Eulogist Info Chips */}
                {(event.speaker || event.eulogist || event.qari) && (
                  <div className="flex items-center gap-2 flex-wrap mb-3 text-xs text-stone-700">
                    {event.speaker && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-200/80 font-bold">
                        <Mic2 size={13} className="text-[#0E7C86]" />
                        <span>سخنران: {event.speaker}</span>
                      </div>
                    )}
                    {event.eulogist && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 border border-stone-200/80 font-bold">
                        <span className="text-[#B4552D]">🏴</span>
                        <span>مداح: {event.eulogist}</span>
                      </div>
                    )}
                    {event.qari && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold">
                        <span>📖</span>
                        <span>قاری: {event.qari}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Service / Feature Icons (نذری، پخش زنده، بانوان، شوادون) */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4 pt-1 border-t border-stone-100 text-[11px]">
                  {/* Nazri / Food */}
                  {(event.hasNazri || event.hasDinner) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-black">
                      <Utensils size={12} className="text-amber-700" />
                      <span>{event.nazriDetails || 'توزیع اطعام و نذری'}</span>
                    </span>
                  )}

                  {/* Women Section */}
                  {event.isWomenOnly ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 font-bold">
                      <span>🧕</span>
                      <span>ویژه بانوان</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 font-medium">
                      <span>👥</span>
                      <span>خواهران و برادران</span>
                    </span>
                  )}

                  {/* Live Broadcast */}
                  {event.hasLiveBroadcast && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-bold">
                      <Radio size={12} className="animate-pulse" />
                      <span>پخش زنده اینترنتی</span>
                    </span>
                  )}

                  {/* Kids / Youth */}
                  {event.isKids && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                      <span>👶</span>
                      <span>ویژه نونهالان</span>
                    </span>
                  )}

                  {/* Shavadan */}
                  {place?.hasShavadan && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#B4552D]/10 text-[#B4552D] font-bold">
                      <span>🏛️</span>
                      <span>شوادون سنتی</span>
                    </span>
                  )}

                  {/* Share button */}
                  <button
                    onClick={(e) => handleShareEvent(event, e)}
                    className="mr-auto p-1 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                    aria-label="اشتراک‌گذاری"
                  >
                    <Share2 size={15} />
                  </button>
                </div>

                {/* 6. BOTTOM ACTION BUTTONS: مسیریابی (فیروزه‌ای) + یادآوری کن (خطی) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  
                  {/* Primary Button: مسیریابی (فیروزه‌ای #0E7C86) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNavigationPlace({
                        name: event.placeName,
                        coords: event.coordinates,
                      });
                    }}
                    className="py-2.5 px-3 rounded-2xl bg-[#0E7C86] hover:bg-[#0a5e66] active:scale-[0.98] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Navigation size={15} />
                    <span>مسیریابی به مکان</span>
                  </button>

                  {/* Secondary Button: یادآوری کن (خطی با تغییر حالت زنده) */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleReminder(event, e)}
                    className={`py-2.5 px-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isReminded
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-stone-400'
                    }`}
                  >
                    {isReminded ? (
                      <>
                        <Check size={15} className="text-emerald-600 stroke-[3]" />
                        <span>یادآوری فعال شد</span>
                      </>
                    ) : (
                      <>
                        <Bell size={15} className="text-stone-500" />
                        <span>یادآوری کن</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </main>

      {/* ========================================================================= */}
      {/* 5. FLOATING ACTION BUTTON (FAB) - پایین سمت چپ در حالت RTL                  */}
      {/* ========================================================================= */}
      <aside aria-label="اقدام سریع" className="fixed bottom-20 left-4 sm:left-6 z-40">
        <button
          id="khadem-submit-announcement-fab"
          onClick={() => setIsSubmitModalOpen(true)}
          className="group relative flex items-center gap-2 bg-[#B4552D] hover:bg-[#9d4723] text-white p-3.5 sm:px-4 sm:py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer"
          aria-label="ثبت اطلاعیه جدید توسط خادم"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
          </div>
          <span className="font-black text-xs sm:text-sm whitespace-nowrap pl-1">
            ثبت اطلاعیه خادم
          </span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
          </span>
        </button>
      </aside>

      {/* ========================================================================= */}
      {/* MODAL 1: SUBMIT ANNOUNCEMENT MODAL BY KHADEM                             */}
      {/* ========================================================================= */}
      {isSubmitModalOpen && (
        <SubmitAnnouncementModal
          places={places}
          onClose={() => setIsSubmitModalOpen(false)}
          onSubmitSuccess={handleAnnouncementSuccess}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NOTIFICATION CENTER DRAWER                                       */}
      {/* ========================================================================= */}
      {isNotificationCenterOpen && (
        <div
          id="notification-center-overlay"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="absolute inset-0" onClick={() => setIsNotificationCenterOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-stone-200 max-h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#B4552D]/10 text-[#B4552D] flex items-center justify-center font-bold">
                  <BellRing size={18} />
                </div>
                <h3 className="font-black text-base text-[#1F2430]">
                  یادآورهای فعال شما ({toPersianDigits(remindedEventIds.length)})
                </h3>
              </div>
              <button
                onClick={() => setIsNotificationCenterOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="py-3 overflow-y-auto flex-1 space-y-2.5">
              {remindedEventIds.length === 0 ? (
                <div className="p-6 text-center text-stone-500 text-xs">
                  هیچ یادآوری برای مراسم‌ها تنظیم نشده است. روی دکمه «یادآوری کن» در کارت‌های مراسم بزنید تا قبل از شروع مطلع شوید.
                </div>
              ) : (
                feedEvents
                  .filter((e) => remindedEventIds.includes(e.id))
                  .map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <span className="font-black text-xs text-stone-900 block truncate">
                          {evt.placeName}
                        </span>
                        <span className="text-[11px] text-stone-500 truncate block">
                          {evt.title} ({evt.time})
                        </span>
                      </div>
                      <button
                        onClick={() => handleToggleReminder(evt)}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 shrink-0 cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-stone-200">
              <button
                onClick={() => {
                  if ('Notification' in window && Notification.permission !== 'granted') {
                    Notification.requestPermission();
                  }
                  showToast('✅ اعلان‌های مرورگر برای رویدادهای انتخابی شما فعال شد.');
                  setIsNotificationCenterOpen(false);
                }}
                className="w-full py-2.5 bg-[#0E7C86] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                دریافت هشدار سیستمی روی گوشی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADVANCED FILTERS SHEET                                           */}
      {/* ========================================================================= */}
      {isAdvancedFilterOpen && (
        <div
          id="advanced-filters-overlay"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="absolute inset-0" onClick={() => setIsAdvancedFilterOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-stone-200 max-h-[85vh] flex flex-col space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#0E7C86]" />
                <h3 className="font-black text-base text-[#1F2430]">
                  فیلتر پیشرفته رویدادها
                </h3>
              </div>
              <button
                onClick={() => setIsAdvancedFilterOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 overflow-y-auto flex-1">
              
              {/* Neighborhood selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-stone-800">
                  انتخاب محله دزفول:
                </label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full bg-white p-3 rounded-2xl border border-stone-300 text-xs font-bold text-stone-800 focus:outline-none"
                >
                  <option value="all">همه محلات دزفول</option>
                  {neighborhoodsList.map((nh) => (
                    <option key={nh} value={nh}>
                      {nh}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-black text-stone-800">
                  خدمات و ویژگی‌های خاص:
                </label>

                {/* Nazri Only */}
                <button
                  type="button"
                  onClick={() => setFilterNazriOnly(!filterNazriOnly)}
                  className={`w-full p-3 rounded-xl border text-right text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                    filterNazriOnly ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-white border-stone-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Utensils size={15} className="text-amber-700" />
                    <span>فقط مراسم‌های دارای توزیع نذری و اطعام</span>
                  </span>
                  {filterNazriOnly && <Check size={15} className="text-amber-700" />}
                </button>

                {/* Women Only */}
                <button
                  type="button"
                  onClick={() => setFilterWomenOnly(!filterWomenOnly)}
                  className={`w-full p-3 rounded-xl border text-right text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                    filterWomenOnly ? 'bg-purple-50 border-purple-400 text-purple-900' : 'bg-white border-stone-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>🧕</span>
                    <span>فقط همایش‌ها و برنامه‌های ویژه بانوان</span>
                  </span>
                  {filterWomenOnly && <Check size={15} className="text-purple-700" />}
                </button>

                {/* Live Broadcast */}
                <button
                  type="button"
                  onClick={() => setFilterLiveBroadcastOnly(!filterLiveBroadcastOnly)}
                  className={`w-full p-3 rounded-xl border text-right text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                    filterLiveBroadcastOnly ? 'bg-rose-50 border-rose-400 text-rose-900' : 'bg-white border-stone-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Radio size={15} className="text-rose-600" />
                    <span>فقط مراسم‌های دارای پخش زنده اینترنتی</span>
                  </span>
                  {filterLiveBroadcastOnly && <Check size={15} className="text-rose-600" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-stone-200">
              <button
                onClick={() => {
                  setSelectedNeighborhood('all');
                  setFilterWomenOnly(false);
                  setFilterNazriOnly(false);
                  setFilterLiveBroadcastOnly(false);
                }}
                className="w-1/3 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold"
              >
                بازنشانی
              </button>
              <button
                onClick={() => setIsAdvancedFilterOpen(false)}
                className="w-2/3 py-2.5 bg-[#0E7C86] text-white rounded-xl text-xs font-black shadow-xs"
              >
                اعمال فیلترها ({toPersianDigits(filteredEvents.length)} مورد)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: NAVIGATION APP CHOOSER (نشان، بلد، گوگل مپ)                      */}
      {/* ========================================================================= */}
      {activeNavigationPlace && (
        <div
          id="navigation-app-modal-overlay"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="absolute inset-0" onClick={() => setActiveNavigationPlace(null)} />
          <div className="relative z-10 w-full max-w-sm bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-[#0E7C86]" />
                <h3 className="font-black text-sm text-[#1F2430] truncate">
                  مسیریابی به {activeNavigationPlace.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveNavigationPlace(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600"
              >
                <X size={15} />
              </button>
            </div>

            <div className="py-4 space-y-2">
              <p className="text-xs text-stone-500 mb-2">
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
    </div>
  );
};
