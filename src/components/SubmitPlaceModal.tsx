import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Place, PlaceType, NeighborhoodCategory } from '../types';
import { DEZFUL_NEIGHBORHOODS } from '../data/dezfulData';
import { toPersianDigits } from '../utils/persianUtils';
import {
  X,
  PlusCircle,
  CheckCircle2,
  MapPin,
  Building,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  UploadCloud,
  Phone,
  User,
  ShieldCheck,
  Navigation,
  Compass,
  Check,
  HelpCircle,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

interface SubmitPlaceModalProps {
  onClose: () => void;
  onSubmitSuccess: (newPlace: Place) => void;
}

const DEZFUL_QUARTERS_LIST = [
  { name: 'محله قلعه', category: 'historic' as NeighborhoodCategory, label: 'بافت کهن قلعه' },
  { name: 'محله کرناسیون', category: 'historic' as NeighborhoodCategory, label: 'کرناسیون تاریخی' },
  { name: 'محله میاندره', category: 'historic' as NeighborhoodCategory, label: 'میاندره کهن' },
  { name: 'محله لوریان و مسجد', category: 'historic' as NeighborhoodCategory, label: 'لوریان و ساباط‌ها' },
  { name: 'مرکز شهر و بازار کهنه', category: 'bazaar_center' as NeighborhoodCategory, label: 'بازار کهنه و سبزقبا' },
  { name: 'محله خراطان و بازار', category: 'bazaar_center' as NeighborhoodCategory, label: 'راسته خراطان' },
  { name: 'محله صحرابدر مشرقی و غربی', category: 'old_quarters' as NeighborhoodCategory, label: 'صحرابدر' },
  { name: 'محله سیاهپوشان', category: 'old_quarters' as NeighborhoodCategory, label: 'سیاهپوشان' },
  { name: 'محله ساکیان و چولیان', category: 'old_quarters' as NeighborhoodCategory, label: 'ساکیان' },
  { name: 'محله لب‌خندق و ساحلی', category: 'riverside_suburbs' as NeighborhoodCategory, label: 'لب‌خندق و کرانه دز' },
  { name: 'کوی آزادگان', category: 'new_towns' as NeighborhoodCategory, label: 'کوی آزادگان' },
  { name: 'کوی فرهنگ‌شهر', category: 'new_towns' as NeighborhoodCategory, label: 'فرهنگ‌شهر' },
  { name: 'کوی بهاران و زیباشهر', category: 'new_towns' as NeighborhoodCategory, label: 'بهاران و زیباشهر' },
  { name: 'کوی رسالت و پیام‌نور', category: 'new_towns' as NeighborhoodCategory, label: 'کوی رسالت' },
  { name: 'کوی مدرس', category: 'new_towns' as NeighborhoodCategory, label: 'کوی مدرس' },
  { name: 'کوی ۸ شهریور و گلستان', category: 'new_towns' as NeighborhoodCategory, label: '۸ شهریور' },
];

const PRESET_SAMPLE_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1590076212470-36e2f18374a4?auto=format&fit=crop&w=800&q=80',
    title: 'محراب آجری و طاق سنتی',
  },
  {
    url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=800&q=80',
    title: 'صحن و شبستان سنتی',
  },
  {
    url: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=800&q=80',
    title: 'فضای نورانی حسینیه',
  },
  {
    url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=800&q=80',
    title: 'سردر کاشی‌کاری شده',
  },
];

export const SubmitPlaceModal: React.FC<SubmitPlaceModalProps> = ({
  onClose,
  onSubmitSuccess,
}) => {
  // Current Step: 1 to 5
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Form State
  // Step 1: Type
  const [placeType, setPlaceType] = useState<PlaceType>('mosque');

  // Step 2: Name + Neighborhood
  const [name, setName] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('محله قلعه');

  // Step 3: Address + Map Pin
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number]>([32.3845, 48.4020]);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Step 4: Switches / Features
  const [dailyPrayer, setDailyPrayer] = useState(true);
  const [ablutionArea, setAblutionArea] = useState(true);
  const [hasWomenSection, setHasWomenSection] = useState(true);
  const [parking, setParking] = useState(true);
  const [wheelchairAccessible, setWheelchairAccessible] = useState(true);
  const [quranClasses, setQuranClasses] = useState(true);
  const [hasShavadan, setHasShavadan] = useState(false);
  const [airConditioning, setAirConditioning] = useState(true);

  // Step 5: Photo + Contact & Notes
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_SAMPLE_PHOTOS[0].url);
  const [isCustomPhotoUploaded, setIsCustomPhotoUploaded] = useState(false);
  const [phone, setPhone] = useState('');
  const [imamName, setImamName] = useState('');
  const [notes, setNotes] = useState('');

  // Validation & Submission
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishedSuccess, setIsFinishedSuccess] = useState(false);

  // Mini Map Refs for Step 3
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Setup Leaflet Mini Map when on Step 3
  useEffect(() => {
    if (step !== 3) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapContainerRef.current, {
        center: coordinates,
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      // CartoDB Voyager Tile Layer
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      // Custom Pin Icon
      const pinIcon = L.divIcon({
        className: 'custom-submit-pin',
        html: `
          <div style="background-color: #B4552D;" 
               class="w-9 h-9 rounded-full flex items-center justify-center text-white border-3 border-white shadow-xl animate-bounce">
            <span style="font-size: 16px;">📍</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker(coordinates, {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.bindTooltip(
        '<div class="font-[\'Vazirmatn\'] text-xs font-black text-stone-900 text-right px-1">مکان انتخابی شما</div>',
        { permanent: false, direction: 'top' }
      );

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCoordinates([pos.lat, pos.lng]);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng];
        marker.setLatLng(newCoords);
        setCoordinates(newCoords);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [step]);

  // Handle GPS location click
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      setCoordinates([32.3850, 48.3990]);
      if (markerRef.current && mapInstanceRef.current) {
        markerRef.current.setLatLng([32.3850, 48.3990]);
        mapInstanceRef.current.setView([32.3850, 48.3990], 16);
      }
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLoc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCoordinates(userLoc);
        setIsLocatingUser(false);
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng(userLoc);
          mapInstanceRef.current.setView(userLoc, 16);
        }
      },
      () => {
        setIsLocatingUser(false);
        // Fallback to central Dezful
        const fallback: [number, number] = [32.3842, 48.4018];
        setCoordinates(fallback);
        if (markerRef.current && mapInstanceRef.current) {
          markerRef.current.setLatLng(fallback);
          mapInstanceRef.current.setView(fallback, 16);
        }
      },
      { timeout: 6000 }
    );
  };

  // Image Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string);
          setIsCustomPhotoUploaded(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Navigation between steps with friendly validation
  const handleNextStep = () => {
    setValidationError(null);

    if (step === 1) {
      // Step 1: Type selected
      setStep(2);
      return;
    }

    if (step === 2) {
      // Validate Name
      if (!name.trim()) {
        setValidationError('لطفاً نام مکان را وارد فرمایید تا شهروندان به‌راحتی آن را بیابند.');
        return;
      }
      if (name.trim().length < 3) {
        setValidationError('نام مکان حداقل باید شامل ۳ حرف باشد.');
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      // Validate Address
      if (!address.trim()) {
        setValidationError('لطفاً نشانی یا یک مشخصهٔ راهنما برای رسیدن به مکان بنویسید.');
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      setStep(5);
      return;
    }

    if (step === 5) {
      handleSubmitFinal();
    }
  };

  const handlePrevStep = () => {
    setValidationError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Final Form Submission
  const handleSubmitFinal = () => {
    setIsSubmitting(true);
    setValidationError(null);

    // Find neighborhood category
    const matchedNh = DEZFUL_QUARTERS_LIST.find((q) => q.name === selectedNeighborhood);
    const category: NeighborhoodCategory = matchedNh ? matchedNh.category : 'old_quarters';

    const newPlace: Place = {
      id: `user-submitted-${Date.now()}`,
      name: name.trim(),
      type: placeType,
      neighborhood: selectedNeighborhood,
      neighborhoodCategory: category,
      address: address.trim(),
      coordinates: coordinates,
      isHistoric: hasShavadan,
      description:
        notes.trim() ||
        `${placeType === 'hussainiya' ? 'حسینیه' : placeType === 'shrine' ? 'زیارتگاه' : 'مسجد'} ثبت‌شده توسط شهروندان و نمازگزاران در ${selectedNeighborhood} دزفول.`,
      hasShavadan,
      images: [photoUrl || PRESET_SAMPLE_PHOTOS[0].url],
      features: {
        womenSection: hasWomenSection,
        wheelchairAccessible: wheelchairAccessible,
        parking: parking,
        quranClasses: quranClasses,
        library: true,
        airConditioning: airConditioning,
        ablutionArea: ablutionArea,
        dailyPrayer: dailyPrayer,
      },
      prayerTimes: {
        fajr: '۰۵:۱۵',
        dhuhr: '۱۳:۱۵',
        maghrib: '۱۹:۴۵',
      },
      imamName: imamName.trim() || undefined,
      phone: phone.trim() || undefined,
      rating: 5.0,
      isOpenNow: true,
      isFeatured: false,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setIsFinishedSuccess(true);

      setTimeout(() => {
        onSubmitSuccess(newPlace);
        onClose();
      }, 2000);
    }, 800);
  };

  // Step Titles for Progress Header
  const stepTitles = [
    'نوع مکان',
    'نام و محله',
    'آدرس و نقشه',
    'امکانات و خدمات',
    'تصویر و تماس',
  ];

  return (
    <div
      id="submit-place-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200 font-['Vazirmatn',sans-serif]"
      dir="rtl"
    >
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Form Sheet */}
      <div
        id="submit-place-card"
        className="relative z-10 w-full max-w-xl bg-[#FAF7F2] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-stone-200"
      >
        {/* TOP BAR: HEADER + PROGRESS BAR (مراحل با نوار پیشرفت بالا) */}
        <div className="bg-white px-4 sm:px-6 pt-4 pb-3 border-b border-stone-200/90 shrink-0">
          
          {/* Top Title & Close Button */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#B4552D]/10 text-[#B4552D] flex items-center justify-center font-bold">
                <PlusCircle size={18} />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-[#1F2430] leading-tight">
                  ثبت یا تکمیل مکان
                </h3>
                <span className="text-[11px] text-stone-500 font-medium">
                  مشارکت شهروندان در به‌روزرسانی سامانه مساجد دزفول
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="بستن"
            >
              <X size={18} />
            </button>
          </div>

          {/* Progress Indicator */}
          {!isFinishedSuccess && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                <span className="flex items-center gap-1.5 text-[#B4552D]">
                  <span>مرحله {toPersianDigits(step)} از {toPersianDigits(totalSteps)}:</span>
                  <span className="text-[#1F2430] font-black">{stepTitles[step - 1]}</span>
                </span>
                <span className="text-[11px] font-black text-stone-500 bg-[#FAF7F2] px-2 py-0.5 rounded-lg border border-stone-200">
                  {toPersianDigits(Math.round((step / totalSteps) * 100))}٪ تکمیل
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-l from-[#B4552D] to-[#0E7C86] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* FORM CONTENT CONTAINER (SCROLLABLE & TOUCH-FRIENDLY) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Gentle Validation Error Alert */}
          {validationError && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-2.5 text-amber-900 text-xs font-bold animate-in fade-in">
              <AlertCircle size={18} className="text-amber-700 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* ================= STEP 1: نوع مکان (کارت‌های انتخابی بزرگ) ================= */}
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="mb-2">
                <h4 className="font-black text-base text-[#1F2430]">
                  این مکان در کدام دسته قرار دارد؟
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  برای شروع، نوع فعالیت و کاربرد اصلی بنا را مشخص کنید:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. مسجد */}
                <button
                  type="button"
                  onClick={() => setPlaceType('mosque')}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
                    placeType === 'mosque'
                      ? 'bg-white border-[#0E7C86] shadow-md ring-2 ring-[#0E7C86]/20'
                      : 'bg-white/80 border-stone-200 hover:bg-white hover:border-stone-300'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      placeType === 'mosque' ? 'bg-[#0E7C86] text-white shadow-xs' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    🕌
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-[#1F2430]">مسجد</span>
                      {placeType === 'mosque' && (
                        <span className="w-5 h-5 rounded-full bg-[#0E7C86] text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      مسجد جامع، محله‌ای یا شبستانی با اقامه نمازهای یومیه
                    </p>
                  </div>
                </button>

                {/* 2. حسینیه */}
                <button
                  type="button"
                  onClick={() => setPlaceType('hussainiya')}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
                    placeType === 'hussainiya'
                      ? 'bg-white border-[#B4552D] shadow-md ring-2 ring-[#B4552D]/20'
                      : 'bg-white/80 border-stone-200 hover:bg-white hover:border-stone-300'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      placeType === 'hussainiya' ? 'bg-[#B4552D] text-white shadow-xs' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    🏴
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-[#1F2430]">حسینیه یا تکیه</span>
                      {placeType === 'hussainiya' && (
                        <span className="w-5 h-5 rounded-full bg-[#B4552D] text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      حسینیه، تکیه محلی، دارالعباس یا هیئت مذهبی دزفول
                    </p>
                  </div>
                </button>

                {/* 3. نمازخانه */}
                <button
                  type="button"
                  onClick={() => setPlaceType('mosque')}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
                    placeType === 'mosque' && false
                      ? 'bg-white border-[#0E7C86] shadow-md'
                      : 'bg-white/80 border-stone-200 hover:bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center text-2xl shrink-0">
                    🧎
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-[#1F2430]">نمازخانه و مجتمع عبادی</span>
                    </div>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      نمازخانه بوستان‌ها، مجتمع‌های رفاهی، بین‌راهی یا بیمارستان
                    </p>
                  </div>
                </button>

                {/* 4. بقعه / سایر */}
                <button
                  type="button"
                  onClick={() => setPlaceType('shrine')}
                  className={`p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-3.5 cursor-pointer ${
                    placeType === 'shrine'
                      ? 'bg-white border-[#B38B1C] shadow-md ring-2 ring-[#B38B1C]/20'
                      : 'bg-white/80 border-stone-200 hover:bg-white hover:border-stone-300'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      placeType === 'shrine' ? 'bg-[#B38B1C] text-white shadow-xs' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    🏛️
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-[#1F2430]">بقعه، زیارتگاه و دارالقرآن</span>
                      {placeType === 'shrine' && (
                        <span className="w-5 h-5 rounded-full bg-[#B38B1C] text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                      قدمگاه‌ها، زیارتگاه‌های متبرکه، حسینیه‌های خانگی یا سایر
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: نام مکان + انتخاب محله ================= */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              {/* Field 1: Name */}
              <div className="space-y-1.5">
                <label className="block font-black text-xs sm:text-sm text-[#1F2430]">
                  نام دقیق مکان <span className="text-[#B4552D]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="مثال: مسجد امام حسن مجتبی (ع) یا حسینیه اعظم قلعه"
                  className="w-full bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-stone-300 focus:border-[#B4552D] focus:outline-none text-stone-900 font-bold text-sm sm:text-base shadow-2xs"
                  autoFocus
                />

                {/* Quick Auto-Fill Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-stone-500 font-bold">پیشوند پیشنهادی:</span>
                  {['مسجد', 'حسینیه', 'تکیه', 'مسجد و دارالقرآن'].map((prefix) => (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => {
                        if (!name.startsWith(prefix)) {
                          setName(`${prefix} `);
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 hover:border-[#B4552D] cursor-pointer"
                    >
                      + {prefix}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Neighborhood Selector */}
              <div className="space-y-1.5 pt-2">
                <label className="block font-black text-xs sm:text-sm text-[#1F2430]">
                  انتخاب محله در دزفول <span className="text-[#B4552D]">*</span>
                </label>
                <p className="text-xs text-stone-500 mb-2">
                  محله‌ای که این مکان در آن واقع شده است را لمس کنید:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-stone-100/70 rounded-2xl border border-stone-200">
                  {DEZFUL_QUARTERS_LIST.map((nh) => {
                    const isSelected = selectedNeighborhood === nh.name;
                    return (
                      <button
                        key={nh.name}
                        type="button"
                        onClick={() => setSelectedNeighborhood(nh.name)}
                        className={`p-2.5 rounded-xl text-right text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#1F2430] text-white border-[#1F2430] shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className="truncate">{nh.label}</span>
                        {isSelected && <Check size={12} className="text-[#F7F3EC] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: آدرس متنی + انتخاب نقطه روی نقشه ================= */}
          {step === 3 && (
            <div className="space-y-3.5 animate-in fade-in">
              {/* Address Text Area */}
              <div className="space-y-1.5">
                <label className="block font-black text-xs sm:text-sm text-[#1F2430]">
                  نشانی متنی و گذر <span className="text-[#B4552D]">*</span>
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="خیابان، کوچه، بن‌بست، جنب ساباط یا نزدیک میدان..."
                  className="w-full bg-white p-3 rounded-2xl border-2 border-stone-300 focus:border-[#0E7C86] focus:outline-none text-stone-900 font-medium text-xs sm:text-sm shadow-2xs resize-none"
                />
              </div>

              {/* Map Point Picker Header */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-black text-xs text-stone-800 flex items-center gap-1.5">
                  <Compass size={15} className="text-[#B4552D]" />
                  <span>تعیین دقیق روی نقشه دزفول:</span>
                </span>

                {/* GPS Auto Button */}
                <button
                  type="button"
                  onClick={handleUseCurrentGPS}
                  disabled={isLocatingUser}
                  className="text-xs font-black text-[#0E7C86] hover:text-[#0a5e66] flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-stone-200 shadow-2xs active:scale-95 transition-all cursor-pointer"
                >
                  <Navigation size={13} className={isLocatingUser ? 'animate-spin' : ''} />
                  <span>{isLocatingUser ? 'در حال دریافت GPS...' : 'تنظیم با موقعیت من'}</span>
                </button>
              </div>

              {/* Interactive Mini Map */}
              <div className="relative w-full h-52 sm:h-60 rounded-2xl overflow-hidden border-2 border-stone-300 shadow-inner z-0">
                <div ref={mapContainerRef} className="w-full h-full" />
                
                {/* Map Guidance Overlay */}
                <div className="absolute bottom-2 right-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between text-[11px] text-stone-700">
                  <span>👈 روی نقشه تپ کنید تا پین قرمز جابجا شود</span>
                  <span className="font-bold text-[#B4552D]">دزفول</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: امکانات به صورت سوییچ‌های روشن/خاموش ================= */}
          {step === 4 && (
            <div className="space-y-3 animate-in fade-in">
              <div className="mb-2">
                <h4 className="font-black text-base text-[#1F2430]">
                  امکانات و خدمات فعال این مکان
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  سوییچ‌های مربوط به هر امکان را برای کمک به نمازگزاران روشن یا خاموش کنید:
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Switch 1: نماز جماعت */}
                <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg">
                      🕌
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-stone-900 block">
                        اقامه نماز جماعت یومیه
                      </span>
                      <span className="text-[11px] text-stone-500">
                        برگزاری منظم نماز در وعده‌های ظهر و عصر یا مغرب و عشاء
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDailyPrayer(!dailyPrayer)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      dailyPrayer ? 'bg-emerald-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        dailyPrayer ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 2: وضوخانه */}
                <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center text-lg">
                      💧
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-stone-900 block">
                        وضوخانه و سرویس بهداشتی
                      </span>
                      <span className="text-[11px] text-stone-500">
                        وضوخانهٔ بهداشتی با آب گرم و سرد
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAblutionArea(!ablutionArea)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      ablutionArea ? 'bg-[#0E7C86]' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        ablutionArea ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 3: بخش بانوان */}
                <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg">
                      🧕
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-stone-900 block">
                        بخش اختصاصی بانوان
                      </span>
                      <span className="text-[11px] text-stone-500">
                        شبستان مجزا، ورودی اختصاصی و وضوخانه بانوان
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasWomenSection(!hasWomenSection)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      hasWomenSection ? 'bg-purple-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        hasWomenSection ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 4: پارکینگ */}
                <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg">
                      🚗
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-stone-900 block">
                        جای پارک و پارکینگ مناسب
                      </span>
                      <span className="text-[11px] text-stone-500">
                        پارکینگ اختصاصی یا خیابان عریض با امکان پارک خودرو
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParking(!parking)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      parking ? 'bg-blue-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        parking ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 5: دسترسی معلولین */}
                <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg">
                      ♿
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-stone-900 block">
                        دسترسی توان‌یابان و سالمندان
                      </span>
                      <span className="text-[11px] text-stone-500">
                        سطح شیب‌دار (رمپ) و ورودی بدون پله
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWheelchairAccessible(!wheelchairAccessible)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      wheelchairAccessible ? 'bg-teal-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        wheelchairAccessible ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 6: کلاس قرآن */}
                <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg">
                      📖
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-stone-900 block">
                        جلسات و کلاس‌های قرآن
                      </span>
                      <span className="text-[11px] text-stone-500">
                        حفظ، قرائت، تجوید و محافل هفتگی دارالقرآن
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuranClasses(!quranClasses)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      quranClasses ? 'bg-amber-600' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        quranClasses ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Switch 7: شوادون دزفولی (بومی و اختصاصی) */}
                <div className="flex items-center justify-between p-3 sm:p-3.5 bg-white rounded-2xl border border-[#B4552D]/30 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#B4552D]/10 text-[#B4552D] flex items-center justify-center text-lg">
                      🏛️
                    </div>
                    <div>
                      <span className="font-black text-xs sm:text-sm text-[#B4552D] block">
                        شوادون سنتی دزفول
                      </span>
                      <span className="text-[11px] text-stone-500">
                        زیرزمین دست‌کند خنک برای اعتکاف و تابستان
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHasShavadan(!hasShavadan)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      hasShavadan ? 'bg-[#B4552D]' : 'bg-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                        hasShavadan ? '-translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 5: آپلود عکس + شماره تماس اختیاری ================= */}
          {step === 5 && !isFinishedSuccess && (
            <div className="space-y-4 animate-in fade-in">
              {/* Photo Upload Area */}
              <div className="space-y-2">
                <label className="block font-black text-xs sm:text-sm text-[#1F2430]">
                  تصویر سردر، صحن یا شبستان مکان
                </label>

                {/* File Upload Box */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#B4552D]/40 bg-white hover:bg-stone-50 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  {isCustomPhotoUploaded && photoUrl ? (
                    <div className="relative w-full h-36 rounded-xl overflow-hidden">
                      <img
                        src={photoUrl}
                        alt="پیش‌نمایش تصویر"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        برای تغییر تصویر کلیک کنید
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-[#B4552D]/10 text-[#B4552D] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <UploadCloud size={24} />
                      </div>
                      <div className="text-xs font-black text-stone-800">
                        لمس کنید یا تصویر را به اینجا بکشید
                      </div>
                      <span className="text-[11px] text-stone-500">
                        پشتیبانی از فرمت‌های JPG و PNG (از گالری یا دوربین)
                      </span>
                    </>
                  )}
                </div>

                {/* Preset Fast Sample Photos */}
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-stone-500 block mb-1.5">
                    یا یکی از تصاویر آماده را انتخاب کنید:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {PRESET_SAMPLE_PHOTOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(preset.url);
                          setIsCustomPhotoUploaded(false);
                        }}
                        className={`relative rounded-xl overflow-hidden h-16 border-2 transition-all cursor-pointer ${
                          photoUrl === preset.url && !isCustomPhotoUploaded
                            ? 'border-[#B4552D] ring-2 ring-[#B4552D]/30 scale-105'
                            : 'border-stone-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.title}
                          className="w-full h-full object-cover"
                        />
                        {photoUrl === preset.url && !isCustomPhotoUploaded && (
                          <div className="absolute inset-0 bg-[#B4552D]/40 flex items-center justify-center text-white">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact & Imam Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Phone */}
                <div className="space-y-1">
                  <label className="block font-bold text-xs text-stone-700 flex items-center gap-1">
                    <Phone size={13} className="text-stone-400" />
                    <span>شماره تماس یا مسئول (اختیاری)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: ۰۶۱۴۲۲۲۰۰۰۰"
                    className="w-full bg-white p-3 rounded-xl border border-stone-300 focus:border-[#0E7C86] focus:outline-none text-stone-800 text-xs"
                  />
                </div>

                {/* Imam / Board */}
                <div className="space-y-1">
                  <label className="block font-bold text-xs text-stone-700 flex items-center gap-1">
                    <User size={13} className="text-stone-400" />
                    <span>نام امام جماعت / خادم (اختیاری)</span>
                  </label>
                  <input
                    type="text"
                    value={imamName}
                    onChange={(e) => setImamName(e.target.value)}
                    placeholder="مثال: حجت‌الاسلام احمدی"
                    className="w-full bg-white p-3 rounded-xl border border-stone-300 focus:border-[#0E7C86] focus:outline-none text-stone-800 text-xs"
                  />
                </div>
              </div>

              {/* Extra Notes */}
              <div className="space-y-1">
                <label className="block font-bold text-xs text-stone-700">
                  توضیحات تکمیلی یا تاریخچه (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات خاص دربارهٔ شوادون، سال تأسیس، هیئت‌های فعال یا ساعات باز بودن..."
                  className="w-full bg-white p-2.5 rounded-xl border border-stone-300 focus:border-[#0E7C86] focus:outline-none text-stone-800 text-xs resize-none"
                />
              </div>
            </div>
          )}

          {/* ================= SUCCESS STATE ================= */}
          {isFinishedSuccess && (
            <div className="p-8 text-center space-y-4 my-auto animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                <CheckCircle2 size={44} />
              </div>
              <div>
                <h4 className="font-black text-xl text-stone-900">
                  اطلاعات با موفقیت ثبت شد
                </h4>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  مشخصات «{name}» در سامانه ذخیره گردید و به نقشه دزفول افزوده شد.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center justify-center gap-2">
                <ShieldCheck size={18} className="text-emerald-700" />
                <span>اطلاعات پس از بررسی ناشر منتشر می‌شود</span>
              </div>
            </div>
          )}

        </div>

        {/* ================= BOTTOM ACTION BAR (ONE-HANDED FIELD NAVIGATION) ================= */}
        {!isFinishedSuccess && (
          <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200/90 flex flex-col gap-2.5 shrink-0">
            
            {/* Trust Message (پیام اعتماد: «اطلاعات پس از بررسی ناشر منتشر می‌شود») */}
            {step === totalSteps && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-stone-600 bg-[#FAF7F2] py-1.5 px-3 rounded-xl border border-stone-200">
                <ShieldCheck size={15} className="text-[#0E7C86]" />
                <span>اطلاعات پس از بررسی ناشر منتشر می‌شود</span>
              </div>
            )}

            {/* Navigation Buttons (Large & Touch-Friendly) */}
            <div className="flex items-center gap-2.5">
              {/* Back Button (if not step 1) */}
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <ArrowRight size={16} />
                  <span>مرحله قبل</span>
                </button>
              )}

              {/* Next / Submit Button */}
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isSubmitting}
                className="flex-1 py-3.5 sm:py-4 px-5 rounded-2xl font-black text-xs sm:text-sm text-white bg-[#B4552D] hover:bg-[#96401c] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {step < totalSteps ? (
                  <>
                    <span>مرحله بعد: {stepTitles[step]}</span>
                    <ArrowLeft size={18} />
                  </>
                ) : (
                  <>
                    <PlusCircle size={18} />
                    <span>{isSubmitting ? 'در حال ارسال و اعتبارسنجی...' : 'ارسال برای تأیید و ثبت'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
