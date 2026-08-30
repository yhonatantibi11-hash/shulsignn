import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import useSynagogueId from '@/hooks/useSynagogueId';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, CalendarDays, BookOpen } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { he } from 'date-fns/locale';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function dateToISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function CalendarView() {
  const synagogueId = useSynagogueId();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['events', synagogueId],
    queryFn: () => synagogueId ? base44.entities.Event.filter({ synagogue_id: synagogueId }) : [],
    enabled: !!synagogueId,
  });

  const { data: lessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ['lessons', synagogueId],
    queryFn: () => synagogueId ? base44.entities.TorahLesson.filter({ synagogue_id: synagogueId }) : [],
    enabled: !!synagogueId,
  });

  const isLoading = loadingEvents || loadingLessons;

  // Build a map: ISO date -> { events: [], lessons: [] }
  const dayMap = useMemo(() => {
    const map = new Map();
    if (!synagogueId) return map;

    // Events
    events.forEach((ev) => {
      const key = ev.date ? dateToISO(new Date(ev.date)) : null;
      if (!key) return;
      if (!map.has(key)) map.set(key, { events: [], lessons: [] });
      map.get(key).events.push(ev);
    });

    // Lessons
    lessons.forEach((lesson) => {
      if (lesson.schedule_type === 'one_time') {
        if (!lesson.one_time_date) return;
        const key = dateToISO(new Date(lesson.one_time_date));
        if (!map.has(key)) map.set(key, { events: [], lessons: [] });
        map.get(key).lessons.push(lesson);
      }
      // Weekly lessons handled separately in weeklyByDow (appear every matching weekday)
    });

    return map;
  }, [events, lessons, synagogueId]);

  // Map: day-of-week (0-6) -> weekly lessons (active)
  const weeklyByDow = useMemo(() => {
    const m = [[], [], [], [], [], [], []];
    lessons.forEach((lesson) => {
      if (lesson.schedule_type === 'one_time') return;
      const days = lesson.days?.length > 0 ? lesson.days : (lesson.day ? [lesson.day] : []);
      days.forEach((dayName) => {
        const dow = DAY_NAMES.indexOf(dayName);
        if (dow >= 0) m[dow].push(lesson);
      });
    });
    return m;
  }, [lessons]);

  // Calendar grid: weeks starting Sunday
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function itemsForDay(d) {
    const key = dateToISO(d);
    const fromMap = dayMap.get(key) || { events: [], lessons: [] };
    const weekly = (weeklyByDow[d.getDay()] || []).filter((l) => l.is_active !== false);
    const oneTime = fromMap.lessons.filter((l) => l.schedule_type === 'one_time');
    return {
      events: fromMap.events,
      lessons: [...weekly, ...oneTime],
    };
  }

  const selectedItems = selectedDay ? itemsForDay(selectedDay) : null;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heebo font-bold text-foreground">
          {format(currentMonth, 'MMMM yyyy', { locale: he })}
        </h2>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="font-heebo" onClick={() => setCurrentMonth(new Date())}>
            היום
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs font-heebo text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-sky-500" /> אירועים
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-amber-500" /> שיעורים
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-secondary/50">
            {['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'].map((d) => (
              <div key={d} className="text-center py-2 text-xs font-heebo font-bold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const inMonth = isSameMonth(d, currentMonth);
              const isToday = isSameDay(d, today);
              const { events: ev, lessons: ls } = itemsForDay(d);
              const total = ev.length + ls.length;
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => (total > 0 ? setSelectedDay(d) : null)}
                  className={`min-h-[70px] md:min-h-[90px] p-1.5 border-b border-l border-border text-right transition-colors ${
                    inMonth ? 'bg-card' : 'bg-muted/30'
                  } ${total > 0 ? 'hover:bg-primary/5 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`text-sm font-heebo font-bold mb-1 ${isToday ? 'w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center' : 'text-foreground'}`}>
                    {d.getDate()}
                  </div>
                  {inMonth && total > 0 && (
                    <div className="space-y-0.5">
                      {ev.length > 0 && (
                        <div className="flex items-center gap-1 truncate">
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                          <span className="text-[10px] font-heebo text-muted-foreground truncate">{ev.length} אירוע{ev.length > 1 ? 'ים' : ''}</span>
                        </div>
                      )}
                      {ls.length > 0 && (
                        <div className="flex items-center gap-1 truncate">
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-[10px] font-heebo text-muted-foreground truncate">{ls.length} שיעור{ls.length > 1 ? 'ים' : ''}</span>
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day detail dialog */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent dir="rtl" className="font-heebo max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heebo">
              {selectedDay ? format(selectedDay, 'EEEE d בMMMM yyyy', { locale: he }) : ''}
            </DialogTitle>
          </DialogHeader>

          {selectedItems && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              {selectedItems.events.length === 0 && selectedItems.lessons.length === 0 && (
                <p className="text-muted-foreground font-heebo text-center py-6">אין פעילות ביום זה</p>
              )}

              {selectedItems.events.length > 0 && (
                <div>
                  <h3 className="font-heebo font-bold text-sm text-sky-700 mb-2 flex items-center gap-1">
                    <CalendarDays className="w-4 h-4" /> אירועים
                  </h3>
                  <div className="space-y-2">
                    {selectedItems.events.map((ev) => (
                      <div key={ev.id} className="rounded-lg bg-sky-50 border border-sky-200 p-2.5">
                        <div className="flex justify-between items-start">
                          <span className="font-heebo font-bold text-foreground">{ev.name}</span>
                          {ev.time && <span className="font-heebo text-sm text-primary tabular-nums" dir="ltr">{ev.time}</span>}
                        </div>
                        {ev.description && <p className="text-xs text-muted-foreground font-heebo mt-1">{ev.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedItems.lessons.length > 0 && (
                <div>
                  <h3 className="font-heebo font-bold text-sm text-amber-700 mb-2 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" /> שיעורים
                  </h3>
                  <div className="space-y-2">
                    {selectedItems.lessons.map((ls) => (
                      <div key={ls.id} className="rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                        <div className="flex justify-between items-start">
                          <span className="font-heebo font-bold text-foreground">{ls.title}</span>
                          {ls.time && <span className="font-heebo text-sm text-primary tabular-nums" dir="ltr">{ls.time}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground font-heebo mt-1">
                          {ls.speaker}
                          {ls.location ? ` · ${ls.location}` : ''}
                          {ls.schedule_type === 'weekly' ? ' · שבועי' : ' · חד פעמי'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)} className="font-heebo">סגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}