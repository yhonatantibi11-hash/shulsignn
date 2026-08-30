import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('נא להזין שם בית כנסת');
      return;
    }
    setIsLoading(true);
    const user = await base44.auth.me();
    const synagogue = await base44.entities.Synagogue.create({
      name: name.trim(),
      address: address.trim(),
      owner_id: user.id,
    });
    // Also create initial SynagogueSettings
    await base44.entities.SynagogueSettings.create({
      synagogue_id: synagogue.id,
      synagogue_name: name.trim(),
      display_theme: 'dark',
    });
    toast.success('בית הכנסת נוצר בהצלחה!');
    onComplete(synagogue);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-heebo" dir="rtl" style={{ background: 'linear-gradient(160deg, #f0f8ff 0%, #e0f0fb 40%, #cce8f8 100%)' }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🕍</div>
          <h1 className="text-3xl font-frank font-bold text-slate-800">ברוך הבא!</h1>
          <p className="text-slate-500 mt-2">כדי להתחיל, צור את בית הכנסת שלך</p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(33,150,200,0.2)', boxShadow: '0 8px 32px rgba(33,150,200,0.1)' }}>
          <div>
            <Label className="font-heebo text-base">שם בית הכנסת *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: בית כנסת אהבת ציון"
              className="font-heebo mt-1 text-base"
            />
          </div>
          <div>
            <Label className="font-heebo text-base">כתובת (אופציונלי)</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="לדוגמה: רחוב הרצל 5, תל אביב"
              className="font-heebo mt-1 text-base"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full font-heebo text-base py-5"
          >
            {isLoading ? 'יוצר...' : 'צור את בית הכנסת שלי'}
          </Button>
        </div>
      </div>
    </div>
  );
}