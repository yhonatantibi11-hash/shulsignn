import React from 'react';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import AutoScrollList from '@/components/display/AutoScrollList';

export default function EventsPanel({ events, hideTitle = false, manualScroll = false }) {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const today = dateParam ? new Date(dateParam) : new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events.
  filter((e) => new Date(e.date) >= today).
  sort((a, b) => {
    const dateDiff = new Date(a.date) - new Date(b.date);
    if (dateDiff !== 0) return dateDiff;
    return (a.time || '').localeCompare(b.time || '');
  });

  return (
    <div className="h-full flex flex-col min-h-0">
      {!hideTitle &&
      <div className="flex items-center gap-3 mb-5 w-fit px-4 py-3 rounded-2xl border border-white/20 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 100%)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-3xl font-frank font-bold text-[hsl(var(--popover-foreground))]">אירועים</h2>
        </div>
      }

      <AutoScrollList manualScroll={manualScroll}>
        <div className="space-y-3">
          {upcoming.map((event) =>
          <div key={event.id} className="bg-secondary/95 rounded-xl border border-border/60 overflow-hidden">
              {event.image_url &&
            <img src={event.image_url} alt={event.name} className="w-full block" />
            }
              <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-heebo font-bold text-foreground">{event.name}</h3>
                <div className="text-left">
                  {event.time &&
                  <span className="text-2xl font-heebo font-black text-primary tabular-nums" dir="ltr">
                      {String(event.time).slice(0, 5)}
                    </span>
                  }
                  <p className="text-base text-foreground/75 font-heebo">
                    {format(new Date(event.date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </div>
              {event.description &&
              <p className="text-lg text-foreground/75 font-heebo mt-1">{event.description}</p>
              }
              </div>
            </div>
          )}
          {upcoming.length === 0 &&
          <p className="text-center text-muted-foreground text-xl py-10 font-heebo">
              אין אירועים קרובים
            </p>
          }
        </div>
      </AutoScrollList>
    </div>);

}
