import React from 'react';
import { Clock } from 'lucide-react';
import AutoScrollList from '@/components/display/AutoScrollList';

export default function PrayerTimesPanel({ prayerTimes, hideTitle = false, manualScroll = false }) {
  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const refDate = dateParam ? new Date(dateParam) : new Date();

  // Get current time (support time URL param for testing, e.g. ?date=2025-01-03&time=18:59)
  const timeParam = urlParams.get('time');
  let currentHour, currentMinute;
  if (timeParam) {
    const [h, m] = timeParam.split(':').map(Number);
    currentHour = h;
    currentMinute = m;
  } else {
    const now = new Date();
    currentHour = now.getHours();
    currentMinute = now.getMinutes();
  }
  const currentTime = currentHour * 60 + currentMinute; // minutes since midnight

  // Determine which days to show: always show today, and if Friday >= 19:00, also show Saturday
  const todayName = DAY_NAMES[refDate.getDay()];
  const isWeekday = refDate.getDay() >= 0 && refDate.getDay() <= 4; // sun-thu

  // Check if we should also show next day's prayers (Friday >= 19:00 → show Saturday too)
  // This works both in real-time (!dateParam) and when testing with date/time params
  const isFriday = refDate.getDay() === 5;
  const shouldShowNextDay = isFriday && currentTime >= 19 * 60;
  const nextDayName = shouldShowNextDay ? 'saturday' : null;

  const sorted = [...prayerTimes].
  filter((p) => {
    if (p.is_active === false) return false;
    const days = p.days || (p.day ? [p.day] : []);
    if (!days || days.length === 0 || days.includes('everyday')) return true;
    if (days.includes('weekdays') && isWeekday) return true;
    // Show if matches today OR (if Friday >= 19:00) matches Saturday
    if (days.includes(todayName)) return true;
    if (shouldShowNextDay && days.includes(nextDayName)) return true;
    return false;
  }).
  sort((a, b) => {
    if (a.sort_order !== b.sort_order) return (a.sort_order || 0) - (b.sort_order || 0);
    return (a.time || '').localeCompare(b.time || '');
  });

  // Get days label for display
  const getDaysLabel = (prayer) => {
    const days = prayer.days || (prayer.day_of_week ? [prayer.day_of_week] : []);
    if (!days || days.length === 0 || days.includes('everyday')) return null;
    const labels = { weekdays: 'חול', sunday: 'א', monday: 'ב', tuesday: 'ג', wednesday: 'ד', thursday: 'ה', friday: 'ו', saturday: 'שבת' };
    return days.map((d) => labels[d] || d).join(', ');
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {!hideTitle &&
      <div className="flex items-center gap-3 mb-5 w-fit px-4 py-3 rounded-2xl border border-white/20 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 100%)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-3xl font-frank font-bold text-[hsl(var(--popover-foreground))]">זמני תפילות</h2>
        </div>
      }
      
      <AutoScrollList manualScroll={manualScroll}>
        <div className="space-y-3">
          {sorted.map((prayer) =>
          <div
            key={prayer.id}
            className="flex items-center justify-between bg-secondary/95 rounded-xl px-5 py-4 border border-border/60">
            
              <div className="flex-1">
                <span className="text-2xl font-heebo font-bold text-foreground">
                  {prayer.name}
                </span>
                {getDaysLabel(prayer) &&
              <span className="text-sm text-foreground/70 mr-3 font-heebo">
                    ({getDaysLabel(prayer)})
                  </span>
              }
                {prayer.notes &&
              <p className="text-base text-foreground/75 font-heebo mt-0.5">{prayer.notes}</p>
              }
              </div>
              <span className="text-3xl font-heebo font-black text-primary tabular-nums" dir="ltr">
                {prayer.time}
              </span>
            </div>
          )}
          {sorted.length === 0 &&
          <p className="text-center text-muted-foreground text-xl py-10 font-heebo">
              אין זמני תפילות כרגע
            </p>
          }
        </div>
      </AutoScrollList>
    </div>);

}