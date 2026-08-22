import React, { useState, useMemo } from 'react';
import { EventItem, EventCategoryFilter, NeighborhoodCategory, Place } from '../types';
import { DEZFUL_NEIGHBORHOODS } from '../data/dezfulData';
import { 
  toPersianDigits, 
  getPlaceTypeName, 
  getNavigationLinks,
  calculateDistance,
  formatDistance
} from '../utils/persianUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Mic2,
  UserCheck,
  Bell,
  Check,
  Share2,
  Navigation,
  Sparkles,
  Flame,
  Filter,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Radio,
  HeartHandshake,
  BookOpen,
  PartyPopper,
  Users,
  Baby,
  Video,
  Utensils,
  CheckCircle2,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface EventsViewProps {
  events: EventItem[];
  places: Place[];
  userCoords: [number, number] | null;
  onSelectPlaceById: (placeId: string) => void;
  onSelectEvent: (event: EventItem) => void;
}

// 7-day strip date definition
interface DayStripItem {
  offset: number; // 0 for today, 1 for tomorrow, etc.
  dayName: string; // e.g. پنج‌شنبه
  solarDateNumber: number; // e.g. 2
  solarMonth: string; // e.g. شهریور
  fullTitle: string; // e.g. پنج‌شنبه ۲ شهریور
  isToday: boolean;
}

const SEVEN_DAYS: DayStripItem[] = [
  { offset: 0, dayName: 'پنج‌شنبه', solarDateNumber: 2, solarMonth: 'شهریور', fullTitle: 'امروز (۲ شهریور)', isToday: true },
  { offset: 1, dayName: 'جمعه', solarDateNumber: 3, solarMonth: 'شهریور', fullTitle: 'جمعه ۳ شهریور', isToday: false },
  { offset: 2, dayName: 'شنبه', solarDateNumber: 4, solarMonth: 'شهریور', fullTitle: 'شنبه ۴ شهریور', isToday: false },
  { offset: 3, dayName: 'یکشنبه', solarDateNumber: 5, solarMonth: 'شهریور', fullTitle: 'یکشنبه ۵ شهریور', isToday: false },
  { offset: 4, dayName: 'دوشنبه', solarDateNumber: 6, solarMonth: 'شهریور', fullTitle: 'دوشنبه ۶ شهریور', isToday: false },
  { offset: 5, dayName: 'سه‌شنبه', solarDateNumber: 7, solarMonth: 'شهریور', fullTitle: 'سه‌شنبه ۷ شهریور', isToday: false },
  { offset: 6, dayName: 'چهارشنبه', solarDateNumber: 8, solarMonth: 'شهریور', fullTitle: 'چهارشنبه ۸ شهریور', isToday: false },
  { offset: 7, dayName: 'پنج‌شنبه', solarDateNumber: 9, solarMonth: 'شهریور', fullTitle: 'پنج‌شنبه ۹ شهریور', isToday: false },
];

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  places,
  userCoords,
  onSelectPlaceById,
  onSelectEvent,
}) => {
  // 1. View Mode: List vs Monthly Calendar
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // 2. Selected Day in 7-day strip (null means "All upcoming days")
  const [selectedDayOffset, setSelectedDayOffset] = useState<number | null>(null);

  // 3. Category Filter
  const [selectedCategory, setSelectedCategory] = useState<EventCategoryFilter>('all');

  // 4. Neighborhood Filter
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('all');

  // 5. Selected Day for Monthly Calendar View (1-31)
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<number>(2);

  // 6. Reminder State (locally toggled)
  const [remindedEvents, setRemindedEvents] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle Reminder
  const toggleReminder = (eventId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (remindedEvents.includes(eventId)) {
      setRemindedEvents(remindedEvents.filter((id) => id !== eventId));
    } else {
      setRemindedEvents([...remindedEvents, eventId]);
    }
  };

  // Handle Share
  const handleShare = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📌 مراسم: ${event.title}\n📍 مکان: ${event.placeName} (${event.neighborhood})\n🗓 زمان: ${event.dateSolar} - ساعت ${event.time}\n${event.speaker ? `🎙 سخنران: ${event.speaker}\n` : ''}${event.eulogist ? `🏴 مداح: ${event.eulogist}\n` : ''}سامانه مساجد و حسینیه‌های دزفول`;
    if (navigator.share) {
      navigator.share({ title: event.title, text });
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filter tonight's featured ceremonies for "امشب در دزفول"
  const tonightEvents = useMemo(() => {
    return events.filter((evt) => evt.dayOffset === 0 || evt.status === 'live' || evt.isTonightFeatured);
  }, [events]);

  // Filter events based on active controls
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // If in Calendar mode, filter by calendar selected day
      if (viewMode === 'calendar') {
        if (calendarSelectedDay && evt.solarDayNumber !== calendarSelectedDay) {
          return false;
        }
      } else {
        // In List mode, filter by selectedDayOffset if chosen
        if (selectedDayOffset !== null && evt.dayOffset !== selectedDayOffset) {
          return false;
        }
      }

      // Filter by Category
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'women_only' && !evt.isWomenOnly && evt.categoryFilter !== 'women_only') {
          return false;
        }
        if (selectedCategory === 'kids_youth' && !evt.isKids && evt.categoryFilter !== 'kids_youth') {
          return false;
        }
        if (selectedCategory !== 'women_only' && selectedCategory !== 'kids_youth' && evt.categoryFilter !== selectedCategory) {
          return false;
        }
      }

      // Filter by Neighborhood
      if (selectedNeighborhood !== 'all') {
        if (evt.neighborhoodCategory !== selectedNeighborhood && !evt.neighborhood.includes(selectedNeighborhood)) {
          return false;
        }
      }

      return true;
    });
  }, [events, viewMode, calendarSelectedDay, selectedDayOffset, selectedCategory, selectedNeighborhood]);

  // Calendar month days calculation (Shahrivar: 31 days)
  const monthDays = useMemo(() => {
    return Array.from({ length: 31 }, (_, i) => i + 1);
  }, []);

  // Events count map for calendar days
  const eventsCountPerDay = useMemo(() => {
    const map: Record<number, number> = {};
    events.forEach((evt) => {
      map[evt.solarDayNumber] = (map[evt.solarDayNumber] || 0) + 1;
    });
    return map;
  }, [events]);

  return (
    <div className="w-full space-y-6 pb-12 font-['Vazirmatn',sans-serif]" dir="rtl">
      
      {/* 1. HEADER & VIEW MODE TOGGLE (لیست / تقویم ماهانه) */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-[#B4552D] animate-pulse" />
              <h1 className="text-lg sm:text-2xl font-black text-[#1F2430]">
                تقویم مراسم و مجالس مذهبی دزفول
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 font-medium">
              اطلاع‌رسانی مجالس عزاداری محرم و صفر، شب‌های قدر، دعای کمیل، محافل قرآنی و جشن‌های آیینی
            </p>
          </div>

          {/* List vs Monthly Calendar View Switcher */}
          <div className="flex items-center bg-[#FAF7F2] p-1.5 rounded-2xl border border-stone-200 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#B4552D] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <List size={15} />
              <span>نمای فهرستی</span>
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#B4552D] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <CalendarDays size={15} />
              <span>تقویم ماهانه (شهریور)</span>
            </button>
          </div>
        </div>

        {/* 2. HORIZONTAL SOLAR DATE STRIP (نوار تاریخ شمسی افقی: امروز + ۷ روز) */}
        {viewMode === 'list' && (
          <div className="mt-5 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                <Calendar size={14} className="text-[#B4552D]" />
                <span>انتخاب تاریخ مراسم:</span>
              </div>

              {selectedDayOffset !== null && (
                <button
                  onClick={() => setSelectedDayOffset(null)}
                  className="text-[11px] font-bold text-[#B4552D] hover:underline cursor-pointer"
                >
                  نمایش همه روزها ({toPersianDigits(events.length)} مراسم)
                </button>
              )}
            </div>

            {/* Horizontal Scrollable Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
              <button
                onClick={() => setSelectedDayOffset(null)}
                className={`shrink-0 flex flex-col items-center justify-center min-w-[70px] py-2 px-2.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedDayOffset === null
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-[#FAF7F2] hover:bg-stone-100 text-stone-700 border-stone-200'
                }`}
              >
                <span className="text-[10px] font-medium opacity-80">کل برنامه</span>
                <span className="text-xs font-black mt-0.5">همهٔ ایام</span>
              </button>

              {SEVEN_DAYS.map((day) => {
                const isSelected = selectedDayOffset === day.offset;
                const countForDay = events.filter((e) => e.dayOffset === day.offset).length;

                return (
                  <button
                    key={day.offset}
                    onClick={() => setSelectedDayOffset(day.offset)}
                    className={`relative shrink-0 flex flex-col items-center justify-center min-w-[84px] py-2 px-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#B4552D] text-white border-[#B4552D] shadow-md ring-2 ring-[#B4552D]/30 scale-105'
                        : day.isToday
                        ? 'bg-amber-500/10 border-amber-400 text-amber-950 hover:bg-amber-500/20'
                        : 'bg-white hover:bg-[#FAF7F2] text-stone-700 border-stone-200'
                    }`}
                  >
                    {day.isToday && (
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full mb-0.5 ${
                        isSelected ? 'bg-white text-[#B4552D]' : 'bg-[#B4552D] text-white'
                      }`}>
                        امروز
                      </span>
                    )}

                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-white' : 'text-stone-500'}`}>
                      {day.dayName}
                    </span>

                    <span className="text-base font-black leading-tight my-0.5">
                      {toPersianDigits(day.solarDateNumber)} {day.solarMonth}
                    </span>

                    <span className={`text-[10px] font-medium ${
                      isSelected ? 'text-white/90' : countForDay > 0 ? 'text-[#0E7C86] font-bold' : 'text-stone-400'
                    }`}>
                      {countForDay > 0 ? `${toPersianDigits(countForDay)} مراسم` : 'بدون مراسم'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. SECTION: امشب در دزفول (کارتهای بزرگ مراسم‌های امروز) */}
      {viewMode === 'list' && (selectedDayOffset === null || selectedDayOffset === 0) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-[#B4552D]">
                <Flame size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#1F2430] flex items-center gap-2">
                  <span>بخش ویژه: امشب در دزفول</span>
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    زنده و امشب
                  </span>
                </h2>
                <p className="text-[11px] text-stone-500">
                  مهم‌ترین تجمعات، سوگواری‌ها و محافل قرآنی شاخص امشب شهر دزفول
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-stone-500 bg-white px-2.5 py-1 rounded-xl border border-stone-200 hidden sm:inline-block">
              {toPersianDigits(tonightEvents.length)} مجلس شاخص
            </span>
          </div>

          {/* Large Cards Carousel / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tonightEvents.map((evt) => {
              const isLive = evt.status === 'live';
              const isReminded = remindedEvents.includes(evt.id);
              const navLinks = getNavigationLinks(evt.coordinates[0], evt.coordinates[1], evt.placeName);

              return (
                <div
                  key={evt.id}
                  id={`featured-tonight-${evt.id}`}
                  onClick={() => onSelectEvent(evt)}
                  className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group cursor-pointer"
                >
                  {/* Top Cover Banner */}
                  <div className="relative h-40 w-full overflow-hidden bg-stone-900">
                    <img
                      src={evt.coverImage || 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=1000&q=80'}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 right-3 left-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isLive ? (
                          <span className="bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-md animate-pulse">
                            <Radio size={13} />
                            <span>در حال برگزاری</span>
                          </span>
                        ) : (
                          <span className="bg-amber-500 text-stone-950 text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md">
                            <Clock size={13} />
                            <span>امشب ساعت {evt.time}</span>
                          </span>
                        )}
                      </div>

                      <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-xl border border-white/20">
                        {evt.typeName}
                      </span>
                    </div>

                    {/* Banner Bottom Info */}
                    <div className="absolute bottom-3 right-3 left-3 text-white">
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 font-semibold mb-0.5">
                        <MapPin size={13} className="shrink-0" />
                        <span>{evt.placeName}</span>
                        <span className="text-white/60">({evt.neighborhood})</span>
                      </div>
                      <h3 className="font-black text-base sm:text-lg leading-snug line-clamp-1 text-white">
                        {evt.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Speakers / Eulogists / Qari */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#FAF7F2] p-2.5 rounded-2xl border border-stone-200/80 mb-3">
                        {evt.speaker && (
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <UserCheck size={14} className="text-[#0E7C86] shrink-0" />
                            <span className="text-stone-500">سخنران:</span>
                            <span className="font-bold text-stone-900 truncate">{evt.speaker}</span>
                          </div>
                        )}
                        {evt.eulogist && (
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <Mic2 size={14} className="text-[#B4552D] shrink-0" />
                            <span className="text-stone-500">مداح:</span>
                            <span className="font-bold text-stone-900 truncate">{evt.eulogist}</span>
                          </div>
                        )}
                        {evt.qari && (
                          <div className="flex items-center gap-1.5 text-stone-700">
                            <BookOpen size={14} className="text-[#0E7C86] shrink-0" />
                            <span className="text-stone-500">قاری:</span>
                            <span className="font-bold text-stone-900 truncate">{evt.qari}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags row */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {evt.tags?.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-stone-200"
                          >
                            {tag}
                          </span>
                        ))}
                        {evt.hasDinner && (
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <Utensils size={11} />
                            <span>اطعام تبرکی</span>
                          </span>
                        )}
                        {evt.hasLiveBroadcast && (
                          <span className="bg-purple-50 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                            <Video size={11} />
                            <span>پخش زنده</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt);
                        }}
                        className="bg-[#FAF7F2] hover:bg-stone-100 text-stone-900 font-bold px-3 py-2 rounded-xl border border-stone-300 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>جزئیات کامل</span>
                        <ChevronLeft size={14} />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={navLinks.neshan}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[#B4552D] hover:bg-[#963E19] text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Navigation size={13} />
                          <span>مسیریابی</span>
                        </a>

                        <button
                          onClick={(e) => toggleReminder(evt.id, e)}
                          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                            isReminded
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                          }`}
                          title="یادآوری پیامکی و نوتیفیکیشن"
                        >
                          {isReminded ? <Check size={14} className="text-emerald-700 font-black" /> : <Bell size={14} />}
                        </button>

                        <button
                          onClick={(e) => handleShare(evt, e)}
                          className="p-2 rounded-xl bg-white text-stone-600 border border-stone-300 hover:bg-stone-100 transition-colors"
                          title="اشتراک‌گذاری"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. FILTERS SECTION: نوع مراسم + انتخاب محله */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#B4552D]" />
            <h3 className="font-black text-sm text-[#1F2430]">
              فیلترهای هوشمند مراسم‌ها
            </h3>
          </div>

          {(selectedCategory !== 'all' || selectedNeighborhood !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedNeighborhood('all');
              }}
              className="text-xs font-bold text-[#B4552D] hover:underline cursor-pointer"
            >
              پاک‌کردن فیلترها ✕
            </button>
          )}
        </div>

        {/* Ceremony Type Filter Chips */}
        <div>
          <span className="text-[11px] font-bold text-stone-500 block mb-2">نوع مراسم:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              همهٔ انواع
            </button>

            <button
              onClick={() => setSelectedCategory('mourning')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'mourning'
                  ? 'bg-[#B4552D] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Flame size={13} />
              <span>عزاداری و سوگواری</span>
            </button>

            <button
              onClick={() => setSelectedCategory('celebration')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'celebration'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <PartyPopper size={13} />
              <span>جشن و مولودی</span>
            </button>

            <button
              onClick={() => setSelectedCategory('quran')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'quran'
                  ? 'bg-[#0E7C86] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <BookOpen size={13} />
              <span>قرآن و دارالقرآن</span>
            </button>

            <button
              onClick={() => setSelectedCategory('lecture')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'lecture'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <UserCheck size={13} />
              <span>سخنرانی و معارف</span>
            </button>

            <button
              onClick={() => setSelectedCategory('women_only')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'women_only'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Users size={13} />
              <span>ویژه بانوان</span>
            </button>

            <button
              onClick={() => setSelectedCategory('kids_youth')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'kids_youth'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Baby size={13} />
              <span>ویژه کودکان و نوجوانان</span>
            </button>
          </div>
        </div>

        {/* Neighborhood Filter Selector */}
        <div className="pt-2 border-t border-stone-100">
          <span className="text-[11px] font-bold text-stone-500 block mb-2">انتخاب محله دزفول:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedNeighborhood('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                selectedNeighborhood === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              همه محلات
            </button>

            {DEZFUL_NEIGHBORHOODS.map((nh) => (
              <button
                key={nh.id}
                onClick={() => setSelectedNeighborhood(nh.category)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  selectedNeighborhood === nh.category
                    ? 'bg-[#0E7C86] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nh.color }} />
                <span>{nh.categoryName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. MONTHLY CALENDAR VIEW (تقویم ماهانه شهریور / محرم) */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-2xs space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={20} className="text-[#B4552D]" />
              <h2 className="font-black text-base sm:text-lg text-[#1F2430]">
                تقویم روزشمار ماه شهریور ۱۴۰۵ (ایام اربعین و صفر)
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-bold">
              برای مشاهده مراسم‌های هر روز، روی روز مورد نظر کلیک کنید
            </span>
          </div>

          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-500 py-1 border-b border-stone-200">
            <span>شنبه</span>
            <span>۱ش</span>
            <span>۲ش</span>
            <span>۳ش</span>
            <span>۴ش</span>
            <span>۵ش</span>
            <span className="text-rose-600">جمعه</span>
          </div>

          {/* Calendar Grid 31 Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((dayNum) => {
              const isSelected = calendarSelectedDay === dayNum;
              const isToday = dayNum === 2;
              const count = eventsCountPerDay[dayNum] || 0;

              return (
                <button
                  key={dayNum}
                  onClick={() => setCalendarSelectedDay(dayNum)}
                  className={`min-h-[58px] sm:min-h-[68px] p-1 sm:p-2 rounded-2xl border transition-all flex flex-col justify-between items-center cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#B4552D] text-white border-[#B4552D] shadow-md ring-2 ring-[#B4552D]/20 scale-105 z-10'
                      : isToday
                      ? 'bg-amber-50 border-amber-300 text-stone-900 font-black'
                      : count > 0
                      ? 'bg-white hover:bg-[#FAF7F2] border-stone-200/90 text-stone-800'
                      : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] border-stone-100 text-stone-400'
                  }`}
                >
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black">
                      {toPersianDigits(dayNum)}
                    </span>
                    {isToday && (
                      <span className={`text-[8px] font-black px-1 rounded ${
                        isSelected ? 'bg-white text-[#B4552D]' : 'bg-[#B4552D] text-white'
                      }`}>
                        امروز
                      </span>
                    )}
                  </div>

                  {/* Indicator for Events count */}
                  {count > 0 && (
                    <span className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#0E7C86]/15 text-[#0E7C86]'
                    }`}>
                      {toPersianDigits(count)} مراسم
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">
              نمایش مراسم‌های روز {toPersianDigits(calendarSelectedDay)} شهریور ۱۴۰۵
            </span>
            <span className="font-bold text-[#B4552D]">
              {toPersianDigits(filteredEvents.length)} رویداد پیدا شد
            </span>
          </div>
        </div>
      )}

      {/* 6. CEREMONY CARDS LIST (لیست کارت مراسم) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#0E7C86]" />
            <h2 className="font-black text-base sm:text-lg text-[#1F2430]">
              {viewMode === 'calendar'
                ? `مراسم‌های روز ${toPersianDigits(calendarSelectedDay)} شهریور`
                : selectedDayOffset !== null
                ? `مراسم‌های ${SEVEN_DAYS.find((d) => d.offset === selectedDayOffset)?.fullTitle}`
                : 'تمام مراسم‌ها و مجالس پیش رو'}
            </h2>
          </div>

          <span className="text-xs font-bold text-stone-500 bg-white px-3 py-1 rounded-xl border border-stone-200">
            {toPersianDigits(filteredEvents.length)} مجلس مذهبی
          </span>
        </div>

        {/* Events Cards List */}
        {filteredEvents.length > 0 ? (
          <div className="space-y-3">
            {filteredEvents.map((evt) => {
              const isLive = evt.status === 'live';
              const isToday = evt.status === 'today' || evt.dayOffset === 0;
              const isReminded = remindedEvents.includes(evt.id);
              const navLinks = getNavigationLinks(evt.coordinates[0], evt.coordinates[1], evt.placeName);

              return (
                <div
                  key={evt.id}
                  id={`ceremony-item-${evt.id}`}
                  onClick={() => onSelectEvent(evt)}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Date Badge + Ceremony Type Badge + Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {/* Solar Date Badge */}
                        <span className="bg-[#FAF7F2] text-stone-900 text-xs px-3 py-1 rounded-xl font-black flex items-center gap-1.5 border border-stone-300/80 shadow-2xs">
                          <Calendar size={13} className="text-[#B4552D]" />
                          <span>{evt.dateSolar}</span>
                        </span>

                        {isLive ? (
                          <span className="bg-rose-600 text-white text-[11px] px-2.5 py-0.5 rounded-full font-black animate-pulse flex items-center gap-1 shadow-2xs">
                            <Radio size={11} />
                            <span>در حال برگزاری</span>
                          </span>
                        ) : isToday ? (
                          <span className="bg-amber-500/15 text-amber-900 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-amber-300">
                            امروز
                          </span>
                        ) : null}
                      </div>

                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-xl border ${
                        evt.categoryFilter === 'mourning'
                          ? 'bg-[#B4552D]/10 text-[#B4552D] border-[#B4552D]/20'
                          : evt.categoryFilter === 'celebration'
                          ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                          : evt.categoryFilter === 'quran'
                          ? 'bg-[#0E7C86]/10 text-[#0E7C86] border-[#0E7C86]/20'
                          : evt.categoryFilter === 'women_only'
                          ? 'bg-purple-100 text-purple-900 border-purple-200'
                          : 'bg-blue-50 text-blue-900 border-blue-200'
                      }`}>
                        {evt.typeName}
                      </span>
                    </div>

                    {/* Event Title */}
                    <h3 className="font-black text-base sm:text-lg text-[#1F2430] group-hover:text-[#0E7C86] leading-snug mb-2.5 transition-colors">
                      {evt.title}
                    </h3>

                    {/* Venue & Time Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#FAF7F2] p-3 rounded-2xl border border-stone-200/70 mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-[#0E7C86] shrink-0" />
                        <span className="font-black text-stone-900">{evt.placeName}</span>
                        <span className="text-stone-500 font-medium">({evt.neighborhood})</span>
                      </div>

                      <div className="flex items-center gap-1.5 sm:justify-end">
                        <Clock size={15} className="text-[#B4552D] shrink-0" />
                        <span className="text-stone-500">ساعت برگزاری:</span>
                        <span className="font-black text-stone-900">{evt.time}</span>
                      </div>
                    </div>

                    {/* Speaker & Eulogist & Qari info */}
                    {(evt.speaker || evt.eulogist || evt.qari) && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-700 mb-3 px-1">
                        {evt.speaker && (
                          <div className="flex items-center gap-1">
                            <UserCheck size={14} className="text-[#0E7C86]" />
                            <span className="text-stone-500">سخنران:</span>
                            <span className="font-bold text-stone-900">{evt.speaker}</span>
                          </div>
                        )}
                        {evt.eulogist && (
                          <div className="flex items-center gap-1">
                            <Mic2 size={14} className="text-[#B4552D]" />
                            <span className="text-stone-500">مداح:</span>
                            <span className="font-bold text-stone-900">{evt.eulogist}</span>
                          </div>
                        )}
                        {evt.qari && (
                          <div className="flex items-center gap-1">
                            <BookOpen size={14} className="text-[#0E7C86]" />
                            <span className="text-stone-500">قاری:</span>
                            <span className="font-bold text-stone-900">{evt.qari}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {evt.tags && evt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3 px-1">
                        {evt.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-white text-stone-600 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-stone-200"
                          >
                            {tag}
                          </span>
                        ))}
                        {evt.hasDinner && (
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            اطعام تبرکی
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions Row: Passport + Fast Navigation + Reminder + Share */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlaceById(evt.placeId);
                      }}
                      className="text-[#0E7C86] hover:text-[#095D65] font-black flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>شناسنامه و مشخصات مسجد</span>
                      <ChevronLeft size={14} />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Compact Navigation Button (دکمه کوچک مسیریابی) */}
                      <a
                        href={navLinks.neshan}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#B4552D] hover:bg-[#963E19] text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-2xs transition-colors"
                        title="مسیریابی سریع با نشان"
                      >
                        <Navigation size={12} />
                        <span className="text-[11px]">مسیریابی</span>
                      </a>

                      <button
                        onClick={(e) => handleShare(evt, e)}
                        className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 transition-colors"
                        title="اشتراک‌گذاری"
                      >
                        {copiedId === evt.id ? (
                          <span className="text-emerald-600 font-bold text-[10px] px-1">کپی شد</span>
                        ) : (
                          <Share2 size={14} />
                        )}
                      </button>

                      <button
                        onClick={(e) => toggleReminder(evt.id, e)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                          isReminded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        {isReminded ? <Check size={13} className="text-emerald-700" /> : <Bell size={13} />}
                        <span className="text-[11px]">{isReminded ? 'یادآور فعال' : 'یادآوری'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] text-stone-400 flex items-center justify-center mx-auto">
              <Calendar size={24} />
            </div>
            <div>
              <p className="font-black text-sm text-stone-800">
                مراسمی مطابق با فیلترهای انتخابی در این بازه زمانی یافت نشد.
              </p>
              <p className="text-xs text-stone-500 mt-1">
                می‌توانید فیلترها را تغییر داده یا همه مراسم‌ها را مشاهده نمایید.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedNeighborhood('all');
                setSelectedDayOffset(null);
              }}
              className="bg-[#B4552D] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs hover:bg-[#963E19] transition-colors cursor-pointer"
            >
              نمایش تمام مجالس مذهبی دزفول
            </button>
          </div>
        )}
      </section>

    </div>
  );
};
