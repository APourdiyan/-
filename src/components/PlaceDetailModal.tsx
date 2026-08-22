import React, { useState, useMemo } from 'react';
import { Place } from '../types';
import { DEZFUL_PLACES, UPCOMING_EVENTS } from '../data/dezfulData';
import { 
  toPersianDigits, 
  getPlaceTypeName, 
  getNavigationLinks, 
  formatDistance, 
  calculateDistance,
  getNextPrayerInfo
} from '../utils/persianUtils';
import {
  X,
  MapPin,
  Clock,
  Navigation,
  Phone,
  Bookmark,
  Share2,
  Users,
  Accessibility,
  BookOpen,
  Library,
  Droplets,
  Car,
  HeartHandshake,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit3,
  Flame,
  Check,
  Building2,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { NavigationOptionsModal } from './NavigationOptionsModal';
import { ReportOrEditModal } from './ReportOrEditModal';
import { MiniMapCard } from './MiniMapCard';

interface PlaceDetailModalProps {
  place: Place | null;
  onClose: () => void;
  userCoords: [number, number] | null;
  isSaved: boolean;
  onToggleSave: (placeId: string) => void;
  onSelectPlace?: (place: Place) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  onClose,
  userCoords,
  isSaved,
  onToggleSave,
  onSelectPlace,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!place) return null;

  // 1. Distance Calculation
  let distanceStr = '';
  if (userCoords) {
    const dist = calculateDistance(
      userCoords[0],
      userCoords[1],
      place.coordinates[0],
      place.coordinates[1]
    );
    distanceStr = formatDistance(dist);
  }

  // 2. Next Prayer Info
  const nextPrayer = getNextPrayerInfo(place.prayerTimes);

  // 3. Upcoming Events for this place
  const relatedEvents = UPCOMING_EVENTS.filter((e) => e.placeId === place.id);

  // 4. Nearby Places (sorted by distance from this place)
  const nearbyPlaces = useMemo(() => {
    return DEZFUL_PLACES
      .filter((p) => p.id !== place.id)
      .map((p) => {
        const dist = calculateDistance(
          place.coordinates[0],
          place.coordinates[1],
          p.coordinates[0],
          p.coordinates[1]
        );
        return { ...p, distFromHere: dist };
      })
      .sort((a, b) => a.distFromHere - b.distFromHere)
      .slice(0, 5);
  }, [place]);

  // Share handler
  const handleShare = () => {
    const text = `🕌 شناسنامه دیجیتال ${place.name}\n📍 محله: ${place.neighborhood}\n🏛 قدمت: ${place.historicalEra || 'تاریخی'}\nسامانه جامع مساجد و حسینیه‌های دزفول`;
    if (navigator.share) {
      navigator.share({ title: place.name, text });
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    }
  };

  const imagesList = place.images && place.images.length > 0
    ? place.images
    : ['https://images.unsplash.com/photo-1590076212470-36e2f18374a4?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200 font-['Vazirmatn',sans-serif]">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Digital Identity Sheet / Card Container */}
      <div 
        dir="rtl"
        className="relative z-10 w-full max-w-2xl bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-stone-300 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-250"
      >
        {/* Mobile top pill handle */}
        <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto my-2.5 shrink-0" />

        {/* 1. LARGE IMAGE HEADER WITH ARCHITECTURAL PHOTO & BADGES */}
        <div className="relative h-56 sm:h-64 bg-stone-900 shrink-0 overflow-hidden group">
          <img
            src={imagesList[activeImageIndex]}
            alt={place.name}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F2430] via-black/35 to-black/60" />

          {/* Top Bar with Badges & Close Button */}
          <div className="absolute top-3 right-3 left-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Place Type Badge */}
              <span
                className={`text-xs font-black px-3 py-1 rounded-full text-white shadow-md backdrop-blur-md ${
                  place.type === 'hussainiya'
                    ? 'bg-[#B4552D]'
                    : place.type === 'shrine'
                    ? 'bg-[#B38B1C]'
                    : 'bg-[#0E7C86]'
                }`}
              >
                {getPlaceTypeName(place.type)}
              </span>

              {/* Historic National Heritage Badge */}
              {place.isHistoric && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/90 text-stone-950 shadow-md backdrop-blur-md border border-amber-300">
                  <span className="text-sm">★</span>
                  <span>اثر تاریخی و ملی</span>
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md"
              aria-label="بستن شناسنامه"
            >
              <X size={18} />
            </button>
          </div>

          {/* Title, Neighborhood & Distance Over Image Bottom */}
          <div className="absolute bottom-3 right-4 left-4 text-white z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                شناسنامه دیجیتال مکان
              </span>
              {place.isOpenNow ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-600/90 text-white px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  اکنون باز است
                </span>
              ) : (
                <span className="text-[11px] font-semibold bg-stone-700/80 text-stone-200 px-2 py-0.5 rounded-md">
                  بسته (زمان اقامه نماز باز می‌شود)
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-md text-white">
              {place.name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-stone-200 mt-1">
              <span className="flex items-center gap-1 font-semibold text-stone-300">
                <MapPin size={13} className="text-[#B4552D]" />
                {place.neighborhood}
              </span>
              {distanceStr && (
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-bold text-[11px] text-amber-200">
                  فاصله تا موقعیت شما: {distanceStr}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. STICKY ACTION BAR: مسیریابی | تماس | اشتراک‌گذاری | ذخیره */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-stone-200 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-xs">
          {/* Main Action: Routing */}
          <button
            onClick={() => setIsNavModalOpen(true)}
            className="flex-1 bg-[#B4552D] hover:bg-[#963E19] text-white py-2.5 px-3 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Navigation size={15} />
            <span>مسیریابی (نشان / بلد)</span>
          </button>

          {/* Call Button */}
          {place.phone ? (
            <a
              href={`tel:${place.phone}`}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 py-2.5 px-3 rounded-2xl text-xs font-bold border border-stone-300/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="تماس با دفتر مسجد"
            >
              <Phone size={15} className="text-[#0E7C86]" />
              <span className="hidden xs:inline">تماس</span>
            </a>
          ) : (
            <button
              disabled
              className="bg-stone-100 text-stone-400 py-2.5 px-3 rounded-2xl text-xs font-bold border border-stone-200 flex items-center justify-center gap-1.5 shrink-0 opacity-60 cursor-not-allowed"
            >
              <Phone size={15} />
              <span className="hidden xs:inline">تماس</span>
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 py-2.5 px-3 rounded-2xl text-xs font-bold border border-stone-300/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            title="اشتراک‌گذاری اطلاعات"
          >
            {copiedShare ? <Check size={15} className="text-emerald-600" /> : <Share2 size={15} />}
            <span className="hidden xs:inline">{copiedShare ? 'کپی شد' : 'اشتراک'}</span>
          </button>

          {/* Save / Bookmark Button */}
          <button
            onClick={() => onToggleSave(place.id)}
            className={`py-2.5 px-3.5 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              isSaved
                ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300/80'
            }`}
            title={isSaved ? 'حذف از ذخیره‌ها' : 'نشان کردن'}
          >
            <Bookmark size={15} fill={isSaved ? '#D97706' : 'none'} className={isSaved ? 'text-amber-600' : 'text-stone-600'} />
            <span className="hidden xs:inline">{isSaved ? 'ذخیره شده' : 'ذخیره'}</span>
          </button>
        </div>

        {/* SCROLLABLE BODY OF DIGITAL PASSPORT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-[#1F2430]">
          
          {/* 3. TWO-LINE INTRODUCTION + ESTIMATED ERA */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
              <span className="text-xs font-black text-[#0E7C86] flex items-center gap-1">
                <Building2 size={15} />
                <span>معرفی و پیشینه تاریخی</span>
              </span>
              {place.historicalEra && (
                <span className="text-[11px] font-bold text-[#B4552D] bg-[#B4552D]/10 px-2.5 py-0.5 rounded-full">
                  قدمت: {place.historicalEra}
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {place.description}
            </p>

            {/* Traditional Architecture & Shavadan Highlight */}
            {place.hasShavadan && (
              <div className="mt-2 pt-2 border-t border-stone-100 flex items-start gap-2 bg-[#FAF7F2] p-2.5 rounded-xl text-xs text-stone-700">
                <Compass size={16} className="text-[#B4552D] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#B4552D] block">شوادون سنتی دزفول:</span>
                  <span className="text-[11px] text-stone-600 leading-normal">
                    {place.architectureDetails || 'دارای شوادون کهن دست‌کند در عمق ۱۰ متری با سرمایش مطبوع طبیعی و معماری خوون‌چینی آجری اصیل.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 4. FACILITIES GRID (8 ICONS) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-black text-sm text-[#1F2430] flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#0E7C86]" />
                <span>امکانات و خدمات رفاهی</span>
              </h3>
              <span className="text-[11px] text-stone-400">تجهیزات و بخش‌های فعال</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* 1. نماز جماعت */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                place.features.dailyPrayer !== false
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
              }`}>
                <Clock size={18} className={place.features.dailyPrayer !== false ? 'text-emerald-700' : 'text-stone-400'} />
                <span>نماز جماعت ۳ وعده</span>
              </div>

              {/* 2. وضوخانه */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                place.features.ablutionArea
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
              }`}>
                <Droplets size={18} className={place.features.ablutionArea ? 'text-emerald-700' : 'text-stone-400'} />
                <span>وضوخانه بهداشتی</span>
              </div>

              {/* 3. بخش بانوان */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                place.features.womenSection
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
              }`}>
                <Users size={18} className={place.features.womenSection ? 'text-emerald-700' : 'text-stone-400'} />
                <span>بخش مستقل بانوان</span>
              </div>

              {/* 4. پارکینگ */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                place.features.parking
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
              }`}>
                <Car size={18} className={place.features.parking ? 'text-emerald-700' : 'text-stone-400'} />
                <span>پارکینگ اختصاصی</span>
              </div>

              {/* 5. دسترسی معلول */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                place.features.wheelchairAccessible
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
              }`}>
                <Accessibility size={18} className={place.features.wheelchairAccessible ? 'text-emerald-700' : 'text-stone-400'} />
                <span>دسترسی توان‌یاب / رمپ</span>
              </div>

              {/* 6. کتابخانه */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                place.features.library
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
              }`}>
                <Library size={18} className={place.features.library ? 'text-emerald-700' : 'text-stone-400'} />
                <span>کتابخانه و قرائت‌خانه</span>
              </div>

              {/* 7. کلاس قرآن */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                place.features.quranClasses
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
              }`}>
                <BookOpen size={18} className={place.features.quranClasses ? 'text-emerald-700' : 'text-stone-400'} />
                <span>کانون و کلاس قرآن</span>
              </div>

              {/* 8. خیریه */}
              <div className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                place.features.charity !== false
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-bold'
                  : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
              }`}>
                <HeartHandshake size={18} className={place.features.charity !== false ? 'text-emerald-700' : 'text-stone-400'} />
                <span>صندوق خیریه و نیکوکاری</span>
              </div>
            </div>
          </div>

          {/* 5. PRAYER TIMELINE (MORNING / NOON / NIGHT) WITH NEXT PRAYER HIGHLIGHT */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-[#1F2430] flex items-center gap-1.5">
                <Clock size={16} className="text-[#0E7C86]" />
                <span>زمان‌بندی اقامه نماز جماعت</span>
              </h3>
              <span className="text-[11px] font-bold text-stone-500">
                امام جماعت: {place.imamName || 'آیت‌الله قاضی دزفولی'}
              </span>
            </div>

            {/* 3 Prayer Cards Timeline */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Fajr */}
              <div className={`p-3 rounded-2xl text-center border transition-all ${
                nextPrayer.name === 'صبح'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                  : 'bg-[#FAF7F2] border-stone-200'
              }`}>
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-600 mb-1">
                  <span>اذان صبح</span>
                  {nextPrayer.name === 'صبح' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
                <div className="text-base sm:text-lg font-black text-stone-900">
                  {place.prayerTimes.fajr}
                </div>
                {nextPrayer.name === 'صبح' && (
                  <span className="mt-1 inline-block text-[9px] font-bold bg-amber-500 text-stone-950 px-2 py-0.5 rounded-full">
                    نماز بعدی
                  </span>
                )}
              </div>

              {/* Dhuhr */}
              <div className={`p-3 rounded-2xl text-center border transition-all ${
                nextPrayer.name === 'ظهر و عصر'
                  ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
                  : 'bg-[#FAF7F2] border-stone-200'
              }`}>
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-600 mb-1">
                  <span>ظهر و عصر</span>
                  {nextPrayer.name === 'ظهر و عصر' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <div className="text-base sm:text-lg font-black text-stone-900">
                  {place.prayerTimes.dhuhr}
                </div>
                {nextPrayer.name === 'ظهر و عصر' && (
                  <span className="mt-1 inline-block text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    نماز بعدی
                  </span>
                )}
              </div>

              {/* Maghrib */}
              <div className={`p-3 rounded-2xl text-center border transition-all ${
                nextPrayer.name === 'مغرب و عشاء'
                  ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/40 shadow-sm'
                  : 'bg-[#FAF7F2] border-stone-200'
              }`}>
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-stone-600 mb-1">
                  <span>مغرب و عشاء</span>
                  {nextPrayer.name === 'مغرب و عشاء' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping" />
                  )}
                </div>
                <div className="text-base sm:text-lg font-black text-stone-900">
                  {place.prayerTimes.maghrib}
                </div>
                {nextPrayer.name === 'مغرب و عشاء' && (
                  <span className="mt-1 inline-block text-[9px] font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full">
                    نماز بعدی
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 6. UPCOMING CEREMONIES / EVENTS (مراسم پیش رو) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-black text-sm text-[#1F2430] flex items-center gap-1.5">
                <Calendar size={16} className="text-[#B4552D]" />
                <span>مراسم و رویدادهای پیش‌رو</span>
              </h3>
              <span className="text-[11px] text-stone-400">تقویم مراسمات مذهبی</span>
            </div>

            {relatedEvents.length > 0 ? (
              <div className="space-y-2.5">
                {relatedEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:border-[#B4552D] transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black bg-[#B4552D]/15 text-[#B4552D] px-2 py-0.5 rounded-md">
                          {evt.typeName}
                        </span>
                        <span className="text-xs font-bold text-stone-900">{evt.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-600">{evt.description}</p>
                      {evt.speaker && (
                        <span className="text-[11px] text-stone-500 block">
                          سخنران: <strong className="text-stone-800">{evt.speaker}</strong>
                        </span>
                      )}
                    </div>

                    <div className="text-left shrink-0 bg-[#FAF7F2] p-2 rounded-xl border border-stone-200">
                      <span className="text-[10px] font-bold text-stone-500 block">{evt.dateSolar}</span>
                      <span className="text-xs font-black text-[#0E7C86] block mt-0.5">{evt.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl border border-stone-200/90 text-center space-y-1">
                <p className="text-xs font-bold text-stone-700">برنامهٔ هفتگی تفسیر قرآن و احکام</p>
                <p className="text-[11px] text-stone-500">
                  جمعه‌ها پس از اقامه نماز مغرب و عشاء • با حضور عموم برادران و خواهران
                </p>
              </div>
            )}
          </div>

          {/* 7. HORIZONTAL IMAGE GALLERY */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-black text-sm text-[#1F2430] flex items-center gap-1.5">
                <Sparkles size={16} className="text-[#0E7C86]" />
                <span>گالری تصاویر و معماری</span>
              </h3>
              <span className="text-[11px] text-stone-400">
                {toPersianDigits(imagesList.length)} تصویر ثبت‌شده
              </span>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {imagesList.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-28 sm:w-36 h-20 sm:h-24 rounded-2xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#0E7C86] ring-2 ring-[#0E7C86]/30 scale-102'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`عکس ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 rounded backdrop-blur-xs font-mono">
                    {toPersianDigits(idx + 1)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 8. EXACT ADDRESS + MINI MAP + ACCESS LANDMARKS */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm text-[#1F2430] flex items-center gap-1.5">
                <MapPin size={16} className="text-[#B4552D]" />
                <span>نشانی دقیق و موقعیت جغرافیایی</span>
              </h3>
            </div>

            {/* Address */}
            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-semibold">
              {place.address}
            </p>

            {/* Access Landmark (نشانه‌های دسترسی) */}
            <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2 text-xs text-amber-950">
              <span className="font-bold text-[#B4552D] shrink-0">نشانه‌های دسترسی:</span>
              <span className="text-[11px] font-medium">
                {place.accessLandmark || 'نزدیک به بافت کهن و پل قدیم دزفول، دسترسی آسان از راسته بازار قدیم.'}
              </span>
            </div>

            {/* Mini Map Leaflet Card */}
            <MiniMapCard place={place} />
          </div>

          {/* 9. HORIZONTAL SCROLL: NEARBY PLACES (اماکن نزدیک) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-black text-sm text-[#1F2430] flex items-center gap-1.5">
                <Compass size={16} className="text-[#0E7C86]" />
                <span>اماکن و حسینیه‌های نزدیک</span>
              </h3>
              <span className="text-[11px] text-stone-400">در همین محله و بافت شهری</span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
              {nearbyPlaces.map((nearPlace) => (
                <div
                  key={nearPlace.id}
                  onClick={() => {
                    if (onSelectPlace) {
                      onSelectPlace(nearPlace);
                      setActiveImageIndex(0);
                    }
                  }}
                  className="w-48 sm:w-56 shrink-0 bg-white p-3 rounded-2xl border border-stone-200/90 hover:border-[#0E7C86] transition-all shadow-2xs cursor-pointer group"
                >
                  <div className="relative h-24 rounded-xl overflow-hidden mb-2 bg-stone-100">
                    <img
                      src={nearPlace.images[0]}
                      alt={nearPlace.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                      {getPlaceTypeName(nearPlace.type)}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-[#1F2430] group-hover:text-[#0E7C86] truncate">
                    {nearPlace.name}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                    <span className="truncate">{nearPlace.neighborhood}</span>
                    <span className="font-bold text-[#B4552D] font-mono shrink-0">
                      {formatDistance(nearPlace.distFromHere)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 10. SUBTLE "REPORT / EDIT INFO" BUTTON */}
          <div className="pt-2 text-center pb-4">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors py-1.5 px-3 rounded-full hover:bg-stone-200/60 cursor-pointer font-medium"
            >
              <Edit3 size={13} />
              <span>پیشنهاد اصلاح یا تکمیل اطلاعات این مکان</span>
            </button>
          </div>

        </div>
      </div>

      {/* Navigation App Modal */}
      {isNavModalOpen && (
        <NavigationOptionsModal
          place={place}
          onClose={() => setIsNavModalOpen(false)}
        />
      )}

      {/* Report / Edit Suggestion Modal */}
      {isReportModalOpen && (
        <ReportOrEditModal
          place={place}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};
