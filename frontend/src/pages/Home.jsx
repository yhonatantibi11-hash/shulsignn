import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Settings, Clock, BookOpen, CalendarDays, Download, Share, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import useCurrentSynagogue from '@/hooks/useCurrentSynagogue';
import Onboarding from './Onboarding';
import { escapeHtml } from '@/lib/escape-html';

export default function Home() {
  const { synagogue, isLoading, refetch } = useCurrentSynagogue();
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    if (!synagogue) return;
    base44.entities.PrayerTime.filter({ synagogue_id: synagogue.id }).then(setPrayerTimes);
    base44.entities.TorahLesson.filter({ synagogue_id: synagogue.id }).then(setLessons);
  }, [synagogue]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  if (!synagogue) {
    return <Onboarding onComplete={refetch} />;
  }

  const shareDisplay = async () => {
    const displayUrl = `${window.location.origin}/display?sid=${synagogue.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: synagogue.name,
          text: `צפה בזמני התפילות והשיעורים של ${synagogue.name}`,
          url: displayUrl
        });
      } catch (error) {
        if (error.name !== 'AbortError') console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(displayUrl);
        alert('הקישור הועתק! ניתן להדביק ולשתף');
      } catch (error) {
        console.error('Error copying:', error);
      }
    }
  };

  const generatePDF = async () => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '0';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.direction = 'rtl';
    container.style.background = 'white';

    const fridayPrayers = prayerTimes.filter((p) => {
      if (p.is_active === false) return false;
      const days = p.days || [];
      if (!days || days.length === 0 || days.includes('everyday')) return true;
      if (days.includes('weekdays')) return true;
      return days.includes('friday');
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const saturdayPrayers = prayerTimes.filter((p) => {
      if (p.is_active === false) return false;
      const days = p.days || [];
      return days.includes('saturday');
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const fridayLessons = lessons.filter((l) => {
      if (l.is_active === false) return false;
      if (l.schedule_type === 'one_time') return new Date(l.one_time_date).getDay() === 5;
      const days = l.days || (l.day ? [l.day] : []);
      return days.includes('friday');
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const saturdayLessons = lessons.filter((l) => {
      if (l.is_active === false) return false;
      if (l.schedule_type === 'one_time') return new Date(l.one_time_date).getDay() === 6;
      const days = l.days || (l.day ? [l.day] : []);
      return days.includes('saturday');
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #2c3e50;">${escapeHtml(synagogue.name)}</h1>
        <h2 style="font-size: 20px; margin: 0; color: #7f8c8d;">זמני תפילות ושיעורים</h2>
      </div>
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 22px; color: #3498db; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 5px;">יום שישי</h3>
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">תפילות:</h4>
          ${fridayPrayers.map((p) => `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><span style="font-size: 16px; font-weight: bold;">${escapeHtml(p.name)}</span><span style="font-size: 16px; color: #3498db;" dir="ltr">${escapeHtml(p.time)}</span></div>`).join('')}
          ${fridayPrayers.length === 0 ? '<p style="color: #95a5a6;">אין תפילות מיוחדות</p>' : ''}
        </div>
        <div>
          <h4 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">שיעורים:</h4>
          ${fridayLessons.map((l) => `<div style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><div style="font-size: 16px; font-weight: bold; color: #2c3e50;">${escapeHtml(l.title)}</div><div style="font-size: 14px; color: #7f8c8d;">${escapeHtml(l.speaker)} • ${escapeHtml(l.time)}</div>${l.location ? `<div style="font-size: 14px; color: #95a5a6;">📍 ${escapeHtml(l.location)}</div>` : ''}</div>`).join('')}
          ${fridayLessons.length === 0 ? '<p style="color: #95a5a6;">אין שיעורים</p>' : ''}
        </div>
      </div>
      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 22px; color: #e67e22; margin-bottom: 15px; border-bottom: 2px solid #e67e22; padding-bottom: 5px;">יום שבת</h3>
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">תפילות:</h4>
          ${saturdayPrayers.map((p) => `<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><span style="font-size: 16px; font-weight: bold;">${escapeHtml(p.name)}</span><span style="font-size: 16px; color: #e67e22;" dir="ltr">${escapeHtml(p.time)}</span></div>`).join('')}
          ${saturdayPrayers.length === 0 ? '<p style="color: #95a5a6;">אין תפילות מיוחדות</p>' : ''}
        </div>
        <div>
          <h4 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">שיעורים:</h4>
          ${saturdayLessons.map((l) => `<div style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;"><div style="font-size: 16px; font-weight: bold; color: #2c3e50;">${escapeHtml(l.title)}</div><div style="font-size: 14px; color: #7f8c8d;">${escapeHtml(l.speaker)} • ${escapeHtml(l.time)}</div>${l.location ? `<div style="font-size: 14px; color: #95a5a6;">📍 ${escapeHtml(l.location)}</div>` : ''}</div>`).join('')}
          ${saturdayLessons.length === 0 ? '<p style="color: #95a5a6;">אין שיעורים</p>' : ''}
        </div>
      </div>
      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; color: #95a5a6; font-size: 12px;">
        נוצר אוטומטית על ידי ${escapeHtml(synagogue.name)}
      </div>
    `;

    document.body.appendChild(container);
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210,pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const scaleFactor = imgHeight > pageHeight ? pageHeight / imgHeight : 1;
      const scaledImgHeight = imgHeight * scaleFactor;
      const scaledImgWidth = imgWidth * scaleFactor;
      const marginLeft = (pageWidth - scaledImgWidth) / 2;
      pdf.addImage(imgData, 'PNG', marginLeft, 0, scaledImgWidth, scaledImgHeight);
      pdf.save(`luach-${synagogue.name}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  };

  return (
    <div className="min-h-screen font-heebo flex flex-col items-center justify-center p-4" dir="rtl" style={{ background: 'linear-gradient(160deg, #f0f8ff 0%, #e0f0fb 40%, #cce8f8 100%)' }}>
      <div className="max-w-lg w-full space-y-8 text-center">
        <div>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.7)', boxShadow: '0 4px 20px rgba(33,150,200,0.15)' }}>
            <span className="text-4xl">🕍</span>
          </div>
          <h1 className="text-3xl font-frank font-bold text-slate-800">{synagogue.name}</h1>
          <p className="font-heebo mt-2 text-slate-500">מערכת ניהול מסך תצוגה</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/admin" className="col-span-2">
            <div className="rounded-2xl p-5 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md" style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(33,150,200,0.2)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #1a6fb5, #2196c8)' }}>
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-heebo font-bold text-slate-800">לוח ניהול (גבאי)</h3>
                <p className="text-sm text-slate-500">ניהול זמנים, שיעורים ואירועים</p>
              </div>
            </div>
          </Link>

          <Link to={`/display?sid=${synagogue.id}`} className="col-span-2">
            <div className="rounded-2xl p-5 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(33,150,200,0.15)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #2196c8, #38bdf8)' }}>
                <Monitor className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <h3 className="font-heebo font-bold text-slate-800">מסך תצוגה (טלוויזיה)</h3>
                <p className="text-sm text-slate-500">פתח את מסך הצגת הנתונים</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Link to="/admin">
            <button className="w-full font-heebo text-xs py-3 flex flex-col items-center gap-1 rounded-xl text-sky-700 transition-all hover:scale-[1.03]" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(33,150,200,0.2)' }}>
              <Clock className="w-4 h-4" />
              תפילות
            </button>
          </Link>
          <Link to="/admin/lessons">
            <button className="w-full font-heebo text-xs py-3 flex flex-col items-center gap-1 rounded-xl text-sky-700 transition-all hover:scale-[1.03]" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(33,150,200,0.2)' }}>
              <BookOpen className="w-4 h-4" />
              שיעורים
            </button>
          </Link>
          <Link to="/admin/events">
            <button className="w-full font-heebo text-xs py-3 flex flex-col items-center gap-1 rounded-xl text-sky-700 transition-all hover:scale-[1.03]" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(33,150,200,0.2)' }}>
              <CalendarDays className="w-4 h-4" />
              אירועים
            </button>
          </Link>
        </div>

        <button onClick={shareDisplay} className="w-full font-heebo text-sm py-4 flex items-center justify-center gap-2 rounded-xl text-sky-700 transition-all hover:scale-[1.01]" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(33,150,200,0.2)' }}>
          <Share className="w-5 h-5" />
          שתף מסך תצוגה
        </button>

        <button onClick={generatePDF} className="w-full font-heebo text-sm py-4 flex items-center justify-center gap-2 rounded-xl text-white font-semibold transition-all hover:scale-[1.01]" style={{ background: 'linear-gradient(135deg, #1a6fb5, #2196c8)', boxShadow: '0 4px 15px rgba(33,150,200,0.3)' }}>
          <Download className="w-5 h-5" />
          ייצוא PDF לשישי ושבת
        </button>

        <button
          onClick={() => base44.auth.logout()}
          className="w-full font-heebo text-sm hover:text-slate-600 transition-colors py-2 text-[hsl(var(--foreground))]">
          
          <LogOut className="w-4 h-4 inline ml-1" />
          התנתק
        </button>
      </div>
    </div>);

}
