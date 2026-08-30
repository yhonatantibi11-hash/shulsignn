import React from 'react';
import { BookOpen } from 'lucide-react';
import AutoScrollList from '@/components/display/AutoScrollList';

export default function LessonsPanel({ lessons, hideTitle = false, manualScroll = false }) {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const refDate = dateParam ? new Date(dateParam) : new Date();
  const todayStr = refDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = DAY_NAMES[refDate.getDay()];

  const active = lessons.
  filter((l) => {
    if (l.is_active === false) return false;
    if (l.schedule_type === 'one_time') return l.one_time_date === todayStr;
    // Weekly lessons - only show if today matches one of the selected days
    const days = l.days || [];
    if (days.length > 0) return days.includes(todayName);
    return false; // weekly lesson without days - don't show
  }).
  sort((a, b) => {
    // Lessons without time go last
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <div className="h-full flex flex-col min-h-0">
      {!hideTitle &&
      <div className="flex items-center gap-3 mb-5 w-fit px-4 py-3 rounded-2xl border border-white/20 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 100%)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-3xl font-frank font-bold text-[hsl(var(--popover-foreground))]">שיעורי תורה</h2>
        </div>
      }

      <AutoScrollList manualScroll={manualScroll}>
        <div className="space-y-3">
          {active.map((lesson) =>
          <div
            key={lesson.id}
            className="bg-secondary/95 rounded-xl border border-border/60 overflow-hidden">
            
              {lesson.image_url &&
            <img src={lesson.image_url} alt={lesson.title} className="w-full block" />
            }
              <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-heebo font-bold text-foreground">{lesson.title}</h3>
                  <p className="text-lg text-accent font-heebo font-medium">{lesson.speaker}</p>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-heebo font-black text-primary tabular-nums" dir="ltr">
                    {lesson.time}
                  </span>
                  <p className="text-base text-muted-foreground font-heebo">{lesson.day}</p>
                </div>
              </div>
              {lesson.location &&
              <p className="text-base text-foreground/75 font-heebo mt-1">📍 {lesson.location}</p>
              }
              </div>
            </div>
          )}
          {active.length === 0 &&
          <p className="text-center text-muted-foreground text-xl py-10 font-heebo">
              אין שיעורים כרגע
            </p>
          }
        </div>
      </AutoScrollList>
    </div>);

}