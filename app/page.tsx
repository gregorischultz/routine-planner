'use client';

import { useState } from 'react';
import Semana from './components/Semana';
import Financas from './components/Financas';
import Calendario from './components/Calendario';
import Redes from './components/Redes';

/** Número da semana ISO (1–53). */
function isoWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
}

type Section = 'semana' | 'calendario' | 'financas' | 'redes';

const NAV = [
  { id: 'semana',     icon: '📅', label: 'Semana' },
  { id: 'calendario', icon: '📆', label: 'Cal.' },
  { id: 'financas',   icon: '💰', label: 'Finanças' },
  { id: 'redes',      icon: '📸', label: 'Redes' },
] as const;

export default function App() {
  const today       = new Date();
  const weekNum     = isoWeek(today);
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const [section,     setSection]     = useState<Section>('semana');
  const [weekOffset,  setWeekOffset]  = useState(0);
  const [selectedDay, setSelectedDay] = useState(todayDayIndex);

  function handleCalendarSelect(offset: number, day: number) {
    setWeekOffset(offset);
    setSelectedDay(day);
    setSection('semana');
  }

  return (
    <div style={{ background: '#0A0A0A', minHeight: '100dvh', color: '#F5F0E8' }}>

      {/* ── TOPBAR ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 60,
        background: '#0A0A0A',
        borderBottom: '0.5px solid #242424',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 48,
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 12, letterSpacing: '0.22em', color: '#F5F0E8',
        }}>
          RENITĒNS
        </span>
        <span style={{ fontSize: 10, color: '#6A6660', letterSpacing: '0.08em' }}>
          S{weekNum}
        </span>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        {section === 'semana' && (
          <Semana
            weekOffset={weekOffset}
            onWeekChange={setWeekOffset}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
          />
        )}
        {section === 'calendario' && (
          <Calendario onDaySelect={handleCalendarSelect} />
        )}
        {section === 'financas' && <Financas />}
        {section === 'redes'    && <Redes />}
      </div>

      {/* ── BOTTOM NAV ───────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#111111',
        borderTop: '0.5px solid #242424',
        display: 'flex',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}>
        {NAV.map((item) => {
          const active = section === item.id;
          return (
            <button key={item.id} onClick={() => setSection(item.id)}
              style={{
                flex: 1, height: 58,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                cursor: 'pointer', border: 'none', background: 'none',
                color: active ? '#F5F0E8' : '#6A6660',
                borderTop: active ? '1.5px solid #C4A96B' : '1.5px solid transparent',
              }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
