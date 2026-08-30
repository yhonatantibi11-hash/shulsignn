import { useState, useEffect } from 'react';

// Full catalog of zmanim available from the hebcal API.
// 'shabbatIn' / 'shabbatOut' are special keys pulled from hebcal's Shabbat endpoint.
// The gabbai can pick any subset; unknown/unsupported keys are silently ignored.
export const ZMANIM_CONFIG = [
  { key: 'alotHaShachar',      label: 'עלות השחר',                icon: '🌌' },
  { key: 'misheyakir',         label: 'משיכיר',                  icon: '🌠' },
  { key: 'sunrise',            label: 'הנץ החמה',                 icon: '🌅' },
  { key: 'sofZmanShmaMGA',     label: 'סוף זמן ק"ש (מג"א)',         icon: '📜' },
  { key: 'sofZmanShma',        label: 'סוף זמן ק"ש (גר"א)',        icon: '📜' },
  { key: 'sofZmanTfillaMGA',   label: 'סוף זמן תפילה (מג"א)',        icon: '🕊️' },
  { key: 'sofZmanTfilla',      label: 'סוף זמן תפילה (גר"א)',       icon: '🕊️' },
  { key: 'chatzot',            label: 'חצות היום',               icon: '☀️' },
  { key: 'chatzotNight',       label: 'חצות הלילה',             icon: '🌙' },
  { key: 'minchaGedola',       label: 'מנחה גדולה',             icon: '🌤️' },
  { key: 'minchaGedolaMGA',    label: 'מנחה גדולה (מג"א)',        icon: '🌤️' },
  { key: 'minchaKetana',       label: 'מנחה קטנה',              icon: '🌥️' },
  { key: 'minchaKetanaMGA',    label: 'מנחה קטנה (מג"א)',         icon: '🌥️' },
  { key: 'plagHaMincha',      label: 'פלג המנחה',              icon: '🌆' },
  { key: 'shabbatIn',         label: 'כניסת שבת',              icon: '🕯️' },
  { key: 'sunset',            label: 'שקיעת החמה',             icon: '🌇' },
  { key: 'tzeit85deg',        label: 'צאת הכוכבים',            icon: '🌃' },
  { key: 'tzeit7083deg',      label: 'צאת הכוכבים (7.083°)',    icon: '🌃' },
  { key: 'tzeit72min',        label: 'צאת הכוכבים (72 דקות)',    icon: '🌃' },
  { key: 'tzeit50min',        label: 'צאת הכוכבים (50 דקות)',    icon: '🌃' },
  { key: 'tzeit42min',        label: 'צאת הכוכבים (42 דקות)',    icon: '🌃' },
  { key: 'shabbatOut',        label: 'יציאת שבת',              icon: '✨' },
];

// Keys displayed by default (when the gabbai has not customized the selection)
export const DEFAULT_ZMANIM_KEYS = [
  'alotHaShachar',
  'sunrise',
  'sofZmanShma',
  'sofZmanTfilla',
  'chatzot',
  'minchaGedola',
  'plagHaMincha',
  'sunset',
  'tzeit85deg',
];

function formatTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function useZmanim(selectedKeys) {
  const [zmanim, setZmanim] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get geolocation once
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Fallback: Jerusalem
        setLocation({ lat: 31.7683, lng: 35.2137 });
      },
      { timeout: 8000 }
    );
  }, []);

  const keys = (selectedKeys && selectedKeys.length > 0) ? selectedKeys : DEFAULT_ZMANIM_KEYS;
  const keysKey = keys.join(',');
  const wantShabbat = keys.includes('shabbatIn') || keys.includes('shabbatOut');

  // Fetch zmanim whenever location changes or daily refresh
  useEffect(() => {
    if (!location) return;

    async function fetchZmanim() {
      setLoading(true);
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      // Derive the user's local timezone from the browser; combine with GPS coordinates
      // so hebcal computes zmanim for the user's actual location and clock settings.
      const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jerusalem';
      try {
        const res = await fetch(
          `https://www.hebcal.com/zmanim?cfg=json&latitude=${location.lat}&longitude=${location.lng}&date=${dateStr}&tzid=${tzid}`
        );
        const data = await res.json();
        const times = data.times || {};

        // Shabbat entry/exit (separate endpoint) — only if requested
        let candlesTime = null;
        let havdalahTime = null;
        if (wantShabbat) {
          try {
            const sres = await fetch(
              `https://www.hebcal.com/shabbat?cfg=json&geo=pos&latitude=${location.lat}&longitude=${location.lng}&tzid=${tzid}`
            );
            const sdata = await sres.json();
            const items = sdata.items || [];
            const candles = items.find(i => i.category === 'candles');
            const havdalah = items.find(i => i.category === 'havdalah');
            if (candles) candlesTime = formatTime(candles.date);
            if (havdalah) havdalahTime = formatTime(havdalah.date);
          } catch (e) { /* ignore shabbat fetch errors */ }
        }

        const parsed = keys
          .map(key => {
            const config = ZMANIM_CONFIG.find(z => z.key === key);
            if (!config) return null;
            let timeStr;
            if (key === 'shabbatIn') timeStr = candlesTime;
            else if (key === 'shabbatOut') timeStr = havdalahTime;
            else timeStr = formatTime(times[key]);
            if (!timeStr) return null;
            return { key, label: config.label, icon: config.icon, time: timeStr };
          })
          .filter(Boolean);

        setZmanim(parsed);
        setError(null);
      } catch (err) {
        setError('שגיאה בטעינת זמני היום');
      } finally {
        setLoading(false);
      }
    }

    fetchZmanim();

    // Refresh at midnight
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
    const timer = setTimeout(fetchZmanim, msUntilMidnight);
    return () => clearTimeout(timer);
  }, [location, keysKey, wantShabbat]);

  return { zmanim, loading, error };
}