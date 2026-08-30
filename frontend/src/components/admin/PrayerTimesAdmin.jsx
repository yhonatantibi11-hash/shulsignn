import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useSynagogueId from '@/hooks/useSynagogueId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, GripVertical, Download } from 'lucide-react';
import { toast } from 'sonner';

const DAY_OPTIONS = [
  { value: 'everyday', label: 'כל יום' },
  { value: 'weekdays', label: 'ימי חול' },
  { value: 'sunday', label: 'ראשון' },
  { value: 'monday', label: 'שני' },
  { value: 'tuesday', label: 'שלישי' },
  { value: 'wednesday', label: 'רביעי' },
  { value: 'thursday', label: 'חמישי' },
  { value: 'friday', label: 'שישי' },
  { value: 'saturday', label: 'שבת' },
];

function getDaysLabel(days) {
  if (!days || days.length === 0) return 'כל יום';
  if (days.includes('everyday')) return 'כל יום';
  if (days.includes('weekdays') && days.length === 1) return 'ימי חול';
  return days.map(d => DAY_OPTIONS.find(o => o.value === d)?.label || d).join(', ');
}

const emptyPrayer = { name: '', time: '', notes: '', days: ['everyday'], is_active: true, sort_order: 0 };

function exportToCSV(data, filename) {
  const headers = ['שם', 'שעה', 'ימים', 'הערות', 'פעיל'];
  const rows = data.map(p => [
    p.name,
    p.time,
    getDaysLabel(p.days || []),
    p.notes || '',
    p.is_active !== false ? 'כן' : 'לא',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function PrayerTimesAdmin() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState(null);
  const [form, setForm] = useState(emptyPrayer);
  const queryClient = useQueryClient();
  const synagogueId = useSynagogueId();

  const { data: prayers = [], isLoading } = useQuery({
    queryKey: ['prayerTimes', synagogueId],
    queryFn: () => synagogueId ? base44.entities.PrayerTime.filter({ synagogue_id: synagogueId }) : [],
    enabled: !!synagogueId,
  });

  const sorted = [...prayers].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PrayerTime.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerTimes', synagogueId] });
      closeDialog();
      toast.success('תפילה נוספה בהצלחה');
    },
    onError: () => toast.error('התפילה לא נשמרה. נסה שוב'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PrayerTime.update(id, data),
    onMutate: async ({ id, data }) => {
      const queryKey = ['prayerTimes', synagogueId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (current = []) =>
        current.map((prayer) => prayer.id === id ? { ...prayer, ...data } : prayer)
      );
      return { previous, queryKey };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerTimes', synagogueId] });
      closeDialog();
      toast.success('תפילה עודכנה בהצלחה');
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(context.queryKey, context.previous);
      toast.error('השינוי לא נשמר. נסה שוב');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PrayerTime.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerTimes', synagogueId] });
      toast.success('תפילה נמחקה');
    },
  });

  const openCreate = () => {
    setEditingPrayer(null);
    setForm({ ...emptyPrayer, sort_order: prayers.length });
    setDialogOpen(true);
  };

  const openEdit = (prayer) => {
    setEditingPrayer(prayer);
    setForm({
      name: prayer.name || '',
      time: prayer.time || '',
      notes: prayer.notes || '',
      days: prayer.days || (prayer.day_of_week ? [prayer.day_of_week] : ['everyday']),
      is_active: prayer.is_active !== false,
      sort_order: prayer.sort_order || 0,
    });
    setDialogOpen(true);
  };

  const toggleDay = (dayValue) => {
    const current = form.days || [];
    if (dayValue === 'everyday') {
      setForm({ ...form, days: ['everyday'] });
      return;
    }
    // Remove 'everyday' when selecting specific days
    let next = current.filter(d => d !== 'everyday');
    if (next.includes(dayValue)) {
      next = next.filter(d => d !== dayValue);
    } else {
      next = [...next, dayValue];
    }
    if (next.length === 0) next = ['everyday'];
    setForm({ ...form, days: next });
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPrayer(null);
    setForm(emptyPrayer);
  };

  const handleSave = () => {
    if (!form.name || !form.time) {
      toast.error('נא למלא שם ושעה');
      return;
    }
    if (editingPrayer) {
      updateMutation.mutate({ id: editingPrayer.id, data: form });
    } else {
      createMutation.mutate({ ...form, synagogue_id: synagogueId });
    }
  };

  const toggleActive = (prayer) => {
    updateMutation.mutate({ id: prayer.id, data: { is_active: !prayer.is_active } });
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heebo font-bold text-foreground">זמני תפילות</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-heebo" onClick={() => exportToCSV(sorted, 'זמני-תפילות.csv')}>
            <Download className="w-4 h-4 ml-1" /> ייצוא Excel
          </Button>
          <Button onClick={openCreate} size="sm" className="font-heebo">
            <Plus className="w-4 h-4 ml-1" /> הוסף תפילה
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((prayer) => (
            <Card key={prayer.id} className="p-3">
              <div className="flex items-center gap-3" dir="ltr">
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(prayer.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(prayer)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Switch
                  checked={prayer.is_active !== false}
                  onCheckedChange={() => toggleActive(prayer)}
                  disabled={updateMutation.isPending}
                />
                <span className="font-heebo font-bold text-primary tabular-nums w-14 text-center">
                  {prayer.time}
                </span>
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-muted-foreground font-heebo">
                      {getDaysLabel(prayer.days || (prayer.day_of_week ? [prayer.day_of_week] : []))}
                    </span>
                    <span className="font-heebo font-bold text-foreground">{prayer.name}</span>
                  </div>
                  {prayer.notes && (
                    <p className="text-xs text-muted-foreground font-heebo truncate text-right">{prayer.notes}</p>
                  )}
                </div>
                <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Card>
          ))}
          {sorted.length === 0 && (
            <p className="text-center text-muted-foreground py-10 font-heebo">
              אין זמני תפילות. לחץ על "הוסף תפילה" להוספה.
            </p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="font-heebo">
          <DialogHeader>
            <DialogTitle className="font-heebo">
              {editingPrayer ? 'ערוך תפילה' : 'הוסף תפילה'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-heebo">שם התפילה</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="למשל: שחרית, מנחה, ערבית"
                className="font-heebo"
              />
            </div>
            <div>
              <Label className="font-heebo">שעה</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                dir="ltr"
              />
            </div>
            <div>
              <Label className="font-heebo mb-2 block">ימים</Label>
              <div className="grid grid-cols-3 gap-2">
                {DAY_OPTIONS.map(opt => {
                  const selected = (form.days || []).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleDay(opt.value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-heebo transition-colors text-center ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="font-heebo">הערות</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="הערות נוספות"
                className="font-heebo"
              />
            </div>
            <div>
              <Label className="font-heebo">סדר תצוגה</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="font-heebo">ביטול</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="font-heebo">
              {createMutation.isPending || updateMutation.isPending ? 'שומר...' : editingPrayer ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
