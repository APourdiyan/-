import React, { useState } from 'react';
import { EventItem, Place } from '../types';
import { toPersianDigits, getPlaceTypeName } from '../utils/persianUtils';
import { Calendar, Clock, MapPin, Mic2, UserCheck, Bell, Check, Share2 } from 'lucide-react';

interface UpcomingEventsListProps {
  events: EventItem[];
  onSelectPlaceById: (placeId: string) => void;
  onSelectEvent: (event: EventItem) => void;
}

export const UpcomingEventsList: React.FC<UpcomingEventsListProps> = ({
  events,
  onSelectPlaceById,
  onSelectEvent,
}) => {
  const [remindedEvents, setRemindedEvents] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleReminder = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (remindedEvents.includes(eventId)) {
      setRemindedEvents(remindedEvents.filter((id) => id !== eventId));
    } else {
      setRemindedEvents([...remindedEvents, eventId]);
    }
  };

  const handleShare = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `📌 مراسم: ${event.title}\n📍 مکان: ${event.placeName} (${event.neighborhood})\n🗓 زمان: ${event.dateSolar} - ساعت ${event.time}\n🎙 سخنران: ${event.speaker || '-'}\nسامانه مساجد دزفول`;
    if (navigator.share) {
      navigator.share({ title: event.title, text });
    } else {
      navigator.clipboard.writeText(text);
      setCopiedId(event.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <section className="py-4">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B38B1C]"></span>
            <h2 className="font-extrabold text-base sm:text-lg text-[#1F2430]">
              برنامهٔ مراسم و مجالس پیش رو
            </h2>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            دعای کمیل، تفسیر و محافل قرآنی
          </span>
        </div>

        {/* Vertical Event Cards */}
        <div className="space-y-3">
          {events.map((evt) => {
            const isReminded = remindedEvents.includes(evt.id);
            const isLive = evt.status === 'live';

            return (
              <div
                key={evt.id}
                id={`event-item-${evt.id}`}
                onClick={() => onSelectEvent(evt)}
                className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                {/* Top Row: Date Badge & Type Tag & Status */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#F0EAE1] text-stone-800 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 border border-stone-300/50">
                      <Calendar size={13} className="text-[#B4552D]" />
                      {evt.dateSolar}
                    </span>

                    {isLive ? (
                      <span className="bg-rose-500 text-white text-[11px] px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        در حال برگزاری
                      </span>
                    ) : evt.status === 'today' ? (
                      <span className="bg-amber-500/15 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-semibold border border-amber-300/60">
                        امروز
                      </span>
                    ) : null}
                  </div>

                  <span className="text-[11px] bg-[#0E7C86]/10 text-[#0E7C86] px-2.5 py-0.5 rounded-md font-semibold border border-[#0E7C86]/20">
                    {evt.typeName}
                  </span>
                </div>

                {/* Event Title */}
                <h3 className="font-bold text-base text-[#1F2430] leading-snug mb-2">
                  {evt.title}
                </h3>

                {/* Venue & Time Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600 mb-3 bg-[#FAF7F2] p-2.5 rounded-xl border border-stone-200/60">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#0E7C86] shrink-0" />
                    <span className="font-semibold text-stone-900">{evt.placeName}</span>
                    <span className="text-stone-400">({evt.neighborhood})</span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:justify-end">
                    <Clock size={14} className="text-[#B4552D] shrink-0" />
                    <span>ساعت برگزاری:</span>
                    <span className="font-bold text-stone-900">{evt.time}</span>
                  </div>
                </div>

                {/* Speaker & Maddah info */}
                {(evt.speaker || evt.eulogist) && (
                  <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mb-3">
                    {evt.speaker && (
                      <div className="flex items-center gap-1">
                        <UserCheck size={13} className="text-[#0E7C86]" />
                        <span>سخنران:</span>
                        <span className="font-medium text-stone-800">{evt.speaker}</span>
                      </div>
                    )}
                    {evt.eulogist && (
                      <div className="flex items-center gap-1">
                        <Mic2 size={13} className="text-[#B4552D]" />
                        <span>مداح:</span>
                        <span className="font-medium text-stone-800">{evt.eulogist}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions Row */}
                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlaceById(evt.placeId);
                    }}
                    className="text-[#0E7C86] hover:text-[#0A6B74] font-bold hover:underline cursor-pointer"
                  >
                    مسیریابی و مشخصات مسجد
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleShare(evt, e)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                      title="اشتراک‌گذاری"
                    >
                      {copiedId === evt.id ? (
                        <span className="text-emerald-600 font-bold text-[10px]">کپی شد</span>
                      ) : (
                        <Share2 size={15} />
                      )}
                    </button>

                    <button
                      onClick={(e) => toggleReminder(evt.id, e)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                        isReminded
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {isReminded ? <Check size={13} /> : <Bell size={13} />}
                      <span>{isReminded ? 'یادآور فعال' : 'یادآوری'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
