"use client";

import { BookOpen, CalendarDays, Clock3, MapPin, Sunrise } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { PublicDisplayData } from "@/lib/shulsign-data";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const LABELS: Record<string, string> = {
  weekdays: "חול", sunday: "א׳", monday: "ב׳", tuesday: "ג׳",
  wednesday: "ד׳", thursday: "ה׳", friday: "ו׳", saturday: "שבת",
};

function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="display-panel">
      <div className="panel-title"><span>{icon}</span><h2>{title}</h2></div>
      <div className="panel-content">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="empty-state">{children}</p>;

export default function DisplayScreen({ data }: { data: PublicDisplayData }) {
  const [now, setNow] = useState(() => new Date());
  const [activePanel, setActivePanel] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    const refresh = window.setInterval(() => window.location.reload(), 60_000);
    return () => { window.clearInterval(timer); window.clearInterval(refresh); };
  }, []);

  const today = DAYS[now.getDay()];
  const isWeekday = now.getDay() <= 4;
  const prayers = useMemo(() => [...data.prayer_times].filter((item) => {
    if (!item.days?.length || item.days.includes("everyday")) return true;
    if (item.days.includes("weekdays") && isWeekday) return true;
    return item.days.includes(today);
  }).sort((a, b) => a.sort_order - b.sort_order || a.time.localeCompare(b.time)), [data.prayer_times, isWeekday, today]);

  const dateKey = now.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
  const lessons = useMemo(() => data.lessons.filter((item) => item.schedule_type === "one_time"
    ? item.one_time_date === dateKey : item.days.includes(today))
    .sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99")), [data.lessons, dateKey, today]);

  const themeId = data.settings.display_theme?.replace("custom:", "");
  const theme = data.themes.find((item) => item.id === themeId) ?? data.themes[0];
  const imageBackground = theme?.bg_type === "image_url" && theme.bg_value
    ? `linear-gradient(rgba(4,8,18,.3), rgba(4,8,18,.58)), url(${theme.bg_value})` : undefined;
  const style = {
    "--display-primary": theme?.color_primary || "#d4a017",
    "--display-card": theme?.color_card_bg || "#17182b",
    "--display-text": theme?.color_text || "#f7eddc",
    "--display-muted": theme?.color_text_muted || "#b9aa91",
    "--display-border": theme?.color_border || "#45415b",
    backgroundImage: imageBackground,
    backgroundColor: theme?.bg_type === "color" ? theme.bg_value || "#0a101f" : undefined,
  } as CSSProperties;

  const panels = [
    { title: "זמני תפילות", short: "תפילות", icon: <Clock3 />, body: prayers.length ? prayers.map((item) => (
      <article className="schedule-row" key={item.id}><div><h3>{item.name}</h3><p>{item.days.map((day) => LABELS[day] || day).join(", ")}{item.notes ? ` · ${item.notes}` : ""}</p></div><time>{item.time}</time></article>
    )) : <Empty>אין זמני תפילה להיום</Empty> },
    { title: "שיעורי תורה", short: "שיעורים", icon: <BookOpen />, body: lessons.length ? lessons.map((item) => (
      <article className="schedule-row" key={item.id}><div><h3>{item.title}</h3><p>{item.speaker}</p>{item.location && <small><MapPin />{item.location}</small>}</div><time>{item.time || "לאחר התפילה"}</time></article>
    )) : <Empty>אין שיעורים מתוכננים להיום</Empty> },
    { title: "אירועים קרובים", short: "אירועים", icon: <CalendarDays />, body: data.events.length ? data.events.map((item) => {
      const date = new Date(`${item.date}T12:00:00`);
      return <article className="event-card" key={item.id}><div className="event-date"><strong>{date.getDate()}</strong><span>{new Intl.DateTimeFormat("he-IL", { month: "short" }).format(date)}</span></div><div><h3>{item.name}</h3><p>{[item.time, item.description].filter(Boolean).join(" · ")}</p></div></article>;
    }) : <Empty>אין אירועים קרובים</Empty> },
    { title: "זמני היום", short: "זמנים", icon: <Sunrise />, body: <div className="location-needed"><MapPin /><h3>נדרש להגדיר מיקום</h3><p>לא נשתמש בירושלים כברירת מחדל. כך זמני היום יהיו מדויקים לבית הכנסת.</p></div> },
  ];

  return (
    <main className="display-shell" style={style}>
      <header className="display-header">
        <div className="header-date"><span>היום</span><strong>{new Intl.DateTimeFormat("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jerusalem" }).format(now)}</strong></div>
        <div className="synagogue-title"><span>בית הכנסת</span><h1>{data.synagogue.name}</h1></div>
        <time className="header-clock" dir="ltr">{now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Jerusalem" })}</time>
      </header>
      <nav className="mobile-tabs" aria-label="חלקי התצוגה">{panels.map((panel, index) => <button type="button" key={panel.short} aria-pressed={activePanel === index} onClick={() => setActivePanel(index)}>{panel.short}</button>)}</nav>
      <div className="display-grid">{panels.map((panel, index) => <div className={activePanel === index ? "mobile-active" : ""} key={panel.title}><Panel icon={panel.icon} title={panel.title}>{panel.body}</Panel></div>)}</div>
      <footer className="display-footer"><div>{[data.settings.custom_message, data.settings.secondary_message].filter(Boolean).join("  •  ") || "ברוכים הבאים לבית הכנסת מזמור לדוד"}</div><span>ShulSign</span></footer>
    </main>
  );
}
