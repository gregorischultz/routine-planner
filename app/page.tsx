'use client';

import { useState } from 'react';
import Semana from './components/Semana';
import Financas from './components/Financas';
import Calendario from './components/Calendario';
import Redes from './components/Redes';

type Section = 'semana' | 'calendario' | 'financas' | 'redes';

const NAV = [
  { id: 'semana',      icon: '📅', label: 'Semana' },
  { id: 'calendario',  icon: '📆', label: 'Cal.' },
  { id: 'financas',    icon: '💰', label: 'Finanças' },
  { id: 'redes',       icon: '📸', label: 'Redes' },
] as const;

export default function App() {
  const today = new Date();
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const [section, setSection] = useState<Section>('semana');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(todayDayIndex);

  function handleCalendarSelect(offset: number, day: number) {
    setWeekOffset(offset);
    setSelectedDay(day);
    setSection('semana');
  }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100dvh', color: '#f3f4f6' }}>
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

      {/* Bottom nav — 4 abas */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#111118',
        borderTop: '1px solid #1f2937',
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
                color: active ? '#60a5fa' : '#6b7280',
                borderTop: active ? '2px solid #60a5fa' : '2px solid transparent',
              }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
