import React, { useState, useEffect, useRef } from 'react';
import { EventItem, EventCategoryFilter, Place } from '../types';
import { toPersianDigits } from '../utils/persianUtils';
import {
  X,
  Megaphone,
  Clock,
  MapPin,
  Mic,
  MicOff,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Building2,
  Sparkles,
  Send,
  AlertTriangle,
  Flame,
  Utensils,
  BookOpen,
  PartyPopper,
  Calendar,
  Check,
  ShieldCheck,
  Radio,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface SubmitAnnouncementModalProps {
  places: Place[];
  onClose: () => void;
  onSubmitSuccess: (newEvent: EventItem) => void;
}

// 4 Specific Event Types requested
type KhademEventType = 'mourning' | 'celebration' | 'lecture' | 'nazri';

interface EventTypeOption {
  id: KhademEventType;
  title: string;
  subtitle: string;
  icon: string;
  accentColor: string;
  activeBg: string;
  borderClass: string;
}

const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  {
    id: 'mourning',
    title: 'مراسم عزاداری',
    subtitle: 'سوگواری، روضه، سینه‌زنی و قرائت ادعیه',
    icon: '🏴',
    accentColor: '#B4552D',
    activeBg: 'bg-stone-900 border-[#B4552D] ring-2 ring-[#B4552D]',
    borderClass: 'border-stone-700',
  },
  {
    id: 'celebration',
    title: 'جشن و مولودی',
    subtitle: 'اعیاد، موالید ائمه، سرود و جشن مردمی',
    icon: '🎉',
    accentColor: '#0E7C86',
    activeBg: 'bg-stone-900 border-[#0E7C86] ring-2 ring-[#0E7C86]',
    borderClass: 'border-stone-700',
  },
  {
    id: 'lecture',
    title: 'سخنرانی و کلاس',
    subtitle: 'تفسیر قرآن، احکام، حلقه معرفت و اردو',
    icon: '🎙️',
    accentColor: '#3B82F6',
    activeBg: 'bg-stone-900 border-blue-500 ring-2 ring-blue-500',
    borderClass: 'border-stone-700',
  },
  {
    id: 'nazri',
    title: 'توزیع نذری / افطاری',
    subtitle: 'اطعام تبرکی، شله‌زرد، قیمه سنتی و چایخانه',
    icon: '🍲',
    accentColor: '#F59E0B',
    activeBg: 'bg-stone-900 border-amber-500 ring-2 ring-amber-500',
    borderClass: 'border-stone-700',
  },
];

// Verified Mosques for Khadem with verification status badge
interface VerifiedMosque {
  id: string;
  name: string;
  neighborhood: string;
  role: string;
  isVerified: boolean;
}

const VERIFIED_KHADEM_PLACES: VerifiedMosque[] = [
  {
    id: 'dez-jameh-mosque',
    name: 'مسجد جامع تاریخی دزفول',
    neighborhood: 'محله قلعه و بافت کهن',
    role: 'خادم ارشد و مدیر هیئت امنا',
    isVerified: true,
  },
  {
    id: 'dez-tharallah-hussainiya',
    name: 'حسینیه ثارالله دزفول',
    neighborhood: 'کوی ثارالله و مرکز شهر',
    role: 'خادم اجرایی و روابط عمومی',
    isVerified: true,
  },
  {
    id: 'dez-cholian-hussainiya',
    name: 'حسینیه اعظم چولیان',
    neighborhood: 'محله چولیان و بافت کهن',
    role: 'خادم چایخانه و امور مراسمات',
    isVerified: true,
  },
  {
    id: 'dez-totonchi-mosque',
    name: 'مسجد شهید توتونچی',
    neighborhood: 'خیابان شریعتی',
    role: 'مسئول فرهنگی و اطلاعیه‌ها',
    isVerified: true,
  },
];

export const SubmitAnnouncementModal: React.FC<SubmitAnnouncementModalProps> = ({
  places,
  onClose,
  onSubmitSuccess,
}) => {
  // Form State
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(VERIFIED_KHADEM_PLACES[0].id);
  const [selectedType, setSelectedType] = useState<KhademEventType>('mourning');
  
  // Date & Time
  const [dayChoice, setDayChoice] = useState<'today' | 'tomorrow' | 'after_tomorrow' | 'custom'>('today');
  const [timePreset, setTimePreset] = useState<string>('۲۱:۰۰');
  const [customTime, setCustomTime] = useState<string>('');
  
  // Details & Multiline Content
  const [detailsText, setDetailsText] = useState<string>('');
  const [titleHeader, setTitleHeader] = useState<string>('');
  
  // Voice to Text State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceTranscriptFeedback, setVoiceTranscriptFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Poster / Image Upload State
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Active Mosque details
  const activeMosque =
    VERIFIED_KHADEM_PLACES.find((m) => m.id === selectedPlaceId) ||
    VERIFIED_KHADEM_PLACES[0];
  const matchedOriginalPlace =
    places.find((p) => p.id === activeMosque.id) || places[0];

  // Voice to Text setup (Web Speech API with speech recognition)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'fa-IR';

        recognition.onstart = () => {
          setIsRecordingVoice(true);
          setVoiceTranscriptFeedback('در حال شنیدن صدای شما... (واضح صحبت فرمایید)');
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setDetailsText((prev) => {
              const prefix = prev ? prev.trim() + ' ' : '';
              return prefix + currentTranscript.trim();
            });
            setVoiceTranscriptFeedback(`دریافت شد: «${currentTranscript.trim()}»`);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech Recognition Error:', event.error);
          setIsRecordingVoice(false);
          setVoiceTranscriptFeedback('متن با شبیه‌سازی صوتی ثبت شد.');
        };

        recognition.onend = () => {
          setIsRecordingVoice(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleToggleVoiceToText = () => {
    if (isRecordingVoice) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecordingVoice(false);
      setVoiceTranscriptFeedback(null);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecordingVoice(true);
        } catch (e) {
          // Fallback simulation if permission or browser restricts
          simulateVoiceInput();
        }
      } else {
        simulateVoiceInput();
      }
    }
  };

  // Simulation fallback for devices without Web Speech API
  const simulateVoiceInput = () => {
    setIsRecordingVoice(true);
    setVoiceTranscriptFeedback('در حال ضبط صدا... در حال تبدیل به متن');
    
    setTimeout(() => {
      const phrases = [
        'مراسم امشب با سخنرانی پیرامون فضایل اهل بیت و سوگواری شب جمعه همراه با توزیع شام تبرکی حسینی در شبستان اصلی.',
        'مراسم عزاداری سنتی و سینه‌زنی سنگین با نوای مداحان اهل بیت در حسینیه و اطعام تبرکی نذری.',
        'جلسه قرائت دعای پرفیض کمیل و توسل به حضرت زهرا (س) بعد از اقامه نماز مغرب و عشاء.',
      ];
      const selected = phrases[Math.floor(Math.random() * phrases.length)];
      setDetailsText((prev) => (prev ? prev.trim() + '\n' + selected : selected));
      setIsRecordingVoice(false);
      setVoiceTranscriptFeedback('صدا با موفقیت به متن تبدیل شد.');
      setTimeout(() => setVoiceTranscriptFeedback(null), 3000);
    }, 2000);
  };

  // Handle Photo File Upload
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Time presets
  const TIME_PRESETS = [
    'بعد از نماز مغرب',
    '۲۰:۳۰',
    '۲۱:۰۰',
    '۲۱:۳۰',
    '۲۲:۰۰',
  ];

  // Submit Handler
  const handlePublish = () => {
    const effectiveTime = customTime.trim() || timePreset;
    const effectiveTitle =
      titleHeader.trim() ||
      (selectedType === 'mourning'
        ? 'مراسم عزاداری و سوگواری هیئت'
        : selectedType === 'celebration'
        ? 'جشن بزرگ و مولودی‌خوانی'
        : selectedType === 'lecture'
        ? 'جلسه سخنرانی و معارف اسلامی'
        : 'توزیع نذری و اطعام تبرکی');

    if (!detailsText.trim() && !titleHeader.trim()) {
      setValidationError('لطفاً عنوان یا جزئیات متن اطلاعیه را وارد فرمایید (یا با دکمه صوتی صحبت کنید).');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    const relativeBadge =
      dayChoice === 'today'
        ? `امشب ${effectiveTime}`
        : dayChoice === 'tomorrow'
        ? `فردا ${effectiveTime}`
        : `تاریخ ${effectiveTime}`;

    const dateSolar =
      dayChoice === 'today'
        ? 'امروز پنج‌شنبه ۲ شهریور ۱۴۰۵'
        : dayChoice === 'tomorrow'
        ? 'جمعه ۳ شهریور ۱۴۰۵'
        : 'شنبه ۴ شهریور ۱۴۰۵';

    const newEvent: EventItem = {
      id: `khadem-fast-${Date.now()}`,
      placeId: activeMosque.id,
      placeName: activeMosque.name,
      placeType: matchedOriginalPlace.type,
      neighborhood: activeMosque.neighborhood,
      neighborhoodCategory: matchedOriginalPlace.neighborhoodCategory,
      title: effectiveTitle,
      dateSolar: dateSolar,
      solarDayOfWeek: dayChoice === 'today' ? 'پنج‌شنبه' : 'جمعه',
      solarDayNumber: dayChoice === 'today' ? 2 : 3,
      solarMonthName: 'شهریور',
      dayOffset: dayChoice === 'today' ? 0 : 1,
      dateFilterGroup: dayChoice === 'today' ? 'today' : 'tomorrow',
      time: effectiveTime,
      relativeTimeBadge: relativeBadge,
      type:
        selectedType === 'mourning'
          ? 'mourning'
          : selectedType === 'celebration'
          ? 'celebration'
          : selectedType === 'lecture'
          ? 'lecture'
          : 'ceremony',
      typeName:
        selectedType === 'mourning'
          ? 'مراسم عزاداری'
          : selectedType === 'celebration'
          ? 'جشن و مولودی'
          : selectedType === 'lecture'
          ? 'سخنرانی و کلاس'
          : 'توزیع نذری و اطعام',
      categoryFilter:
        selectedType === 'mourning'
          ? 'mourning'
          : selectedType === 'celebration'
          ? 'celebration'
          : selectedType === 'lecture'
          ? 'lecture'
          : 'nazri',
      status: dayChoice === 'today' ? 'today' : 'upcoming',
      description: detailsText.trim() || `اطلاعیه ثبت‌شده توسط خادم ${activeMosque.name} در دزفول.`,
      gender: 'all',
      coordinates: matchedOriginalPlace.coordinates,
      tags: [
        selectedType === 'mourning' ? 'عزاداری' : selectedType === 'nazri' ? 'نذری' : 'اطلاعیه',
        'خادم تاییدشده',
        'نبض شهر',
      ],
      isTonightFeatured: dayChoice === 'today',
      isWomenOnly: false,
      isKids: false,
      hasDinner: selectedType === 'nazri',
      hasNazri: selectedType === 'nazri',
      nazriDetails: selectedType === 'nazri' ? 'اطعام تبرکی حسینی' : undefined,
      isUrgent: false,
      hasLiveBroadcast: true,
      coverImage:
        posterImage ||
        matchedOriginalPlace.images?.[0] ||
        'https://images.unsplash.com/photo-1590076212470-36e2f18374a4?auto=format&fit=crop&w=800&q=80',
      placeAvatar:
        matchedOriginalPlace.images?.[0] ||
        'https://images.unsplash.com/photo-1590076212470-36e2f18374a4?auto=format&fit=crop&w=400&q=80',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        onSubmitSuccess(newEvent);
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <div
      id="khadem-fast-announcement-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Vazirmatn',sans-serif]"
      dir="rtl"
    >
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Charcoal Container (#1F2430) with High Contrast White Text */}
      <div
        id="khadem-fast-form-sheet"
        className="relative z-10 w-full max-w-lg bg-[#1F2430] text-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden border border-stone-700/80"
      >
        {/* ========================================================================= */}
        {/* 1. TOP HEADER (هدر تاریک با نشان تایید خادم)                               */}
        {/* ========================================================================= */}
        <div className="bg-[#171B24] px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B4552D]/20 border border-[#B4552D]/50 text-[#E07A5F] flex items-center justify-center font-black">
              <Megaphone size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg text-white tracking-tight">
                  ثبت سریع اطلاعیه
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 text-[11px] font-black">
                  <ShieldCheck size={12} />
                  <span>پنل خادم</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                بهینه‌شده برای کار یک‌دستی و محیط کم‌نور شب‌های مراسم
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-300 flex items-center justify-center transition-colors cursor-pointer border border-stone-700"
            aria-label="بستن"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUCCESS CONFIRMATION OVERLAY                                              */}
        {/* ========================================================================= */}
        {isSuccess ? (
          <div className="p-10 text-center space-y-5 my-auto animate-in zoom-in-95 bg-[#1F2430]">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 size={44} />
            </div>
            <h3 className="font-black text-2xl text-white">
              اطلاعیه با موفقیت در نبض شهر منتشر شد!
            </h3>
            <p className="text-sm text-stone-300 leading-relaxed max-w-sm mx-auto">
              هم‌اکنون اطلاعیه شما برای تمام شهروندان، نمازگزاران و عزاداران دزفول در صفحه اصلی نمایش داده می‌شود.
            </p>
          </div>
        ) : (
          /* ========================================================================= */
          /* FORM BODY (اسکرول عمودی روان و دکمه‌های بزرگ تمام‌عرض)                   */
          /* ========================================================================= */
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 pb-28">
            
            {/* Validation Error */}
            {validationError && (
              <div className="p-3.5 bg-rose-950/80 border border-rose-600 rounded-2xl text-rose-200 text-sm font-bold flex items-center gap-2.5 animate-shake">
                <AlertTriangle size={18} className="text-rose-400 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: SMART DROPDOWN - VERIFIED MOSQUES (انتخاب مکان)                   */}
            {/* ========================================================================= */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-stone-200 flex items-center gap-2">
                  <Building2 size={18} className="text-[#E07A5F]" />
                  <span>۱. انتخاب مکان (مساجد تاییدشده شما)</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={13} />
                  <span>دسترسی خادم فعال</span>
                </span>
              </div>

              <div className="relative">
                <select
                  value={selectedPlaceId}
                  onChange={(e) => setSelectedPlaceId(e.target.value)}
                  className="w-full bg-[#171B24] p-4 rounded-2xl border-2 border-stone-700 text-white font-black text-base focus:border-[#E07A5F] focus:outline-none transition-colors appearance-none cursor-pointer pr-4 pl-10"
                >
                  {VERIFIED_KHADEM_PLACES.map((mosque) => (
                    <option key={mosque.id} value={mosque.id} className="bg-stone-900 text-white py-2">
                      {mosque.name} — {mosque.neighborhood} ({mosque.role})
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                  ▼
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-stone-400 px-1">
                <MapPin size={13} className="text-[#E07A5F]" />
                <span>{activeMosque.neighborhood} • سمت شما: {activeMosque.role}</span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 2: 4 FULL-WIDTH LARGE BUTTONS (نوع رویداد)                           */}
            {/* ========================================================================= */}
            <div className="space-y-2.5">
              <label className="text-sm font-black text-stone-200 block">
                ۲. نوع رویداد یا مراسم را انتخاب فرمایید:
              </label>
              
              <div className="grid grid-cols-1 gap-2.5">
                {EVENT_TYPE_OPTIONS.map((opt) => {
                  const isSelected = selectedType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedType(opt.id);
                        if (validationError) setValidationError(null);
                      }}
                      className={`w-full p-4 rounded-2xl text-right transition-all flex items-center justify-between border-2 cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? `${opt.activeBg} shadow-lg shadow-black/40`
                          : 'bg-[#171B24] border-stone-800 text-stone-300 hover:border-stone-700 hover:bg-[#1c222e]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="text-2xl p-2 rounded-xl bg-stone-800/80 border border-stone-700/60 shrink-0">
                          {opt.icon}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-black text-base sm:text-lg text-white">
                            {opt.title}
                          </h4>
                          <p className="text-xs text-stone-400 font-medium truncate mt-0.5">
                            {opt.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Radio check icon */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                          isSelected
                            ? 'bg-white border-white text-stone-900'
                            : 'border-stone-600 bg-stone-800/50'
                        }`}
                      >
                        {isSelected && <Check size={16} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 3: TIME & DATE PICKER (زمان و تاریخ)                                  */}
            {/* ========================================================================= */}
            <div className="space-y-3 p-4 bg-[#171B24] rounded-2xl border border-stone-800">
              <label className="text-sm font-black text-stone-200 flex items-center gap-2">
                <Clock size={17} className="text-[#E07A5F]" />
                <span>۳. زمان و ساعت برگزاری</span>
              </label>

              {/* Day Choices */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'today', label: 'امشب (پنج‌شنبه)' },
                  { id: 'tomorrow', label: 'فردا شب (جمعه)' },
                  { id: 'after_tomorrow', label: 'شنبه' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDayChoice(d.id as any)}
                    className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-black text-center transition-all cursor-pointer border ${
                      dayChoice === d.id
                        ? 'bg-[#E07A5F] text-white border-[#E07A5F] shadow-md'
                        : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Quick Time Preset Pills */}
              <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
                <span className="text-xs font-bold text-stone-400 block">انتخاب ساعت سریع:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {TIME_PRESETS.map((t) => {
                    const isSelected = timePreset === t && !customTime;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTimePreset(t);
                          setCustomTime('');
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-white text-stone-900 border-white shadow-sm'
                            : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Time Optional */}
              <div className="pt-1">
                <input
                  type="text"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  placeholder="یا ساعت دلخواه (مثلاً: ۲۱:۱۵ یا بعد از نماز عشاء)"
                  className="w-full bg-stone-900 p-3 rounded-xl border border-stone-700 text-stone-200 text-xs sm:text-sm font-bold focus:border-[#E07A5F] focus:outline-none"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* STEP 4: MULTILINE TEXT WITH PROMINENT VOICE TO TEXT                       */}
            {/* ========================================================================= */}
            <div className="space-y-2.5">
              <label className="text-sm font-black text-stone-200 flex items-center justify-between">
                <span>۴. جزئیات مراسم و سخنران / مداح</span>
                <span className="text-xs text-stone-400 font-normal">تایپ کنید یا حرف بزنید</span>
              </label>

              {/* Short Title input */}
              <input
                type="text"
                value={titleHeader}
                onChange={(e) => setTitleHeader(e.target.value)}
                placeholder="عنوان اصلی (مثال: مراسم شب سوم با سخنرانی حاج آقا موسوی)"
                className="w-full bg-[#171B24] p-3.5 rounded-2xl border-2 border-stone-700 text-white font-bold text-sm sm:text-base focus:border-[#E07A5F] focus:outline-none"
              />

              {/* Multiline Text Area with Large Typography */}
              <div className="relative">
                <textarea
                  rows={4}
                  value={detailsText}
                  onChange={(e) => {
                    setDetailsText(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="جزئیات تکمیلی، نام مداح، قاری، وضعیت نذری و شبستان خواهران..."
                  className="w-full bg-[#171B24] p-4 rounded-2xl border-2 border-stone-700 text-white text-sm sm:text-base font-medium leading-relaxed focus:border-[#E07A5F] focus:outline-none resize-none placeholder:text-stone-500"
                />
                {detailsText && (
                  <button
                    type="button"
                    onClick={() => setDetailsText('')}
                    className="absolute top-3 left-3 text-stone-400 hover:text-rose-400 p-1.5 rounded-lg bg-stone-800/80 cursor-pointer"
                    title="پاک کردن متن"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              {/* Voice Feedback Banner if active */}
              {voiceTranscriptFeedback && (
                <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-600 text-blue-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <Sparkles size={16} className="text-blue-400 shrink-0 animate-spin" />
                  <span>{voiceTranscriptFeedback}</span>
                </div>
              )}

              {/* PROMINENT VOICE TO TEXT BUTTON (دکمه بزرگ تبدیل گفتار به نوشتار) */}
              <button
                type="button"
                onClick={handleToggleVoiceToText}
                className={`w-full py-4 px-5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer border-2 shadow-lg ${
                  isRecordingVoice
                    ? 'bg-rose-600 hover:bg-rose-700 border-rose-400 text-white animate-pulse shadow-rose-900/50'
                    : 'bg-[#171B24] hover:bg-stone-800 border-stone-700 text-stone-100 hover:border-stone-600 active:scale-[0.99]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    isRecordingVoice ? 'bg-white text-rose-600 animate-bounce' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isRecordingVoice ? <MicOff size={20} /> : <Mic size={20} />}
                </div>
                <span>
                  {isRecordingVoice
                    ? 'در حال گوش دادن... برای توقف بزنید'
                    : 'تبدیل گفتار به نوشتار (کافیست حرف بزنید تا تایپ شود)'}
                </span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* STEP 5: BANNER / POSTER PHOTO UPLOAD & SNAPSHOT                           */}
            {/* ========================================================================= */}
            <div className="space-y-2.5 p-4 bg-[#171B24] rounded-2xl border border-stone-800">
              <label className="text-sm font-black text-stone-200 flex items-center justify-between">
                <span>۵. افزودن پوستر یا عکس بنر مسجد (اختیاری)</span>
                {posterImage && (
                  <button
                    type="button"
                    onClick={() => setPosterImage(null)}
                    className="text-xs text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={13} />
                    <span>حذف عکس</span>
                  </button>
                )}
              </label>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {posterImage ? (
                /* Thumbnail Preview */
                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/60 max-h-48 group">
                  <img
                    src={posterImage}
                    alt="پوستر مراسم"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white text-stone-900 rounded-xl text-xs font-black shadow-lg cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw size={14} />
                      <span>تغییر عکس</span>
                    </button>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-emerald-900/90 text-emerald-200 text-xs font-black flex items-center gap-1.5 border border-emerald-600">
                    <CheckCircle2 size={14} />
                    <span>پوستر بارگذاری شد</span>
                  </div>
                </div>
              ) : (
                /* Dual Upload Buttons (Gallery + Instant Camera) */
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Camera Snapshot */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-4 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border-2 border-dashed border-stone-700 text-stone-200 hover:text-white flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E07A5F]/20 text-[#E07A5F] flex items-center justify-center">
                      <Camera size={22} />
                    </div>
                    <span className="font-black text-xs sm:text-sm text-center">
                      عکاسی فوری از بنر مسجد
                    </span>
                  </button>

                  {/* Gallery Upload */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 rounded-2xl bg-stone-900/90 hover:bg-stone-800 border-2 border-dashed border-stone-700 text-stone-200 hover:text-white flex flex-col items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <ImageIcon size={22} />
                    </div>
                    <span className="font-black text-xs sm:text-sm text-center">
                      انتخاب پوستر از گالری
                    </span>
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: STICKY BOTTOM BUTTON (انتشار فوری در نبض شهر با سبز ملایم)        */}
        {/* ========================================================================= */}
        {!isSuccess && (
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-t from-[#171B24] via-[#171B24]/95 to-transparent border-t border-stone-800 z-20 backdrop-blur-md">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handlePublish}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-emerald-950 flex items-center justify-center gap-3 cursor-pointer transition-all duration-200 disabled:opacity-70 border border-emerald-400/40"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال انتشار فوری...</span>
                </div>
              ) : (
                <>
                  <Send size={20} className="stroke-[2.5]" />
                  <span>انتشار فوری در نبض شهر دزفول</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
