import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useSynagogueId from '@/hooks/useSynagogueId';
import { ZMANIM_CONFIG, DEFAULT_ZMANIM_KEYS } from '@/hooks/useZmanim';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import ThemeBuilder from './ThemeBuilder';

const SYSTEM_THEMES = [
  { id: 'dark', label: 'כהה (ברירת מחדל)', bg: '#0d0d1a', primary: '#d4a017' },
  { id: 'light', label: 'בהיר', bg: '#fdf8f0', primary: '#8a6520' },
];

export default function SettingsAdmin() {
  const queryClient = useQueryClient();
  const [themeBuilderOpen, setThemeBuilderOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const synagogueId = useSynagogueId();

  const { data: settingsList = [] } = useQuery({
    queryKey: ['synagogue-settings', synagogueId],
    queryFn: () => synagogueId ? base44.entities.SynagogueSettings.filter({ synagogue_id: synagogueId }) : [],
    enabled: !!synagogueId,
  });

  const { data: customThemes = [] } = useQuery({
    queryKey: ['display-themes', synagogueId],
    queryFn: () => synagogueId ? base44.entities.DisplayTheme.filter({ synagogue_id: synagogueId }) : [],
    enabled: !!synagogueId,
  });

  const settings = settingsList[0] || {};

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings.id) {
        return base44.entities.SynagogueSettings.update(settings.id, data);
      }
      return base44.entities.SynagogueSettings.create({ ...data, synagogue_id: synagogueId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synagogue-settings', synagogueId] });
      toast.success('ההגדרות נשמרו');
    },
  });

  const deleteThemeMutation = useMutation({
    mutationFn: (id) => base44.entities.DisplayTheme.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['display-themes', synagogueId] });
      toast.success('התמה נמחקה');
    },
    onError: () => toast.error('שגיאה במחיקת התמה'),
  });

  const selectTheme = (themeId) => {
    saveMutation.mutate({ ...settings, display_theme: themeId });
  };

  const [form, setForm] = useState({
    synagogue_name: '',
    custom_message: '',
    secondary_message: '',
    zmanim_keys: [],
  });

  useEffect(() => {
    if (settings.id) {
      setForm({
        synagogue_name: settings.synagogue_name || '',
        custom_message: settings.custom_message || '',
        secondary_message: settings.secondary_message || '',
        zmanim_keys: settings.zmanim_keys || [],
      });
    }
  }, [settings.id]);

  const handleSaveInfo = () => {
    saveMutation.mutate({ ...settings, ...form });
  };

  const activeTheme = settings.display_theme || 'dark';

  return (
    <div className="space-y-8 font-heebo" dir="rtl">
      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">פרטי בית הכנסת</h2>
        <div className="space-y-3">
          <div>
            <Label className="font-heebo">שם בית הכנסת</Label>
            <Input
              value={form.synagogue_name}
              onChange={e => setForm(f => ({ ...f, synagogue_name: e.target.value }))}
              placeholder="בית כנסת..."
              className="font-heebo mt-1"
            />
          </div>
          <div>
            <Label className="font-heebo">הודעה ראשית (גולל)</Label>
            <Textarea
              value={form.custom_message}
              onChange={e => setForm(f => ({ ...f, custom_message: e.target.value }))}
              placeholder="הודעה שתוצג בגלילה בתחתית המסך..."
              className="font-heebo mt-1 resize-none"
              rows={2}
            />
          </div>
          <div>
            <Label className="font-heebo">הודעה משנית</Label>
            <Input
              value={form.secondary_message}
              onChange={e => setForm(f => ({ ...f, secondary_message: e.target.value }))}
              placeholder="הודעה נוספת..."
              className="font-heebo mt-1"
            />
          </div>
          <Button onClick={handleSaveInfo} disabled={saveMutation.isPending} className="font-heebo">
            {saveMutation.isPending ? 'שומר...' : 'שמור פרטים'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Zmanim selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">זמני היום לתצוגה</h2>
        <p className="text-sm text-muted-foreground">בחר אילו זמנים יוצגו בלוח "זמני היום" בתצוגה. אם לא נבחר דבר, יוצגו ברירות המחדל.</p>
        <div className="flex flex-wrap gap-2">
          {ZMANIM_CONFIG.map(z => {
            const active = form.zmanim_keys.includes(z.key);
            return (
              <button
                key={z.key}
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  zmanim_keys: active
                    ? f.zmanim_keys.filter(k => k !== z.key)
                    : [...f.zmanim_keys, z.key]
                }))}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border-2 text-sm font-heebo transition-all ${
                  active ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <span>{z.icon}</span>
                <span>{z.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => saveMutation.mutate({ ...settings, zmanim_keys: ZMANIM_CONFIG.filter(z => form.zmanim_keys.includes(z.key)).map(z => z.key) })}
            disabled={saveMutation.isPending}
            className="font-heebo"
          >
            {saveMutation.isPending ? 'שומר...' : 'שמור בחירת זמנים'}
          </Button>
          <Button
            variant="outline"
            onClick={() => setForm(f => ({ ...f, zmanim_keys: [...DEFAULT_ZMANIM_KEYS] }))}
            className="font-heebo"
          >
            ברירת מחדל
          </Button>
          {form.zmanim_keys.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setForm(f => ({ ...f, zmanim_keys: [] }))}
              className="font-heebo"
            >
              נקה הכל
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Theme Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">ערכת נושא לתצוגה</h2>

        {/* System themes */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">תמות מובנות</p>
          <div className="grid grid-cols-2 gap-3">
            {SYSTEM_THEMES.map(t => {
              const isActive = activeTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => selectTheme(t.id)}
                  className={`rounded-xl p-4 border-2 flex items-center gap-3 transition-all text-right ${
                    isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center"
                    style={{ background: t.bg }}>
                    <div className="w-4 h-1 rounded" style={{ background: t.primary }} />
                  </div>
                  <span className="font-heebo font-medium flex-1">{t.label}</span>
                  {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom themes */}
        {customThemes.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">תמות מותאמות אישית</p>
            <div className="grid grid-cols-2 gap-3">
              {customThemes.map(t => {
                const isActive = activeTheme === `custom:${t.id}`;
                const bgStyle = t.bg_type === 'image_url'
                  ? { backgroundImage: `url(${t.bg_value})`, backgroundSize: 'cover' }
                  : { background: t.bg_value || '#0d0d1a' };
                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      isActive ? 'border-primary' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <button
                      onClick={() => selectTheme(`custom:${t.id}`)}
                      className="w-full p-4 flex items-center gap-3 text-right"
                    >
                      <div className="w-10 h-10 rounded-lg shrink-0" style={bgStyle} />
                      <span className="font-heebo font-medium flex-1">{t.name}</span>
                      {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                    <div className="flex border-t border-border/50">
                      <button
                        onClick={() => { setEditingTheme(t); setThemeBuilderOpen(true); }}
                        className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 font-heebo transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> ערוך
                      </button>
                      <button
                        onClick={() => deleteThemeMutation.mutate(t.id)}
                        className="flex-1 py-2 text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-1 font-heebo transition-colors border-r border-border/50"
                      >
                        <Trash2 className="w-3 h-3" /> מחק
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => { setEditingTheme(null); setThemeBuilderOpen(true); }}
          className="font-heebo w-full"
        >
          <Plus className="w-4 h-4 ml-1" />
          צור תמה חדשה
        </Button>
      </div>

      <ThemeBuilder
        open={themeBuilderOpen}
        onClose={() => { setThemeBuilderOpen(false); setEditingTheme(null); }}
        editTheme={editingTheme}
        onSelectTheme={selectTheme}
        synagogueId={synagogueId}
      />
    </div>
  );
}