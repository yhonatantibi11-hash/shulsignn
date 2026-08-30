import React from 'react';
import AdminNav from '@/components/admin/AdminNav';
import LessonsAdmin from '@/components/admin/LessonsAdmin';
import useCurrentSynagogue from '@/hooks/useCurrentSynagogue';

export default function AdminLessons() {
  const { synagogue } = useCurrentSynagogue();
  return (
    <div className="min-h-screen font-heebo" style={{ background: 'linear-gradient(160deg, #f0f8ff 0%, #e0f0fb 40%, #cce8f8 100%)' }}>
      <AdminNav synagogueId={synagogue?.id} />
      <div className="max-w-4xl mx-auto p-4 pb-24" style={{ color: 'inherit' }}>
        <LessonsAdmin />
      </div>
    </div>
  );
}