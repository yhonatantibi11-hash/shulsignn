import { useState, useEffect } from 'react';

// Default location: Jerusalem
const DEFAULT_LAT = 31.7683;
const DEFAULT_LNG = 35.2137;
const DEFAULT_ELEV = 754;

export default function useJewishCalendar() {
  const [data, setData] = useState({ items: [], loading: true });

  useEffect(() => {
    let cancelled = false;

    async function fetchCalendar(lat, lng, elev) {
      const urlParams = new URLSearchParams(window.location.search);
      const dateParam = urlParams.get('date');
      const now = dateParam ? new Date(dateParam) : new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&ss=on&mf=on&c=on&M=on&s=on&o=on&lg=he&geo=pos&lat=${lat}&long=${lng}&elev=${elev}&start=${dateStr}&end=${dateStr}`;

      const res = await fetch(url);
      const calData = await res.json();
      const raw = calData.items || [];

      const RELEVANT = ['holiday', 'minor', 'roshchodesh', 'mf', 'modern', 'shabbat', 'omer', 'dafyomi'];
      const items = raw
        .filter(item => RELEVANT.includes(item.category))
        .map(item => {
          let displayText = item.hebrew || item.title || '';
          let subText = null;

          if (item.category === 'omer' && item.omer) {
            displayText = item.omer.count?.he || item.title_orig || item.hebrew;
            if (item.omer.sefira?.he) subText = item.omer.sefira.he;
          }

          return {
            category: item.category,
            title: item.title || '',
            hebrew: displayText,
            subText,
            isHanukkah: item.category === 'holiday' && (item.title_orig || '').toLowerCase().includes('hanukkah'),
          };
        });

      if (!cancelled) setData({ items, loading: false });
    }

    // First: try to fetch immediately with default (Jerusalem) coords
    fetchCalendar(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ELEV).catch(() => {
      if (!cancelled) setData(prev => ({ ...prev, loading: false }));
    });

    // Then: try to refine with actual geolocation if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            fetchCalendar(pos.coords.latitude, pos.coords.longitude, Math.round(pos.coords.altitude || 0))
              .catch(() => {});
          }
        },
        () => {}, // ignore error, already have default data
        { timeout: 8000 }
      );
    }

    // Refresh every hour
    const interval = setInterval(() => {
      fetchCalendar(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_ELEV).catch(() => {});
    }, 3600000);

    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return data;
}