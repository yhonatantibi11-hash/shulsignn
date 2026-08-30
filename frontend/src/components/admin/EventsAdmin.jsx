import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useSynagogueId from '@/hooks/useSynagogueId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import ImageUpload from '@/components/admin/ImageUpload';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const emptyEvent = { name: '', date: '', time: '', description: '', image_url: '' };

export default function EventsAdmin() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyEvent);
  const queryClient = useQueryClient();
  const synagogueId = useSynagogueId();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', synagogueId],
    queryFn: () => synagogueId ? base44.entities.Event.filter({ synagogue_id: synagogueId }) : [],
    enabled: !!synagogueId,
  });

  const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', synagogueId] });
      closeDialog();
      toast.success('אירוע נוסף בהצלחה');
    },
    onError: () => toast.error('האירוע לא נשמר. נסה שוב'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', synagogueId] });
      closeDialog();
      toast.success('אירוע עודכן');
    },
    onError: () => toast.error('השינוי לא נשמר. נסה שוב'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', synagogueId] });
      toast.success('אירוע נמחק');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyEvent);
    setDialogOpen(true);
  };

  const openEdit = (event) => {
    setEditing(event);
    setForm({
      name: event.name || '',
      date: event.date || '',
      time: event.time || '',
      description: event.description || '',
      image_url: event.image_url || '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSave = () => {
    if (!form.name || !form.date) {
      toast.error('נא למלא שם ותאריך');
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate({ ...form, synagogue_id: synagogueId });
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = (date) => new Date(date) < today;

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heebo font-bold text-foreground">אירועים</h2>
        <Button onClick={openCreate} size="sm" className="font-heebo">
          <Plus className="w-4 h-4 ml-1" />
          הוסף אירוע
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((event) => (
            <Card key={event.id} className={`p-3 ${isPast(event.date) ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heebo font-bold text-foreground">{event.name}</span>
                    {isPast(event.date) && (
                      <Badge variant="secondary" className="text-xs font-heebo">עבר</Badge>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground font-heebo truncate">{event.description}</p>
                  )}
                </div>
                <div className="text-left shrink-0">
                  {event.time && (
                    <span className="font-heebo font-bold text-primary tabular-nums" dir="ltr">{event.time}</span>
                  )}
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {format(new Date(event.date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(event)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(event.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
          {sorted.length === 0 && (
            <p className="text-center text-muted-foreground py-10 font-heebo">
              אין אירועים. לחץ על "הוסף אירוע" להוספה.
            </p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="font-heebo">
          <DialogHeader>
            <DialogTitle className="font-heebo">{editing ? 'ערוך אירוע' : 'הוסף אירוע'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-heebo">שם האירוע</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="font-heebo" />
            </div>
            <div>
              <Label className="font-heebo">תאריך</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} dir="ltr" />
            </div>
            <div>
              <Label className="font-heebo">שעה</Label>
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} dir="ltr" />
            </div>
            <div>
              <Label className="font-heebo">תיאור</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="font-heebo" />
            </div>
            <div>
              <Label className="font-heebo">תמונה / פוסטר</Label>
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="font-heebo">ביטול</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="font-heebo">
              {createMutation.isPending || updateMutation.isPending ? 'שומר...' : editing ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
