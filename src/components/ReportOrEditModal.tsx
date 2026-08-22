import React, { useState } from 'react';
import { Place } from '../types';
import { X, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface ReportOrEditModalProps {
  place: Place;
  onClose: () => void;
}

export const ReportOrEditModal: React.FC<ReportOrEditModalProps> = ({ place, onClose }) => {
  const [suggestionType, setSuggestionType] = useState<'info_fix' | 'prayer_times' | 'facilities' | 'new_photo'>('info_fix');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-['Vazirmatn',sans-serif]">
      <div className="relative w-full max-w-md bg-[#FAF7F2] rounded-3xl p-5 shadow-2xl border border-stone-300 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#0E7C86]/10 text-[#0E7C86] flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-[#1F2430]">
                اصلاح یا تکمیل شناسنامهٔ «{place.name}»
              </h3>
              <p className="text-[11px] text-stone-500">مشارکت شهروندی برای پایش اطلاعات مساجد دزفول</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 size={42} className="text-emerald-600 mx-auto animate-bounce" />
            <h4 className="font-bold text-stone-900 text-sm">با سپاس از همکاری شما!</h4>
            <p className="text-xs text-stone-600">
              پیشنهاد اصلاح شما دریافت شد و پس از بازبینی هیئت تحریریه در شناسنامه مسجد اعمال خواهد شد.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1.5">موضوع ویرایش:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'info_fix', label: 'اطلاعات عمومی و نام امام' },
                  { id: 'prayer_times', label: 'ساعت اقامه نماز جماعت' },
                  { id: 'facilities', label: 'امکانات (شوادان، رمپ، وضوخانه)' },
                  { id: 'new_photo', label: 'نشانی و کروکی دسترسی' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSuggestionType(item.id as any)}
                    className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-right ${
                      suggestionType === item.id
                        ? 'bg-[#0E7C86] text-white border-[#0E7C86]'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                توضیحات و اطلاعات صحیح:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثلاً: ساعت نماز مغرب ۱۰ دقیقه دیرتر برگزار می‌شود، یا شماره تلفن خادم تغییر کرده است..."
                rows={3}
                required
                className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#0E7C86] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">
                شماره تماس یا نام شما (اختیاری):
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="مثلاً: کربلایی احمدی (خادم مسجد)"
                className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs focus:ring-2 focus:ring-[#0E7C86] focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0E7C86] hover:bg-[#0A6B74] text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Send size={14} />
              <span>ارسال پیشنهاد اصلاح</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
