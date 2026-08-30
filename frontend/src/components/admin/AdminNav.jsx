import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, BookOpen, CalendarDays, CalendarRange, Settings, Monitor, Home } from 'lucide-react';

const navItems = [
  { path: '/admin', icon: Clock, label: 'זמני תפילות' },
  { path: '/admin/lessons', icon: BookOpen, label: 'שיעורים' },
  { path: '/admin/events', icon: CalendarDays, label: 'אירועים' },
  { path: '/admin/calendar', icon: CalendarRange, label: 'לוח שנה' },
  { path: '/admin/settings', icon: Settings, label: 'הגדרות' },
];

export default function AdminNav({ synagogueId }) {
  const location = useLocation();
  const displayPath = `/display${synagogueId ? `?sid=${synagogueId}` : ''}`;

  const allItems = [
    { path: '/', icon: Home, label: 'בית', isHome: true },
    ...navItems,
    { path: displayPath, icon: Monitor, label: 'תצוגה', isDisplay: true },
  ];

  return (
    <>
      {/* Desktop: top nav */}
      <nav className="hidden md:block sticky top-0 z-50" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(33,150,200,0.15)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-1 overflow-x-auto">
              {navItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-heebo font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-500 hover:text-sky-700 hover:bg-sky-50'
                    }`}
                    style={isActive ? { background: 'linear-gradient(135deg, #1a6fb5, #2196c8)' } : {}}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-heebo font-medium text-slate-500 hover:text-sky-700 hover:bg-sky-50 transition-colors whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                בית
              </Link>
              <Link
                to={displayPath}
                target="_blank"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-heebo font-medium text-white transition-colors whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #2196c8, #38bdf8)' }}
              >
                <Monitor className="w-4 h-4" />
                מסך תצוגה
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile: bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50" dir="rtl" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(33,150,200,0.15)' }}>
        <div className="flex items-center justify-around h-16">
          {allItems.map(item => {
            const isActive = location.pathname === item.path;
            const isDisplay = item.isDisplay;
            return (
              <Link
                key={item.path}
                to={item.path}
                target={isDisplay ? '_blank' : undefined}
                className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-xs font-heebo font-medium transition-colors ${
                  isDisplay
                    ? 'text-sky-500'
                    : isActive
                    ? 'text-sky-700'
                    : 'text-slate-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer so content isn't hidden behind bottom nav on mobile */}
      <div className="md:hidden h-16" />
    </>
  );
}