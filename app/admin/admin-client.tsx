"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, Clock3, ExternalLink, LogOut, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type Item = Record<string, unknown> & { id: string };
type AdminData = { synagogue: Record<string, unknown>; settings: Record<string, unknown>; prayers: Item[]; lessons: Item[]; events: Item[]; role: string };
const DAYS = [{ id: "weekdays", label: "ימי חול" }, { id: "friday", label: "יום שישי" }, { id: "saturday", label: "שבת" }];

async function api(body: Record<string, unknown>) {
  const response = await fetch("/api/admin/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error("save_failed");
  return response.json();
}

function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "ההתחברות נכשלה"); setBusy(false); return; }
    window.location.assign("/app/index.html#/admin");
  }
  return <main className="admin-login"><form onSubmit={submit}><span>ShulSign</span><h1>כניסה לניהול</h1><p>התחבר עם המשתמש שיצרת ב־Supabase.</p><label>כתובת מייל<Input name="email" type="email" required autoComplete="email" /></label><label>סיסמה<Input name="password" type="password" required autoComplete="current-password" /></label>{error && <div className="form-error">{error}</div>}<Button type="submit" disabled={busy}>{busy ? "מתחבר…" : "כניסה למערכת"}</Button><Link href="/display/mizmor-ledavid">חזרה למסך התצוגה</Link></form></main>;
}

function DeleteButton({ resource, id, onDone }: { resource: string; id: string; onDone: () => void }) {
  async function remove() { try { await api({ resource, action: "delete", id }); toast.success("הפריט נמחק"); onDone(); } catch { toast.error("לא הצלחנו למחוק את הפריט"); } }
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="מחיקה"><Trash2 /></Button></AlertDialogTrigger><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>למחוק את הפריט?</AlertDialogTitle><AlertDialogDescription>הפעולה תשפיע מיד על התצוגה החדשה. אתר Base44 לא יושפע.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ביטול</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={remove}>מחיקה</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function DaysPicker({ value, onChange }: { value: string[]; onChange: (days: string[]) => void }) {
  return <div className="days-picker">{DAYS.map((day) => <label key={day.id}><input type="checkbox" checked={value.includes(day.id)} onChange={(event) => onChange(event.target.checked ? [...value, day.id] : value.filter((item) => item !== day.id))} />{day.label}</label>)}</div>;
}

function PrayerManager({ items, reload }: { items: Item[]; reload: () => void }) {
  const empty = { name: "", prayer_time: "", notes: "", days: ["weekdays"], sort_order: 0 };
  const [draft, setDraft] = useState<Record<string, unknown>>(empty);
  const editingId = draft.id as string | undefined;
  async function save(event: FormEvent) { event.preventDefault(); try { await api({ resource: "prayers", action: editingId ? "update" : "create", id: editingId, values: { name: draft.name, prayer_time: draft.prayer_time, notes: draft.notes || null, days: draft.days, sort_order: Number(draft.sort_order) || 0, is_active: true } }); toast.success("זמן התפילה נשמר"); setDraft(empty); reload(); } catch { toast.error("לא הצלחנו לשמור"); } }
  return <ManagerLayout title={editingId ? "עריכת תפילה" : "הוספת תפילה"} form={<form className="admin-form" onSubmit={save}><label>שם התפילה<Input required value={String(draft.name)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>שעה<Input required type="time" value={String(draft.prayer_time)} onChange={(e) => setDraft({ ...draft, prayer_time: e.target.value })} /></label><label>הערה<Input value={String(draft.notes || "")} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></label><DaysPicker value={draft.days as string[]} onChange={(days) => setDraft({ ...draft, days })} /><div className="form-actions"><Button type="submit"><Plus />{editingId ? "שמירת שינויים" : "הוספה"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => setDraft(empty)}>ביטול</Button>}</div></form>} list={items.map((item) => <AdminRow key={item.id} title={String(item.name)} meta={`${String(item.prayer_time).slice(0,5)} · ${(item.days as string[]).map((d) => DAYS.find((x) => x.id === d)?.label || d).join(", ")}`} onEdit={() => setDraft({ ...item, prayer_time: String(item.prayer_time).slice(0,5), days: item.days || [] })} remove={<DeleteButton resource="prayers" id={item.id} onDone={reload} />} />)} />;
}

function LessonManager({ items, reload }: { items: Item[]; reload: () => void }) {
  const empty = { title: "", speaker: "", lesson_time: "", location: "", days: ["saturday"] };
  const [draft, setDraft] = useState<Record<string, unknown>>(empty); const editingId = draft.id as string | undefined;
  async function save(event: FormEvent) { event.preventDefault(); try { await api({ resource: "lessons", action: editingId ? "update" : "create", id: editingId, values: { title: draft.title, speaker: draft.speaker, schedule_type: "weekly", lesson_time: draft.lesson_time || null, location: draft.location || null, days: draft.days, is_active: true } }); toast.success("השיעור נשמר"); setDraft(empty); reload(); } catch { toast.error("לא הצלחנו לשמור"); } }
  return <ManagerLayout title={editingId ? "עריכת שיעור" : "הוספת שיעור"} form={<form className="admin-form" onSubmit={save}><label>שם השיעור<Input required value={String(draft.title)} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label>שם הרב/המרצה<Input required value={String(draft.speaker)} onChange={(e) => setDraft({ ...draft, speaker: e.target.value })} /></label><label>שעה<Input type="time" value={String(draft.lesson_time || "")} onChange={(e) => setDraft({ ...draft, lesson_time: e.target.value })} /></label><label>מיקום<Input value={String(draft.location || "")} onChange={(e) => setDraft({ ...draft, location: e.target.value })} /></label><DaysPicker value={draft.days as string[]} onChange={(days) => setDraft({ ...draft, days })} /><div className="form-actions"><Button type="submit"><Plus />{editingId ? "שמירת שינויים" : "הוספה"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => setDraft(empty)}>ביטול</Button>}</div></form>} list={items.map((item) => <AdminRow key={item.id} title={String(item.title)} meta={`${String(item.speaker)} · ${item.lesson_time ? String(item.lesson_time).slice(0,5) : "ללא שעה"}`} onEdit={() => setDraft({ ...item, lesson_time: item.lesson_time ? String(item.lesson_time).slice(0,5) : "", days: item.days || [] })} remove={<DeleteButton resource="lessons" id={item.id} onDone={reload} />} />)} />;
}

function EventManager({ items, reload }: { items: Item[]; reload: () => void }) {
  const empty = { name: "", event_date: "", event_time: "", description: "" };
  const [draft, setDraft] = useState<Record<string, unknown>>(empty); const editingId = draft.id as string | undefined;
  async function save(event: FormEvent) { event.preventDefault(); try { await api({ resource: "events", action: editingId ? "update" : "create", id: editingId, values: { name: draft.name, event_date: draft.event_date, event_time: draft.event_time || null, description: draft.description || null } }); toast.success("האירוע נשמר"); setDraft(empty); reload(); } catch { toast.error("לא הצלחנו לשמור"); } }
  return <ManagerLayout title={editingId ? "עריכת אירוע" : "הוספת אירוע"} form={<form className="admin-form" onSubmit={save}><label>שם האירוע<Input required value={String(draft.name)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>תאריך<Input required type="date" value={String(draft.event_date)} onChange={(e) => setDraft({ ...draft, event_date: e.target.value })} /></label><label>שעה<Input type="time" value={String(draft.event_time || "")} onChange={(e) => setDraft({ ...draft, event_time: e.target.value })} /></label><label className="wide">תיאור<Input value={String(draft.description || "")} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label><div className="form-actions"><Button type="submit"><Plus />{editingId ? "שמירת שינויים" : "הוספה"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => setDraft(empty)}>ביטול</Button>}</div></form>} list={items.map((item) => <AdminRow key={item.id} title={String(item.name)} meta={`${String(item.event_date)}${item.event_time ? ` · ${String(item.event_time).slice(0,5)}` : ""}`} onEdit={() => setDraft({ ...item, event_time: item.event_time ? String(item.event_time).slice(0,5) : "" })} remove={<DeleteButton resource="events" id={item.id} onDone={reload} />} />)} />;
}

function SettingsManager({ data, reload }: { data: AdminData; reload: () => void }) {
  const [draft, setDraft] = useState({ custom_message: String(data.settings.custom_message || ""), secondary_message: String(data.settings.secondary_message || ""), city: String(data.synagogue.city || ""), latitude: String(data.synagogue.latitude || ""), longitude: String(data.synagogue.longitude || "") });
  async function save(event: FormEvent) { event.preventDefault(); try { await api({ resource: "settings", action: "update", values: { custom_message: draft.custom_message || null, secondary_message: draft.secondary_message || null } }); await api({ resource: "synagogue", action: "update", values: { city: draft.city || null, latitude: draft.latitude ? Number(draft.latitude) : null, longitude: draft.longitude ? Number(draft.longitude) : null } }); toast.success("ההגדרות נשמרו"); reload(); } catch { toast.error("לא הצלחנו לשמור את ההגדרות"); } }
  return <section className="settings-card"><h2>הודעות ומיקום</h2><p>המיקום ישמש לחישוב מדויק של זמני היום והשבת.</p><form className="admin-form" onSubmit={save}><label className="wide">הודעה ראשית<Input value={draft.custom_message} onChange={(e) => setDraft({ ...draft, custom_message: e.target.value })} /></label><label className="wide">הודעה נוספת<Input value={draft.secondary_message} onChange={(e) => setDraft({ ...draft, secondary_message: e.target.value })} /></label><label>עיר<Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label><label>קו רוחב<Input inputMode="decimal" value={draft.latitude} onChange={(e) => setDraft({ ...draft, latitude: e.target.value })} placeholder="31.7683" /></label><label>קו אורך<Input inputMode="decimal" value={draft.longitude} onChange={(e) => setDraft({ ...draft, longitude: e.target.value })} placeholder="35.2137" /></label><div className="form-actions"><Button type="submit">שמירת הגדרות</Button></div></form></section>;
}

function ManagerLayout({ title, form, list }: { title: string; form: ReactNode; list: ReactNode[] }) { return <div className="manager-grid"><section className="editor-card"><h2>{title}</h2>{form}</section><section className="items-card"><div className="items-heading"><h2>פריטים קיימים</h2><span>{list.length}</span></div><div className="items-list">{list.length ? list : <p className="admin-empty">אין פריטים עדיין</p>}</div></section></div>; }
function AdminRow({ title, meta, onEdit, remove }: { title: string; meta: string; onEdit: () => void; remove: ReactNode }) { return <article className="admin-row"><div><strong>{title}</strong><span>{meta}</span></div><div><Button variant="ghost" size="icon" onClick={onEdit} aria-label="עריכה"><Pencil /></Button>{remove}</div></article>; }

export default function AdminClient({ authenticated }: { authenticated: boolean }) {
  const [data, setData] = useState<AdminData | null>(null); const [loading, setLoading] = useState(authenticated); const [loadError, setLoadError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/data");
    if (response.status === 401) {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
      return;
    }
    if (!response.ok) {
      setLoadError("לא הצלחנו לטעון את נתוני בית הכנסת. אפשר לנסות שוב.");
      setLoading(false);
      return;
    }
    setData(await response.json()); setLoading(false);
  }, []);
  useEffect(() => {
    if (!authenticated) return;
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, load]);
  if (!authenticated) return <Login />;
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); }
  if (loading) return <main className="admin-loading">טוען את מערכת הניהול…</main>;
  if (loadError || !data) return <main className="admin-loading"><section className="admin-load-error"><h1>הטעינה נכשלה</h1><p>{loadError || "לא התקבלו נתונים."}</p><div><Button onClick={() => { setLoadError(""); setLoading(true); void load(); }}>ניסיון נוסף</Button><Button variant="outline" onClick={logout}>יציאה וכניסה מחדש</Button></div></section></main>;
  return <main className="admin-shell"><Toaster position="top-center" richColors /><header className="admin-header"><div><span>ShulSign</span><h1>{String(data.synagogue.name || "מזמור לדוד")}</h1><p>ניהול בית הכנסת · הרשאה: {data.role}</p></div><div><Button variant="outline" asChild><Link href="/display/mizmor-ledavid" target="_blank"><ExternalLink />פתיחת התצוגה</Link></Button><Button variant="ghost" onClick={logout}><LogOut />יציאה</Button></div></header><Tabs defaultValue="prayers" dir="rtl"><TabsList className="admin-tabs"><TabsTrigger value="prayers"><Clock3 />תפילות</TabsTrigger><TabsTrigger value="lessons"><BookOpen />שיעורים</TabsTrigger><TabsTrigger value="events"><CalendarDays />אירועים</TabsTrigger><TabsTrigger value="settings"><Settings />הגדרות</TabsTrigger></TabsList><TabsContent value="prayers"><PrayerManager items={data.prayers} reload={load} /></TabsContent><TabsContent value="lessons"><LessonManager items={data.lessons} reload={load} /></TabsContent><TabsContent value="events"><EventManager items={data.events} reload={load} /></TabsContent><TabsContent value="settings"><SettingsManager data={data} reload={load} /></TabsContent></Tabs></main>;
}
