export type PlaceType = 'mosque' | 'hussainiya' | 'shrine' | 'historic_mosque';

export type NeighborhoodCategory = 'historic' | 'bazaar_center' | 'old_quarters' | 'new_towns' | 'riverside_suburbs';

export interface PlaceFeature {
  id: string;
  name: string;
  icon: string;
}

export interface PrayerTimes {
  fajr: string; // اذان صبح
  dhuhr: string; // ظهر و عصر
  maghrib: string; // مغرب و عشاء
}

export interface Place {
  id: string;
  name: string;
  type: PlaceType;
  neighborhood: string;
  neighborhoodCategory: NeighborhoodCategory;
  address: string;
  coordinates: [number, number]; // [lat, lng]
  historicalEra?: string; // مثلاً قرن سوم هجری / قاجاریه
  isHistoric: boolean;
  description: string;
  architectureDetails?: string; // مثلاً دارای خوون‌چینی آجری، گره‌چینی، شوادان با عمق ۱۲ متر
  hasShavadan: boolean; // شوادون (زیرزمین دست‌کند سنتی دزفول)
  images: string[];
  features: {
    womenSection: boolean; // بخش بانوان
    wheelchairAccessible: boolean; // مناسب توان‌یابان
    parking: boolean; // پارکینگ
    quranClasses: boolean; // کلاس قرآن
    library: boolean; // کتابخانه
    airConditioning: boolean; // سیستم سرمایش قوی (کولر دوتکه)
    ablutionArea: boolean; // وضوخانه بهداشتی
    charity?: boolean; // خیریه و صندوق قرض‌الحسنه
    dailyPrayer?: boolean; // اقامه ۳ وعده نماز جماعت
  };
  accessLandmark?: string; // نشانه‌های دسترسی (مثلاً: نزدیک پل قدیم، جنب ساباط صوفی)
  prayerTimes: PrayerTimes;
  imamName?: string; // نام امام جماعت
  boardOrMaddah?: string; // هیئت امنا یا خادم
  phone?: string;
  capacity?: number; // ظرفیت نفرات
  rating: number;
  isOpenNow: boolean;
  isFeatured?: boolean;
}

export type EventType = 
  | 'daily_prayer' 
  | 'ceremony' 
  | 'quran_class' 
  | 'tafsir' 
  | 'dua' 
  | 'mourning' 
  | 'celebration'
  | 'lecture';

export type EventCategoryFilter =
  | 'all'
  | 'mourning' 
  | 'celebration' 
  | 'quran' 
  | 'lecture' 
  | 'women_only' 
  | 'kids_youth'
  | 'nazri'
  | 'class_camp'
  | 'urgent';

export interface EventItem {
  id: string;
  placeId: string;
  placeName: string;
  placeType: PlaceType;
  neighborhood: string;
  neighborhoodCategory?: NeighborhoodCategory;
  title: string;
  speaker?: string; // سخنران
  eulogist?: string; // مداح / ذاکر
  qari?: string; // قاری قرآن
  dateSolar: string; // تاریخ شمسی (مثلاً: پنج‌شنبه ۲ شهریور ۱۴۰۵)
  solarDayOfWeek: string; // نام روز هفته (مثلاً: پنج‌شنبه)
  solarDayNumber: number; // شماره روز ماه شمسی (مثلاً: ۲)
  solarMonthName: string; // نام ماه شمسی (مثلاً: شهریور)
  dayOffset: number; // ۰ برای امروز، ۱ برای فردا و...
  dateFilterGroup?: 'today' | 'tomorrow' | 'week' | 'muharram';
  time: string; // ساعت (مثلاً: ۲۰:۳۰)
  relativeTimeBadge?: string; // بج زمانی هوشمند (مثلاً: ۲ ساعت مانده به اذان مغرب، امشب ساعت ۲۱:۳۰)
  type: EventType;
  typeName: string;
  categoryFilter: EventCategoryFilter;
  status: 'live' | 'today' | 'upcoming';
  description: string;
  gender: 'all' | 'men' | 'women';
  coordinates: [number, number];
  tags: string[]; // برچسب‌های کاربردی
  isTonightFeatured?: boolean; // آیا در بخش ویژه امشب در دزفول نمایش داده شود
  isWomenOnly?: boolean; // ویژه بانوان
  isKids?: boolean; // ویژه کودکان و نوجوانان
  hasDinner?: boolean; // اطعام / پذیرایی
  hasNazri?: boolean; // توزیع نذری
  nazriDetails?: string; // جزئیات نذری
  isUrgent?: boolean; // اطلاعیه فوری
  urgentType?: 'canceled' | 'time_change' | 'announcement';
  urgentNote?: string;
  hasLiveBroadcast?: boolean; // پخش زنده
  coverImage?: string; // تصویر پوستر یا فضای مراسم
  placeAvatar?: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  category: NeighborhoodCategory;
  categoryName: string;
  oneLiner: string; // یک خط توضیح عرفی (مثلاً «بافت آجری و گذرهای قدیمی»)
  guideTip: string; // لحن راهنمای محلی دانا
  mosquesCount: number; // تعداد مسجد
  hussainiyasCount: number; // تعداد حسینیه
  historicCount: number; // تعداد اثر تاریخی
  placesCount?: number;
  description?: string;
  highlight?: string;
  color: string; // رنگ تم ناحیه روی نقشه
  coordinates: [number, number]; // مرکز ناحیه
  polygon: [number, number][]; // چندضلعی ناحیه برای رسم محدوده روی نقشه
}

export interface UserSubmission {
  id: string;
  placeName: string;
  placeType: PlaceType;
  neighborhood: string;
  address: string;
  hasWomenSection: boolean;
  hasWheelchair: boolean;
  hasShavadan: boolean;
  imamName?: string;
  notes?: string;
  submittedAt: string;
}
