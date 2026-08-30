import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook that returns the current user's synagogue.
 * Each user has exactly one Synagogue record (owner_id === user.id).
 * Returns: { synagogue, isLoading, refetch }
 */
export default function useCurrentSynagogue() {
  const [synagogue, setSynagogue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSynagogue = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    const results = await base44.entities.Synagogue.filter({ owner_id: user.id });
    setSynagogue(results[0] || null);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSynagogue();
  }, []);

  return { synagogue, isLoading, refetch: fetchSynagogue };
}