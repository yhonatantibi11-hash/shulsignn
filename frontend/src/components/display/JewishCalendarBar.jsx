import React, { useState, useEffect } from 'react';
import useJewishCalendar from '@/hooks/useJewishCalendar';
import { CalendarDays, BookOpen, Star, Flame, Moon, Sun } from 'lucide-react';

const CATEGORY_ICONS = {
  holiday: CalendarDays,
  minor: CalendarDays,
  roshchodesh: Moon,
  mf: CalendarDays,
  modern: Sun,
  shabbat: Star,
  omer: Star,
  dafyomi: BookOpen,
};

function getIcon(item) {
  if (item.isHanukkah) return Flame;
  return CATEGORY_ICONS[item.category] || CalendarDays;
}

export default function JewishCalendarBar() {
  const { items, loading } = useJewishCalendar();
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [items.length]);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => setActiveIdx(prev => (prev + 1) % items.length), 10000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (loading || items.length === 0) return null;

  const active = items[activeIdx] || items[0];
  const Icon = getIcon(active);

  return (
    <div className="bg-transparent border-t border-white/10 px-4 py-3" dir="rtl">
      <div className="flex gap-2 flex-wrap items-center">
        {/* Pills for navigation */}
        {items.map((item, idx) => {
          const ItemIcon = getIcon(item);
          const isActive = activeIdx === idx;
          return (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className="flex items-center gap-2 px-4 py-2 rounded-full border font-heebo font-semibold transition-all bg-primary text-primary-foreground border-primary shadow-md text-base"
            >
              <ItemIcon className="w-4 h-4 shrink-0" />
              <span>{item.hebrew}</span>
              {isActive && item.subText && (
                <span className="text-primary-foreground/70 text-sm font-normal">— {item.subText}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}