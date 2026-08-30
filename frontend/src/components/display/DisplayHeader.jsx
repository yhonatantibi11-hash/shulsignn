import React from 'react';
import useClock from '@/hooks/useClock';
import useHebrewDate from '@/hooks/useHebrewDate';

export default function DisplayHeader({ synagogueName }) {
  const { formatted: timeStr, dateFormatted } = useClock();
  const { hebrewDate, parasha, loading } = useHebrewDate();

  return (
    <header className="border-b border-white/20 px-8 py-5 shadow-lg" style={{ WebkitBackdropFilter: 'blur(24px)', backdropFilter: 'blur(24px)', background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.14) 100%)' }}>
      {/* Desktop layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="text-right flex-1">
          <p className="text-4xl font-frank font-bold text-black">
            {loading ? '...' : hebrewDate}
          </p>
          {parasha &&
          <p className="text-2xl font-heebo font-medium mt-0.5 text-black/80">
              {parasha}
            </p>
          }
        </div>
        <div className="text-center flex-1">
          <h1 className="text-4xl font-frank font-black text-black tracking-wide">
            {synagogueName || 'בית הכנסת'}
          </h1>
        </div>
        <div className="text-left flex-1">
          <p className="text-7xl font-heebo font-bold text-black tabular-nums tracking-tight" dir="ltr">
            {timeStr}
          </p>
          <p className="text-black/70 mt-0.5 text-5xl no-underline not-italic [font-family:'Frank_Ruhl_Libre',_serif]">
            {dateFormatted}
          </p>
        </div>
      </div>

      {/* Mobile layout - no clock */}
      <div className="flex md:hidden items-center justify-between px-0 py-0">
        <div className="text-right">
          <p className="text-2xl font-frank font-bold text-black">
            {loading ? '...' : hebrewDate}
          </p>
          {parasha &&
          <p className="text-sm font-heebo font-medium mt-0.5 text-black/80">
              {parasha}
            </p>
          }
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-frank font-black text-black tracking-wide">
            {synagogueName || 'בית הכנסת'}
          </h1>
        </div>
        <div className="text-left">
          <p className="text-xl text-black/70 font-heebo" dir="ltr">
            {dateFormatted}
          </p>
        </div>
      </div>
    </header>);

}