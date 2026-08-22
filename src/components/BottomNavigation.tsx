import React from 'react';
import { Home, Map, Calendar, Layers, PlusCircle } from 'lucide-react';

export type TabType = 'home' | 'map' | 'events' | 'neighborhoods' | 'submit';

interface BottomNavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ size: number; className?: string }> }[] = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'map', label: 'نقشه', icon: Map },
    { id: 'events', label: 'مراسم', icon: Calendar },
    { id: 'neighborhoods', label: 'محله‌ها', icon: Layers },
    { id: 'submit', label: 'ثبت', icon: PlusCircle },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#F7F3EC]/95 backdrop-blur-lg border-t border-stone-200/90 shadow-lg md:max-w-md md:mx-auto md:bottom-3 md:rounded-3xl md:border"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'text-[#0E7C86] font-extrabold bg-[#0E7C86]/10 scale-105'
                  : 'text-stone-500 hover:text-stone-800 font-medium'
              }`}
              aria-label={item.label}
            >
              <Icon
                size={20}
                className={isActive ? 'text-[#0E7C86]' : 'text-stone-500'}
              />
              <span className="text-[11px] mt-0.5 whitespace-nowrap leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
