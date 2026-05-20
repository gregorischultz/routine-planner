'use client';

import { useState } from 'react';
import { useLocalStorage } from './hooks';
import {
  getSportType, sportIcon, hasTherapy,
  MONTH_NAMES, DAY_ABBR,
} from './data';

interface Props {
  onDaySelect: (weekOffset: number, dayIndex: number) => void;
}

export default function Calendario({ onDaySelect }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [dayOffIndex] = useLocalStorage('dayOff', 5);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  // Build grid (Mon-Sun)
  const firstDay = new Date(viewYear, viewMonth, 1);
  const rawOffset = firstDay.getDay(); // 0=Sun
  const startOffset = rawOffset === 0 ? 6 : rawOffset - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
  while (cells.length % 7 !== 0) cells.push(null);

  function dayIndexOf(date: Date): number {
    const d = date.getDay();
    return d === 0 ? 6 : d - 1;
  }

  function weekOffsetOf(date: Date): number {
    const nowMonday = new Date(today);
    const nd = today.getDay();
    nowMonday.setDate(today.getDate() - (nd === 0 ? 6 : nd - 1));
    nowMonday.setHours(0, 0, 0, 0);

    const dateCopy = new Date(date);
    const dd = date.getDay();
    dateCopy.setDate(date.getDate() - (dd === 0 ? 6 : dd - 1));
    dateCopy.setHours(0, 0, 0, 0);

    return Math.round((dateCopy.getTime() - nowMonday.getTime()) / (7 * 24 * 3600 * 1000));
  }

  // ICS export for current week
  function exportICS() {
    const todayDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (todayDay === 0 ? 6 : todayDay - 1));
    monday.setHours(0, 0, 0, 0);

    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Routine Planner//FR\r\nCALSCALE:GREGORIAN\r\n';

    for (let d = 0; d < 7; d++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + d);
      const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const sport = getSportType(d, dayOffIndex);
      const therapy = hasTherapy(d);

      if (sport === 'gym') {
        ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T090000\r\nDTEND:${ymd}T103000\r\nSUMMARY:💪 Gym\r\nEND:VEVENT\r\n`;
      } else if (sport === 'jjb_fixed') {
        ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T073000\r\nDTEND:${ymd}T083000\r\nSUMMARY:🥋 JJB\r\nEND:VEVENT\r\n`;
      } else if (sport === 'jjb_off') {
        ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T090000\r\nDTEND:${ymd}T100000\r\nSUMMARY:🥋 JJB (repos)\r\nEND:VEVENT\r\n`;
      } else if (sport === 'home') {
        ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T090000\r\nDTEND:${ymd}T100000\r\nSUMMARY:🏠 Home Workout\r\nEND:VEVENT\r\n`;
      }

      ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T103000\r\nDTEND:${ymd}T113000\r\nSUMMARY:📚 Étude permis\r\nEND:VEVENT\r\n`;

      if (therapy) {
        ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T104500\r\nDTEND:${ymd}T114500\r\nSUMMARY:🧠 Thérapie\r\nEND:VEVENT\r\n`;
      }

      if (d !== dayOffIndex) {
        ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T131500\r\nDTEND:${ymd}T201500\r\nSUMMARY:🛒 Grand Frais\r\nEND:VEVENT\r\n`;
      }
    }

    ics += 'END:VCALENDAR';

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'routine-semaine.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-4 py-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4 max-w-lg mx-auto">
        <button onClick={prevMonth} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
          style={{ background: '#1f2937', color: '#9ca3af' }}>←</button>
        <h2 className="text-lg font-bold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
        <button onClick={nextMonth} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer"
          style={{ background: '#1f2937', color: '#9ca3af' }}>→</button>
      </div>

      {/* Day of week headers */}
      <div className="max-w-lg mx-auto grid grid-cols-7 mb-1">
        {DAY_ABBR.map((d) => (
          <div key={d} className="text-center py-1" style={{ fontSize: 10, fontWeight: 700, color: '#6b7280' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="max-w-lg mx-auto grid grid-cols-7 gap-1">
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />;
          const isToday = date.toDateString() === today.toDateString();
          const isPast = date < today && !isToday;
          const dayIdx = dayIndexOf(date);
          const sport = getSportType(dayIdx, dayOffIndex);
          const therapy = hasTherapy(dayIdx);

          return (
            <button key={idx} onClick={() => onDaySelect(weekOffsetOf(date), dayIdx)}
              className="flex flex-col items-center py-2 rounded-xl cursor-pointer transition-all"
              style={{
                background: isToday ? '#2563eb' : '#111118',
                border: `1px solid ${isToday ? '#3b82f6' : '#1f2937'}`,
                opacity: isPast ? 0.45 : 1,
              }}>
              <span className="text-xs font-semibold" style={{ color: isToday ? '#fff' : '#e5e7eb' }}>
                {date.getDate()}
              </span>
              <span className="text-sm">{sportIcon(sport)}</span>
              {therapy && <span style={{ fontSize: 9 }}>🧠</span>}
            </button>
          );
        })}
      </div>

      {/* Export ICS */}
      <div className="max-w-lg mx-auto mt-6 space-y-2">
        <button onClick={exportICS} className="w-full py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all"
          style={{ background: '#111118', border: '1px solid #1f2937', color: '#60a5fa' }}>
          📅 Exporter la semaine (.ics)
        </button>
        <p className="text-xs text-center" style={{ color: '#4b5563' }}>
          Compatible Google Calendar · Apple Calendar · Outlook
        </p>
      </div>

      {/* Legend */}
      <div className="max-w-lg mx-auto mt-5 flex items-center justify-center gap-5 flex-wrap">
        {[
          { icon: '💪', label: 'Gym' },
          { icon: '🥋', label: 'JJB' },
          { icon: '🏠', label: 'Home' },
          { icon: '🧠', label: 'Thérapie' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span>{l.icon}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
