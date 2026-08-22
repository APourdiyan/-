import React, { useState } from 'react';
import { EventItem } from '../types';
import { getPlaceTypeName, getNavigationLinks } from '../utils/persianUtils';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Mic2,
  UserCheck,
  Share2,
  Navigation,
  Bell,
  Check,
  CheckCircle2
} from 'lucide-react';

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  onSelectPlaceById: (placeId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onSelectPlaceById,
}) => {
  const [isReminded, setIsReminded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!event) return null;

  const navLinks = getNavigationLinks(event.coordinates[0], event.coordinates[1], event.placeName);

  const handleShare = () => {
    const text = `📌 مراسم: ${event.title}\n📍 مکان: ${event.placeName} (${event.neighborhood})\n🗓 زمان: ${event.dateSolar} ساعت ${event.time}\n🎙 سخنران: ${event.speaker || '-'}\nسامانه مساجد دزفول`;
    if (navigator.share) {
      navigator.share({ title: event.title, text });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-4 bg-[#FAF7F2] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B38B1C]"></span>
            <span className="text-xs font-bold text-stone-700">اطلاعات برنامه و مراسم</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <span className="text-[11px] bg-[#0E7C86]/10 text-[#0E7C86] px-2.5 py-0.5 rounded-md font-semibold border border-[#0E7C86]/20">
              {event.typeName}
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#1F2430] leading-snug">
              {event.title}
            </h3>
          </div>

          {/* Time and Date Box */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-stone-200/90 space-y-2">
            <div className="flex items-center gap-2 text-stone-800">
              <Calendar size={16} className="text-[#B4552D]" />
              <span className="font-bold">{event.dateSolar}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-800">
              <Clock size={16} className="text-[#0E7C86]" />
              <span>ساعت آغاز:</span>
              <span className="font-bold">{event.time}</span>
            </div>
          </div>

          {/* Venue Box */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin size={16} className="text-[#0E7C86]" />
                <span className="font-bold text-stone-900">{event.placeName}</span>
              </div>
              <span className="text-[11px] text-stone-500 font-bold">{event.neighborhood}</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Guests: Speaker, Eulogist, Qari */}
          {(event.speaker || event.eulogist || event.qari) && (
            <div className="space-y-2 p-3 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-700">
              {event.speaker && (
                <div className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-[#0E7C86]" />
                  <span className="text-stone-500">سخنران:</span>
                  <span className="font-bold text-stone-900">{event.speaker}</span>
                </div>
              )}
              {event.eulogist && (
                <div className="flex items-center gap-1.5">
                  <Mic2 size={14} className="text-[#B4552D]" />
                  <span className="text-stone-500">ذاکر / مداح:</span>
                  <span className="font-bold text-stone-900">{event.eulogist}</span>
                </div>
              )}
              {event.qari && (
                <div className="flex items-center gap-1.5">
                  <UserCheck size={14} className="text-[#0E7C86]" />
                  <span className="text-stone-500">قاری قرآن:</span>
                  <span className="font-bold text-stone-900">{event.qari}</span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((tag, i) => (
                <span key={i} className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-bold border border-stone-200">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <a
                href={navLinks.neshan}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#B4552D] hover:bg-[#963E19] text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all"
              >
                <Navigation size={14} />
                <span>مسیریابی با نشان</span>
              </a>

              <a
                href={navLinks.balad}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0E7C86] hover:bg-[#0A6B74] text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all"
              >
                <Navigation size={14} />
                <span>مسیریابی با بلد</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onSelectPlaceById(event.placeId);
                  onClose();
                }}
                className="flex-1 bg-[#FAF7F2] hover:bg-stone-100 text-stone-900 border border-stone-300 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>مشاهده شناسنامه مکان</span>
              </button>

              <button
                onClick={() => setIsReminded(!isReminded)}
                className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  isReminded
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                }`}
              >
                {isReminded ? <Check size={16} /> : <Bell size={16} />}
                <span>{isReminded ? 'ثبت شد' : 'یادآور'}</span>
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 cursor-pointer"
                title="اشتراک گذاری"
              >
                {copied ? <span className="text-emerald-700 text-xs font-bold">کپی شد</span> : <Share2 size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
