import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { escapeHtml } from '@/lib/escape-html';

const DAY_NAMES = {
  sunday: 'ראשון', monday: 'שני', tuesday: 'שלישי',
  wednesday: 'רביעי', thursday: 'חמישי', friday: 'שישי', saturday: 'שבת',
};

export default function ExportPDFButton({ prayerTimes, lessons, events, synagogueName }) {
  const generatePDF = async () => {
    // Create a hidden container for PDF generation
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '0';
    container.style.width = '800px';
    container.style.padding = '40px';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.direction = 'rtl';
    container.style.background = 'white';

    const fridayPrayers = prayerTimes.filter(p => {
      if (p.is_active === false) return false;
      const days = p.days || [];
      if (!days || days.length === 0 || days.includes('everyday')) return true;
      if (days.includes('weekdays')) return true;
      return days.includes('friday');
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const saturdayPrayers = prayerTimes.filter(p => {
      if (p.is_active === false) return false;
      const days = p.days || [];
      return days.includes('saturday');
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const fridayLessons = lessons.filter(l => {
      if (l.is_active === false) return false;
      if (l.schedule_type === 'one_time') return false;
      return l.days?.includes('friday');
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const saturdayLessons = lessons.filter(l => {
      if (l.is_active === false) return false;
      if (l.schedule_type === 'one_time') return false;
      return l.days?.includes('saturday');
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #2c3e50;">${escapeHtml(synagogueName || 'בית כנסת')}</h1>
        <h2 style="font-size: 20px; margin: 0; color: #7f8c8d;">זמני תפילות ושיעורים</h2>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 22px; color: #3498db; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 5px;">יום שישי</h3>
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">תפילות:</h4>
          ${fridayPrayers.map(p => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;">
              <span style="font-size: 16px; font-weight: bold;">${escapeHtml(p.name)}</span>
              <span style="font-size: 16px; color: #3498db;" dir="ltr">${escapeHtml(p.time)}</span>
            </div>
          `).join('')}
          ${fridayPrayers.length === 0 ? '<p style="color: #95a5a6;">אין תפילות מיוחדות</p>' : ''}
        </div>

        <div>
          <h4 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">שיעורים:</h4>
          ${fridayLessons.map(l => `
            <div style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;">
              <div style="font-size: 16px; font-weight: bold; color: #2c3e50;">${escapeHtml(l.title)}</div>
              <div style="font-size: 14px; color: #7f8c8d;">${escapeHtml(l.speaker)} • ${escapeHtml(l.time)}</div>
              ${l.location ? `<div style="font-size: 14px; color: #95a5a6;">📍 ${escapeHtml(l.location)}</div>` : ''}
            </div>
          `).join('')}
          ${fridayLessons.length === 0 ? '<p style="color: #95a5a6;">אין שיעורים</p>' : ''}
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 22px; color: #e67e22; margin-bottom: 15px; border-bottom: 2px solid #e67e22; padding-bottom: 5px;">יום שבת</h3>
        <div style="margin-bottom: 15px;">
          <h4 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">תפילות:</h4>
          ${saturdayPrayers.map(p => `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ecf0f1;">
              <span style="font-size: 16px; font-weight: bold;">${escapeHtml(p.name)}</span>
              <span style="font-size: 16px; color: #e67e22;" dir="ltr">${escapeHtml(p.time)}</span>
            </div>
          `).join('')}
          ${saturdayPrayers.length === 0 ? '<p style="color: #95a5a6;">אין תפילות מיוחדות</p>' : ''}
        </div>

        <div>
          <h4 style="font-size: 18px; color: #2c3e50; margin-bottom: 10px;">שיעורים:</h4>
          ${saturdayLessons.map(l => `
            <div style="padding: 8px 0; border-bottom: 1px solid #ecf0f1;">
              <div style="font-size: 16px; font-weight: bold; color: #2c3e50;">${escapeHtml(l.title)}</div>
              <div style="font-size: 14px; color: #7f8c8d;">${escapeHtml(l.speaker)} • ${escapeHtml(l.time)}</div>
              ${l.location ? `<div style="font-size: 14px; color: #95a5a6;">📍 ${escapeHtml(l.location)}</div>` : ''}
            </div>
          `).join('')}
          ${saturdayLessons.length === 0 ? '<p style="color: #95a5a6;">אין שיעורים</p>' : ''}
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; color: #95a5a6; font-size: 12px;">
        נוצר אוטומטית על ידי ${escapeHtml(synagogueName || 'בית הכנסת')}
      </div>
    `;

    document.body.appendChild(container);

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`luach-${synagogueName || 'shul'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      document.body.removeChild(container);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      variant="outline"
      size="sm"
      className="font-heebo flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      ייצוא PDF
    </Button>
  );
}
