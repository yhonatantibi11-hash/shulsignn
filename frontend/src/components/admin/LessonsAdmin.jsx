import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useSynagogueId from '@/hooks/useSynagogueId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Calendar, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ImageUpload from '@/components/admin/ImageUpload';

const DAYS_OF_WEEK = [
  { id: 'sunday', label: 'א׳' },
  { id: 'monday', label: 'ב׳' },
  { id: 'tuesday', label: 'ג׳' },
  { id: 'wednesday', label: 'ד׳' },
  { id: 'thursday', label: 'ה׳' },
  { id: 'friday', label: 'ו׳' },
  { id: 'saturday', label: 'ש׳' },
];

const DAY_LABELS = {
  sunday: 'ראשון', monday: 'שני', tuesday: 'שלישי',
  wednesday: 'רביעי', thursday: 'חמישי', friday: 'שישי', saturday: 'שבת',
};

const emptyLesson = {
  title: '', speaker: '', schedule_type: 'weekly', days: [], day: '',
  one_time_date: '', time: '', location: '', image_url: '', is_active: true,
};

function getDayDisplay(lesson) {
  if (lesson.schedule_type === 'one_time') {
    return lesson.one_time_date ? `חד פעמי — ${format(new Date(lesson.one_time_date), 'dd/MM/yyyy')}` : 'חד פעמי';
  }
  const days = lesson.days?.length > 0 ? lesson.days : (lesson.day ? [lesson.day] : []);
  if (days.length === 0) return lesson.day || '';
  return days.map(d => DAY_LABELS[d] || d).join(', ');
}

function exportToCSV(data, filename) {
  const headers = ['כותרת', 'מרצה', 'שעה', 'סוג', 'ימים / תאריך', 'מיקום', 'פעיל'];
  const rows = data.map(l => [
    l.title,
    l.speaker,
    l.time,
    l.schedule_type === 'one_time' ? 'חד פעמי' : 'שבועי',
    getDayDisplay(l),
    l.location || '',
    l.is_active !== false ? 'כן' : 'לא',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LessonsAdmin() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyLesson);
  const queryClient = useQueryClient();
  const synagogueId = useSynagogueId();

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', synagogueId],
    queryFn: () => synagogueId ? base44.entities.TorahLesson.filter({ synagogue_id: synagogueId }) : [],
    enabled: !!synagogueId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TorahLesson.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons', synagogueId] }); closeDialog(); toast.success('שיעור נוסף בהצלחה'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TorahLesson.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons', synagogueId] }); closeDialog(); toast.success('שיעור עודכן'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TorahLesson.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lessons', synagogueId] }); toast.success('שיעור נמחק'); },
  });

  const openCreate = () => { setEditing(null); setForm(emptyLesson); setDialogOpen(true); };

  const openEdit = (lesson) => {
    setEditing(lesson);
    setForm({
      title: lesson.title || '',
      speaker: lesson.speaker || '',
      schedule_type: lesson.schedule_type || 'weekly',
      days: lesson.days || [],
      day: lesson.day || '',
      one_time_date: lesson.one_time_date || '',
      time: lesson.time || '',
      location: lesson.location || '',
      image_url: lesson.image_url || '',
      is_active: lesson.is_active !== false,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const toggleDay = (dayId) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(dayId) ? f.days.filter(d => d !== dayId) : [...f.days, dayId],
    }));
  };

  const handleSave = () => {
    if (!form.title || !form.speaker) {
      toast.error('נא למלא כותרת ומרצה');
      return;
    }
    if (form.schedule_type === 'one_time' && !form.one_time_date) {
      toast.error('נא לבחור תאריך לשיעור החד פעמי');
      return;
    }
    if (form.schedule_type === 'weekly' && form.days.length === 0) {
      toast.error('נא לבחור לפחות יום אחד');
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate({ ...form, synagogue_id: synagogueId });
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heebo font-bold text-foreground">שיעורי תורה</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-heebo" onClick={() => exportToCSV(lessons, 'שיעורי-תורה.csv')}>
            <Download className="w-4 h-4 ml-1" /> ייצוא Excel
          </Button>
          <Button onClick={openCreate} size="sm" className="font-heebo">
            <Plus className="w-4 h-4 ml-1" /> הוסף שיעור
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="p-3">
              <div className="flex items-center gap-3" dir="ltr">
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(lesson.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(lesson)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Switch
                  checked={lesson.is_active !== false}
                  onCheckedChange={() => updateMutation.mutate({ id: lesson.id, data: { is_active: !(lesson.is_active !== false) } })}
                />
                <span className="font-heebo font-bold text-primary tabular-nums w-14 text-center">{lesson.time}</span>
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="font-heebo font-bold text-foreground">{lesson.title}</span>
                    {lesson.schedule_type === 'one_time' ? (
                      <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded-full font-heebo">
                        <Calendar className="w-3 h-3" /> חד פעמי
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-heebo">
                        <RefreshCw className="w-3 h-3" /> שבועי
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground font-heebo">
                    <span>{lesson.speaker}</span>
                    <span>·</span>
                    <span>{getDayDisplay(lesson)}</span>
                    {lesson.location && <><span>·</span><span>{lesson.location}</span></>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {lessons.length === 0 && (
            <p className="text-center text-muted-foreground py-10 font-heebo">
              אין שיעורים. לחץ על "הוסף שיעור" להוספה.
            </p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="font-heebo">
          <DialogHeader>
            <DialogTitle className="font-heebo">{editing ? 'ערוך שיעור' : 'הוסף שיעור'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-heebo">כותרת השיעור</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="font-heebo mt-1" />
            </div>
            <div>
              <Label className="font-heebo">מרצה / רב</Label>
              <Input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} className="font-heebo mt-1" />
            </div>

            {/* Schedule type toggle */}
            <div>
              <Label className="font-heebo">סוג שיעור</Label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, schedule_type: 'weekly' }))}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-2.5 font-heebo text-sm transition-colors ${form.schedule_type === 'weekly' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}
                >
                  <RefreshCw className="w-4 h-4" /> שבועי
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, schedule_type: 'one_time' }))}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-2.5 font-heebo text-sm transition-colors ${form.schedule_type === 'one_time' ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}
                >
                  <Calendar className="w-4 h-4" /> חד פעמי
                </button>
              </div>
            </div>

            {/* Weekly: days selector */}
            {form.schedule_type === 'weekly' && (
              <div>
                <Label className="font-heebo">ימי השיעור</Label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {DAYS_OF_WEEK.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDay(d.id)}
                      className={`w-10 h-10 rounded-lg border-2 font-heebo font-bold text-sm transition-colors ${form.days.includes(d.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* One-time: date picker */}
            {form.schedule_type === 'one_time' && (
              <div>
                <Label className="font-heebo">תאריך השיעור</Label>
                <Input
                  type="date"
                  value={form.one_time_date}
                  onChange={(e) => setForm({ ...form, one_time_date: e.target.value })}
                  className="mt-1"
                  dir="ltr"
                />
              </div>
            )}

            <div>
              <Label className="font-heebo">שעה</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} dir="ltr" className="mt-1" />
            </div>
            <div>
              <Label className="font-heebo">מיקום</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="אולם ראשי / חדר לימוד" className="font-heebo mt-1" />
            </div>
            <div>
              <Label className="font-heebo">תמונה / פוסטר</Label>
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="font-heebo">ביטול</Button>
            <Button onClick={handleSave} className="font-heebo">{editing ? 'עדכן' : 'הוסף'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}