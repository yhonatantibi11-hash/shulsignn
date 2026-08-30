import React, { useState } from 'react';
import DisplayHeader from '@/components/display/DisplayHeader';
import PrayerTimesPanel from '@/components/display/PrayerTimesPanel';
import LessonsPanel from '@/components/display/LessonsPanel';
import EventsPanel from '@/components/display/EventsPanel';
import ZmanimPanel from '@/components/display/ZmanimPanel';
import JewishCalendarBar from '@/components/display/JewishCalendarBar';
import MessageTicker from '@/components/display/MessageTicker';

function hexToHsl(hex) {
  if (!hex || !hex.startsWith('#')) return null;
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function CustomDisplay({ theme, prayerTimes, lessons, events, settings }) {
  const urlParams = new URLSearchParams(window.location.search);
  const dateParam = urlParams.get('date');
  const today = dateParam ? new Date(dateParam) : new Date();
  today.setHours(0, 0, 0, 0);
  const futureEvents = events.filter(e => new Date(e.date) >= today);
  const activeWidgets = (theme?.widget_visible || ['prayers', 'lessons', 'events', 'zmanim']);
  const widgetOrder = (theme?.widget_order || ['prayers', 'lessons', 'events', 'zmanim'])
    .filter(w => activeWidgets.includes(w));

  // Build CSS variables from theme hex colors
  const primary = hexToHsl(theme?.color_primary || '#d4a017');
  const cardBg = hexToHsl(theme?.color_card_bg || '#1a1a2e');
  const text = hexToHsl(theme?.color_text || '#f0e6d3');
  const textMuted = hexToHsl(theme?.color_text_muted || '#a09070');
  const border = hexToHsl(theme?.color_border || '#3a3a5c');
  const bgHex = theme?.bg_type === 'color' ? (theme?.bg_value || '#0d0d1a') : null;
  const bgHsl = hexToHsl(bgHex);

  const cssVars = {
    ...(bgHsl ? { '--background': bgHsl } : {}),
    '--foreground': text,
    '--card': cardBg,
    '--card-foreground': text,
    '--primary': primary,
    '--primary-foreground': bgHsl || '222 30% 8%',
    '--secondary': cardBg,
    '--secondary-foreground': text,
    '--muted': cardBg,
    '--muted-foreground': textMuted,
    '--accent': primary,
    '--accent-foreground': bgHsl || '222 30% 8%',
    '--border': border,
    '--ring': primary,
  };

  const bgStyle =
    theme?.bg_type === 'image_url' && theme?.bg_value
      ? { backgroundImage: `url(${theme.bg_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : { backgroundColor: theme?.bg_value || '#0d0d1a' };

  function renderWidget(key, hideTitle = false, manualScroll = false) {
    switch (key) {
      case 'prayers': return <PrayerTimesPanel key={key} prayerTimes={prayerTimes} hideTitle={hideTitle} manualScroll={manualScroll} />;
      case 'lessons': return <LessonsPanel key={key} lessons={lessons} hideTitle={hideTitle} manualScroll={manualScroll} />;
      case 'events': return <EventsPanel key={key} events={futureEvents} hideTitle={hideTitle} manualScroll={manualScroll} />;
      case 'zmanim': return <ZmanimPanel key={key} hideTitle={hideTitle} selectedKeys={settings?.zmanim_keys} />;
      default: return null;
    }
  }

  const panelLabels = { prayers: 'תפילות', lessons: 'שיעורים', events: 'אירועים', zmanim: 'זמני היום' };
  const [activePanel, setActivePanel] = React.useState(0);
  const orderedWidgets = widgetOrder.slice(0, 4);

  return (
    <div
      className="h-screen flex flex-col font-heebo overflow-hidden"
      dir="rtl"
      style={{ ...bgStyle, ...cssVars }}
    >
      {theme?.bg_type === 'image_url' && theme?.bg_value && (
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />
      )}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        <DisplayHeader synagogueName={settings?.synagogue_name} />

        {/* Desktop: grid */}
        <main className="hidden md:flex flex-1 p-6 overflow-hidden min-h-0">
          <div className="grid grid-cols-4 gap-6 h-full w-full">
            {orderedWidgets.map(w => renderWidget(w))}
          </div>
        </main>

        {/* Mobile: tabs */}
        <div className="flex md:hidden flex-col flex-1 overflow-hidden min-h-0">
          <div className="flex border-b border-white/20">
            {orderedWidgets.map((w, i) => (
              <button
                key={w}
                onClick={() => setActivePanel(i)}
                className={`flex-1 py-2 text-sm font-heebo font-medium transition-colors ${
                  activePanel === i
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-foreground/60'
                }`}
              >
                {panelLabels[w] || w}
              </button>
            ))}
          </div>
          <div className="flex-1 p-4 overflow-hidden min-h-0">
            {renderWidget(orderedWidgets[activePanel], true, true)}
          </div>
        </div>

        <JewishCalendarBar />
        <MessageTicker message={settings?.custom_message} secondaryMessage={settings?.secondary_message} />
      </div>
      <div className="fixed bottom-1 left-2 text-xs font-heebo pointer-events-none select-none" style={{ color: 'white', mixBlendMode: 'difference', zIndex: 50 }}>
        מערכות תצוגה לבתי כנסת — 054-936-8660
      </div>
    </div>
  );
}