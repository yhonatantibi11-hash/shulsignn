import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import DisplayHeader from '@/components/display/DisplayHeader';
import PrayerTimesPanel from '@/components/display/PrayerTimesPanel';
import LessonsPanel from '@/components/display/LessonsPanel';
import EventsPanel from '@/components/display/EventsPanel';
import MessageTicker from '@/components/display/MessageTicker';
import ZmanimPanel from '@/components/display/ZmanimPanel';
import CustomDisplay from '@/components/display/CustomDisplay';

const DARK_VARS = {
  '--background': '222 30% 8%',
  '--foreground': '40 30% 92%',
  '--card': '222 25% 12%',
  '--card-foreground': '40 30% 92%',
  '--primary': '38 90% 55%',
  '--primary-foreground': '222 30% 8%',
  '--secondary': '222 20% 18%',
  '--secondary-foreground': '40 30% 90%',
  '--muted': '222 20% 15%',
  '--muted-foreground': '220 10% 55%',
  '--accent': '38 90% 55%',
  '--accent-foreground': '222 30% 8%',
  '--border': '222 20% 20%',
  '--ring': '38 90% 55%',
};

const LIGHT_VARS = {
  '--background': '45 60% 97%',
  '--foreground': '35 40% 12%',
  '--card': '42 80% 99%',
  '--card-foreground': '35 40% 12%',
  '--primary': '38 75% 38%',
  '--primary-foreground': '42 80% 99%',
  '--secondary': '44 50% 91%',
  '--secondary-foreground': '35 40% 20%',
  '--muted': '43 45% 93%',
  '--muted-foreground': '35 25% 42%',
  '--accent': '38 85% 48%',
  '--accent-foreground': '42 80% 99%',
  '--border': '40 40% 80%',
  '--ring': '38 75% 38%',
};

// Apply a realtime event directly to a list so the UI reflects changes instantly
// (no re-fetch round-trip on every change).
const applyEvent = (list, event, matches) => {
  if (!event) return list;
  switch (event.type) {
    case 'create':
      return matches(event.data) ? [...list, event.data] : list;
    case 'update': {
      const exists = list.some((i) => i.id === event.data.id);
      if (!exists && matches(event.data)) return [...list, event.data];
      return list.map((i) => (i.id === event.data.id ? event.data : i));
    }
    case 'delete':
      return list.filter((i) => i.id !== event.id);
    default:
      return list;
  }
};

export default function Display() {
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [events, setEvents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [customTheme, setCustomTheme] = useState(null);
  const [activePanel, setActivePanel] = useState(0);

  // Get synagogue ID from URL: /display?sid=xxx
  const hashQuery = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
    : window.location.search;
  const urlParams = new URLSearchParams(hashQuery);
  const synagogueId = urlParams.get('sid');

  const loadData = useCallback(async () => {
    if (!synagogueId) return;
    try {
      // The TV can remain open indefinitely. Always replace the public snapshot
      // before reading entities so changes from the admin appear automatically.
      await base44.public.refresh();
      const filter = { synagogue_id: synagogueId };
      const [pt, ls, ev, st] = await Promise.all([
        base44.entities.PrayerTime.filter(filter),
        base44.entities.TorahLesson.filter(filter),
        base44.entities.Event.filter(filter),
        base44.entities.SynagogueSettings.filter(filter)
      ]);
      setPrayerTimes(pt);
      setLessons(ls);
      setEvents(ev);
      setSettings(st[0] || null);
    } catch (error) {
      // Keep the last good screen on transient network failures. The next poll
      // retries automatically instead of blanking the synagogue display.
      console.warn('Display refresh failed; keeping the last snapshot', error);
    }
  }, [synagogueId]);

  // Load + live-subscribe to custom theme so theme edits reflect instantly.
  useEffect(() => {
    const theme = settings?.display_theme || 'dark';
    if (!theme.startsWith('custom:')) {
      setCustomTheme(null);
      return;
    }
    const id = theme.replace('custom:', '');
    base44.entities.DisplayTheme.get(id)
      .then((result) => setCustomTheme(result || null))
      .catch(() => setCustomTheme(null));
    const unsub = base44.entities.DisplayTheme.subscribe((event) => {
      if (!event) return;
      if (event.type === 'update' && event.data && event.data.id === id) setCustomTheme(event.data);
      if (event.type === 'delete' && event.id === id) setCustomTheme(null);
    });
    return () => unsub && unsub();
  }, [settings?.display_theme]);

  useEffect(() => {
    if (!synagogueId) return;
    const matches = (rec) => rec && rec.synagogue_id === synagogueId;
    const unsubs = [
      base44.entities.PrayerTime.subscribe((event) => setPrayerTimes((prev) => applyEvent(prev, event, matches))),
      base44.entities.TorahLesson.subscribe((event) => setLessons((prev) => applyEvent(prev, event, matches))),
      base44.entities.Event.subscribe((event) => setEvents((prev) => applyEvent(prev, event, matches))),
      base44.entities.SynagogueSettings.subscribe((event) => {
        if (!event) return;
        setSettings((prev) => {
          if (event.type === 'update' && prev && prev.id === event.data.id) return event.data;
          if (event.type === 'update' && matches(event.data)) return event.data;
          if (event.type === 'create' && matches(event.data)) return event.data;
          if (event.type === 'delete' && prev && prev.id === event.id) return null;
          return prev;
        });
      }),
    ];
    return () => unsubs.forEach((u) => u && u());
  }, [synagogueId]);

  useEffect(() => {
    let stopped = false;
    let timer;
    const refresh = async () => {
      await loadData();
      if (!stopped) timer = window.setTimeout(refresh, 5000);
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadData();
    };
    void refresh();
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('online', refreshWhenVisible);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('online', refreshWhenVisible);
    };
  }, [loadData]);

  // Support ?date=YYYY-MM-DD for preview
  const dateParam = urlParams.get('date');
  const today = dateParam ? new Date(dateParam) : new Date();
  today.setHours(0, 0, 0, 0);
  const futureEvents = events.filter(e => new Date(e.date) >= today);

  const theme = settings?.display_theme || 'dark';

  // Custom theme
  if (theme.startsWith('custom:') && customTheme) {
    return (
      <CustomDisplay
        theme={customTheme}
        prayerTimes={prayerTimes}
        lessons={lessons}
        events={events}
        settings={settings}
      />
    );
  }

  const isLight = theme === 'light';
  const themeVars = isLight ? LIGHT_VARS : DARK_VARS;

  const panels = [
    <PrayerTimesPanel key="prayers" prayerTimes={prayerTimes} />,
    <LessonsPanel key="lessons" lessons={lessons} />,
    <EventsPanel key="events" events={futureEvents} />,
    <ZmanimPanel key="zmanim" selectedKeys={settings?.zmanim_keys} location={settings} />,
  ];

  const panelLabels = ['תפילות', 'שיעורים', 'אירועים', 'זמני היום'];

  return (
    <div className="h-screen bg-background flex flex-col font-heebo overflow-hidden" dir="rtl" style={themeVars}>
      <DisplayHeader synagogueName={settings?.synagogue_name} />

      {/* Desktop: 4 columns */}
      <main className="hidden md:flex flex-1 p-6 overflow-hidden min-h-0">
        <div className="grid grid-cols-4 gap-6 w-full" style={{ height: '100%', gridTemplateRows: '100%' }}>
          <PrayerTimesPanel prayerTimes={prayerTimes} />
          <LessonsPanel lessons={lessons} />
          <EventsPanel events={futureEvents} />
          <ZmanimPanel selectedKeys={settings?.zmanim_keys} location={settings} />
        </div>
      </main>

      {/* Mobile: single panel with tabs */}
      <div className="flex md:hidden flex-col flex-1 overflow-hidden min-h-0">
        <div className="flex border-b border-border/50">
          {panelLabels.map((label, i) => (
            <button
              key={i}
              onClick={() => setActivePanel(i)}
              className={`flex-1 py-2 text-sm font-heebo font-medium transition-colors ${
                activePanel === i
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1 p-4 overflow-hidden min-h-0">
          {panels[activePanel]}
        </div>
      </div>

      <MessageTicker message={settings?.custom_message} secondaryMessage={settings?.secondary_message} />
      <div className="fixed bottom-1 left-2 text-xs font-heebo pointer-events-none select-none" style={{ color: 'white', mixBlendMode: 'difference', zIndex: 50 }}>
        מערכות תצוגה לבתי כנסת — 054-936-8660
      </div>
    </div>
  );
}
