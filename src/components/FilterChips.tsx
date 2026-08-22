import React from 'react';
import { FILTER_CHIPS } from '../data/dezfulData';
import { Sparkles, Clock, MapPin, Building, Flame, BookOpen, Users, Accessibility, Compass } from 'lucide-react';

interface FilterChipsProps {
  activeFilter: string;
  onSelectFilter: (filterId: string) => void;
  resultCount?: number;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilter,
  onSelectFilter,
}) => {
  // Helper to render relevant mini icons
  const getFilterIcon = (id: string) => {
    switch (id) {
      case 'open_now':
        return <Clock size={14} className="shrink-0" />;
      case 'nearest':
        return <MapPin size={14} className="shrink-0" />;
      case 'historic':
        return <Building size={14} className="shrink-0" />;
      case 'hussainiyas':
        return <Flame size={14} className="shrink-0 text-amber-500" />;
      case 'today_events':
        return <Sparkles size={14} className="shrink-0 text-amber-400" />;
      case 'quran_class':
        return <BookOpen size={14} className="shrink-0" />;
      case 'women_section':
        return <Users size={14} className="shrink-0" />;
      case 'wheelchair':
        return <Accessibility size={14} className="shrink-0" />;
      case 'has_shavadan':
        return <Compass size={14} className="shrink-0 text-[#B4552D]" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full py-2 border-y border-stone-200/60 bg-[#F7F3EC]/70">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                id={`filter-chip-${chip.id}`}
                onClick={() => onSelectFilter(chip.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#0E7C86] text-white shadow-sm ring-2 ring-[#0E7C86]/20'
                    : 'bg-white/90 text-stone-700 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80 shadow-2xs'
                }`}
              >
                {getFilterIcon(chip.id)}
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
