import { useState, useEffect } from 'react';

export default function useHebrewDate() {
  const [hebrewData, setHebrewData] = useState({
    hebrewDate: '',
    parasha: '',
    loading: true
  });

  useEffect(() => {
    async function fetchHebrewDate() {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      try {
        const response = await fetch(
          `https://www.hebcal.com/converter?cfg=json&date=${dateStr}&g2h=1&strict=1`
        );
        const data = await response.json();
        const hebrewDate = data.hebrew || '';
        
        // Fetch parasha
        const gy = now.getFullYear();
        const gm = now.getMonth() + 1;
        const parashaResponse = await fetch(
          `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=off&mod=off&nx=off&year=${gy}&month=${gm}&ss=off&mf=off&c=off&s=off&sedrot=on`
        );
        const parashaData = await parashaResponse.json();
        
        // Find the closest upcoming parasha
        const today = now.getTime();
        let closestParasha = '';
        if (parashaData.items) {
          const parashaItems = parashaData.items
            .filter(item => item.category === 'parashat')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          
          for (const item of parashaItems) {
            const itemDate = new Date(item.date).getTime();
            if (itemDate >= today - 86400000 * 1) { // include today and a day before
              closestParasha = item.hebrew || item.title;
              break;
            }
          }
        }
        
        setHebrewData({
          hebrewDate,
          parasha: closestParasha,
          loading: false
        });
      } catch (err) {
        console.error('Failed to fetch Hebrew date:', err);
        setHebrewData(prev => ({ ...prev, loading: false }));
      }
    }

    fetchHebrewDate();
    // Refresh every hour
    const interval = setInterval(fetchHebrewDate, 3600000);
    return () => clearInterval(interval);
  }, []);

  return hebrewData;
}