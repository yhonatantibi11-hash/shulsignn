import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Returns the synagogue_id for the current user.
 * Used inside admin components to scope all queries.
 */
export default function useSynagogueId() {
  const [synagogueId, setSynagogueId] = useState(null);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const results = await base44.entities.Synagogue.filter({ owner_id: user.id });
      if (results[0]) setSynagogueId(results[0].id);
    })();
  }, []);

  return synagogueId;
}