import React from 'react';
import useZmanim from '@/hooks/useZmanim';
import useClock from '@/hooks/useClock';
import { Sun } from 'lucide-react';

export default function ZmanimPanel({ hideTitle = false, selectedKeys }) {
  const { zmanim, loading, error } = useZmanim(selectedKeys);
  const { time: now } = useClock();

  // Highlight the next upcoming zman
  const getNextZmanKey = () => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const z of zmanim) {
      const [h, m] = z.time.split(':').map(Number);
      if (h * 60 + m > currentMinutes) return z.key;
    }
    return null;
  };

  const nextKey = getNextZmanKey();

  return (
    <div className="h-full flex flex-col">
      {!hideTitle &&
      <div className="flex items-center gap-3 mb-4 w-fit px-4 py-3 rounded-2xl border border-white/20 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 100%)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Sun className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-3xl font-frank font-bold text-[hsl(var(--popover-foreground))]">זמני היום</h2>
        </div>
      }

      {loading &&
      <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }

      {error && !loading &&
      <p className="text-muted-foreground text-lg text-center py-6 font-heebo">{error}</p>
      }

      {!loading && !error &&
      <div className="grid grid-cols-1 gap-1.5 flex-1 overflow-hidden">
          {zmanim.map((z) => {
          const isNext = z.key === nextKey;
          const [h, m] = z.time.split(':').map(Number);
          const zMinutes = h * 60 + m;
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const isPast = zMinutes < nowMinutes;

          return (
            <div
              key={z.key}
              className={`
                  flex items-center justify-between rounded-xl px-4 py-2.5 transition-all
                  ${isNext ?
              'bg-secondary/95 border-2 border-amber-400/80 shadow-md' :
              'bg-secondary/95 border border-border/60'}
                `
              }>
              
                <div className="flex items-center gap-2">
                  {isNext &&
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                }
                  <span className={`font-heebo text-2xl ${isNext ? 'font-bold text-amber-300' : 'text-foreground font-medium'}`}>
                    {z.label}
                  </span>
                </div>
                <span
                className={`font-heebo font-bold tabular-nums text-3xl ${isNext ? 'text-amber-300' : 'text-primary'}`}
                dir="ltr">
                
                  {z.time}
                </span>
              </div>);

        })}
        </div>
      }
    </div>);

}