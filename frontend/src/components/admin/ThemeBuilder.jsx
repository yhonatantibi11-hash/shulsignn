import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, X, Plus, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';

const WIDGET_LABELS = {
  prayers: 'זמני תפילות',
  lessons: 'שיעורי תורה',
  events: 'אירועים',
  zmanim: 'זמנים הלכתיים',
};

const DEFAULT_THEME = {
  name: '',
  bg_type: 'color',
  bg_value: '#0d0d1a',
  color_primary: '#d4a017',
  color_card_bg: '#1a1a2e',
  color_text: '#f0e6d3',
  color_text_muted: '#8a7a60',
  color_border: '#2a2a4a',
  widget_order: ['prayers', 'lessons', 'events', 'zmanim'],
  widget_visible: ['prayers', 'lessons', 'events', 'zmanim'],
};

function ColorField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value || '#000000'}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
      />
      <div className="flex-1">
        <Label className="font-heebo text-xs text-muted-foreground">{label}</Label>
        <Input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="font-mono text-sm h-8"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export default function ThemeBuilder({ open, onClose, editTheme, onSelectTheme, synagogueId }) {
  const [form, setForm] = useState(DEFAULT_THEME);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('bg_type', 'image_url');
      set('bg_value', file_url);
    } catch (e) {
      toast.error('העלאת התמונה נכשלה');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (editTheme) {
      setForm({ ...DEFAULT_THEME, ...editTheme });
    } else {
      setForm(DEFAULT_THEME);
    }
  }, [editTheme, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editTheme?.id) {
        return base44.entities.DisplayTheme.update(editTheme.id, data);
      }
      return base44.entities.DisplayTheme.create({ ...data, synagogue_id: synagogueId });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['display-themes', synagogueId] });
      toast.success('התמה נשמרה בהצלחה');
      if (onSelectTheme) onSelectTheme(`custom:${saved.id}`);
      onClose();
    },
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const moveWidget = (idx, dir) => {
    const order = [...form.widget_order];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= order.length) return;
    [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
    set('widget_order', order);
  };

  const toggleWidget = (w) => {
    const vis = form.widget_visible.includes(w)
      ? form.widget_visible.filter(x => x !== w)
      : [...form.widget_visible, w];
    set('widget_visible', vis);
  };

  // Mini live preview style
  const previewStyle = {
    background: form.bg_type === 'image_url' && form.bg_value
      ? `url(${form.bg_value}) center/cover`
      : form.bg_value || '#0d0d1a',
    border: `2px solid ${form.color_border || '#333'}`,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-heebo" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-heebo text-xl">
            {editTheme ? 'עריכת תמה' : 'צור תמה חדשה'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="background">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            <TabsTrigger value="background" className="font-heebo">רקע</TabsTrigger>
            <TabsTrigger value="colors" className="font-heebo">צבעים</TabsTrigger>
            <TabsTrigger value="layout" className="font-heebo">ווידג'טים</TabsTrigger>
          </TabsList>

          {/* Background tab */}
          <TabsContent value="background" className="space-y-4">
            <div>
              <Label className="font-heebo">שם התמה</Label>
              <Input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="למשל: תמת ירושלים"
                className="font-heebo"
              />
            </div>
            <div>
              <Label className="font-heebo mb-2 block">סוג רקע</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => set('bg_type', 'color')}
                  className={`flex-1 rounded-lg border-2 p-3 font-heebo text-sm transition-colors ${form.bg_type === 'color' ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  צבע אחיד
                </button>
                <button
                  type="button"
                  onClick={() => set('bg_type', 'image_url')}
                  className={`flex-1 rounded-lg border-2 p-3 font-heebo text-sm transition-colors ${form.bg_type === 'image_url' ? 'border-primary bg-primary/10' : 'border-border'}`}
                >
                  תמונת רקע
                </button>
              </div>
            </div>

            {form.bg_type === 'color' ? (
              <ColorField label="צבע רקע" value={form.bg_value} onChange={v => set('bg_value', v)} />
            ) : (
              <div className="space-y-3">
                {/* Upload from device */}
                <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${uploading ? 'opacity-50 pointer-events-none' : 'border-border hover:border-primary hover:bg-primary/5'}`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageUpload(e.target.files?.[0])}
                  />
                  {uploading ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  )}
                  <span className="font-heebo text-sm text-muted-foreground">
                    {uploading ? 'מעלה תמונה...' : 'לחץ להעלאת תמונה מהמכשיר'}
                  </span>
                </label>

                {/* Current image preview */}
                {form.bg_value && (
                  <div className="relative rounded-lg overflow-hidden h-20">
                    <img src={form.bg_value} alt="רקע" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set('bg_value', '')}
                      className="absolute top-1 left-1 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* URL fallback */}
                <div>
                  <Label className="font-heebo text-xs text-muted-foreground">או הזן כתובת URL ישירות</Label>
                  <Input
                    value={form.bg_value || ''}
                    onChange={e => set('bg_value', e.target.value)}
                    placeholder="https://..."
                    className="font-mono text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* Mini preview */}
            <div>
              <Label className="font-heebo text-sm text-muted-foreground mb-2 block">תצוגה מקדימה</Label>
              <div className="rounded-xl overflow-hidden relative" style={{ ...previewStyle, height: 120 }}>
                {form.bg_type === 'image_url' && <div className="absolute inset-0 bg-black/50" />}
                <div className="relative z-10 p-3 flex flex-col gap-1">
                  <div className="h-4 rounded" style={{ background: form.color_primary, width: '40%', opacity: 0.9 }} />
                  <div className="h-3 rounded bg-white/10" style={{ width: '70%' }} />
                  <div className="h-3 rounded bg-white/10" style={{ width: '55%' }} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Colors tab */}
          <TabsContent value="colors" className="space-y-4">
            <ColorField label="צבע ראשי (כותרות, הדגשות)" value={form.color_primary} onChange={v => set('color_primary', v)} />
            <ColorField label="רקע כרטיסיות" value={form.color_card_bg} onChange={v => set('color_card_bg', v)} />
            <ColorField label="צבע טקסט ראשי" value={form.color_text} onChange={v => set('color_text', v)} />
            <ColorField label="צבע טקסט משני" value={form.color_text_muted} onChange={v => set('color_text_muted', v)} />
            <ColorField label="צבע מסגרות" value={form.color_border} onChange={v => set('color_border', v)} />

            {/* Color preview strip */}
            <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: form.bg_value || '#0d0d1a', border: `1px solid ${form.color_border}` }}>
              <span style={{ color: form.color_primary, fontWeight: 700 }} className="font-heebo text-base">שחרית — 06:30</span>
              <span style={{ color: form.color_text }} className="font-heebo text-sm">מנחה — 18:00</span>
              <span style={{ color: form.color_text_muted }} className="font-heebo text-xs">ערבית — 20:15</span>
              <div className="h-px mt-1" style={{ background: form.color_border }} />
              <span style={{ color: form.color_text_muted, fontSize: 11 }}>דוגמת טקסט משני</span>
            </div>
          </TabsContent>

          {/* Layout tab */}
          <TabsContent value="layout" className="space-y-3">
            <p className="font-heebo text-sm text-muted-foreground">גרור (חצים) לשינוי סדר, לחץ על העין להסתיר/הציג</p>
            <div className="space-y-2">
              {form.widget_order.map((w, idx) => {
                const visible = form.widget_visible.includes(w);
                return (
                  <div
                    key={w}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${visible ? 'bg-card border-border' : 'opacity-50 bg-muted border-border/50'}`}
                  >
                    <span className="flex-1 font-heebo font-medium">{WIDGET_LABELS[w]}</span>
                    <button onClick={() => toggleWidget(w)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => moveWidget(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveWidget(idx, 1)} disabled={idx === form.widget_order.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => saveMutation.mutate(form)}
            disabled={!form.name || saveMutation.isPending}
            className="flex-1 font-heebo"
          >
            <Save className="w-4 h-4 ml-1" />
            {saveMutation.isPending ? 'שומר...' : 'שמור תמה'}
          </Button>
          <Button variant="outline" onClick={onClose} className="font-heebo">
            <X className="w-4 h-4 ml-1" /> ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}