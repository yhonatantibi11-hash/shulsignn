import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';

export default function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange(res.file_url);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full max-w-[220px]">
          <img src={value} alt="תצוגה מקדימה" className="w-full h-32 object-cover rounded-lg border border-border" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-1 w-full h-28 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs font-heebo text-muted-foreground">לחץ להעלות תמונה / פוסטר</span>
            </>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      )}
    </div>
  );
}