'use client';

/**
 * Calendario.tsx — Parte 4
 *
 * Mudanças:
 *  - Formulário para criar eventos (À faire / Rendez-vous)
 *  - Eventos guardados em localStorage ("calendarEvents")
 *  - Pontos coloridos nas células do calendário por tipo de evento
 *  - Lista de eventos do mês abaixo do calendário (com botão ×)
 */

import { useState } from 'react';
import { useLocalStorage } from './hooks';
import {
  getSportType, sportIcon, hasTherapy,
  MONTH_NAMES, DAY_ABBR, getWeekId, REDES_FORMATS,
  type CalendarEvent,
} from './data';

// Tipos mínimos para leitura do plano de redes (partilhado com Redes.tsx)
type RedesPostRef = { formatId: string; time: string };
type AllRedesPlan = Record<string, Partial<Record<number, RedesPostRef>>>;

interface Props {
  onDaySelect: (weekOffset: number, dayIndex: number) => void;
}

// Cores por tipo de evento
const EVENT_COLORS = {
  todo: '#f59e0b',  // âmbar — À faire
  rdv:  '#3b82f6',  // azul  — Rendez-vous
};

export default function Calendario({ onDaySelect }: Props) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [dayOffIndex] = useLocalStorage('dayOff', 5);

  // Todos os eventos do utilizador
  const [calendarEvents, setCalendarEvents] = useLocalStorage<CalendarEvent[]>('calendarEvents', []);

  // Plano de redes (só leitura, partilhado com Redes.tsx)
  const [allRedesPlan] = useLocalStorage<AllRedesPlan>('redesPlan', {});

  // Estado do formulário de criação
  const [formOpen,  setFormOpen]  = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate,  setFormDate]  = useState('');
  const [formTime,  setFormTime]  = useState('');
  const [formType,  setFormType]  = useState<'todo' | 'rdv'>('todo');

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  // ── Grelha do calendário (Seg–Dom) ────────────────────────────────────────
  const firstDay    = new Date(viewYear, viewMonth, 1);
  const rawOffset   = firstDay.getDay();
  const startOffset = rawOffset === 0 ? 6 : rawOffset - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // Converte uma data para "YYYY-MM-DD" (chave de comparação com os eventos)
  function toDateStr(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

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

  // ── Submeter o formulário ──────────────────────────────────────────────────
  function submitEvent() {
    if (!formTitle.trim() || !formDate) return;
    const newEvent: CalendarEvent = {
      id:    Date.now().toString(),
      title: formTitle.trim(),
      date:  formDate,
      time:  formTime || undefined,
      type:  formType,
    };
    setCalendarEvents((prev) => [...prev, newEvent]);
    // Limpa o formulário
    setFormTitle('');
    setFormDate('');
    setFormTime('');
    setFormType('todo');
    setFormOpen(false);
  }

  function deleteEvent(id: string) {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  }

  // Eventos do mês visível (para a lista abaixo)
  const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthEvents = calendarEvents
    .filter((e) => e.date.startsWith(monthStr))
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? ''));

  // ── ICS export (semana atual) ──────────────────────────────────────────────
  function exportICS() {
    const todayDay = today.getDay();
    const monday   = new Date(today);
    monday.setDate(today.getDate() - (todayDay === 0 ? 6 : todayDay - 1));
    monday.setHours(0, 0, 0, 0);

    let ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Routine Planner//FR\r\nCALSCALE:GREGORIAN\r\n';

    for (let d = 0; d < 7; d++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + d);
      const ymd   = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const sport = getSportType(d, dayOffIndex);
      const therapy = hasTherapy(d);

      if (sport === 'gym')       ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T090000\r\nDTEND:${ymd}T103000\r\nSUMMARY:💪 Gym\r\nEND:VEVENT\r\n`;
      else if (sport === 'jjb_fixed') ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T073000\r\nDTEND:${ymd}T083000\r\nSUMMARY:🥋 JJB\r\nEND:VEVENT\r\n`;
      else if (sport === 'jjb_off')   ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T090000\r\nDTEND:${ymd}T100000\r\nSUMMARY:🥋 JJB (repos)\r\nEND:VEVENT\r\n`;
      else if (sport === 'home')  ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T090000\r\nDTEND:${ymd}T100000\r\nSUMMARY:🏠 Home Workout\r\nEND:VEVENT\r\n`;

      ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T103000\r\nDTEND:${ymd}T113000\r\nSUMMARY:📚 Étude permis\r\nEND:VEVENT\r\n`;
      if (therapy) ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T104500\r\nDTEND:${ymd}T114500\r\nSUMMARY:🧠 Thérapie\r\nEND:VEVENT\r\n`;
      if (d !== dayOffIndex) ics += `BEGIN:VEVENT\r\nDTSTART:${ymd}T131500\r\nDTEND:${ymd}T201500\r\nSUMMARY:🛒 Grand Frais\r\nEND:VEVENT\r\n`;
    }

    ics += 'END:VCALENDAR';
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'routine-semaine.ics'; a.click();
    URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 520, margin: '0 auto', background: '#0A0A0A', minHeight: '100vh' }}>

      {/* ── Navegação entre meses ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={prevMonth} style={navBtnStyle}>←</button>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 500, color: '#F5F0E8', margin: 0 }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </h2>
        <button onClick={nextMonth} style={navBtnStyle}>→</button>
      </div>

      {/* ── Cabeçalho dos dias da semana ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_ABBR.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 800, color: '#6b7280', padding: '4px 0', letterSpacing: '0.04em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Grelha do calendário ──────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((date, idx) => {
          if (!date) return <div key={idx} />;

          const isToday  = date.toDateString() === today.toDateString();
          const isPast   = date < today && !isToday;
          const dayIdx   = dayIndexOf(date);
          const sport    = getSportType(dayIdx, dayOffIndex);
          const therapy  = hasTherapy(dayIdx);
          const dateStr  = toDateStr(date);
          // Eventos neste dia
          const dayEvents = calendarEvents.filter((e) => e.date === dateStr);
          // Post de redes neste dia
          const cellWeekId  = getWeekId(weekOffsetOf(date));
          const redesPost   = (allRedesPlan[cellWeekId] ?? {})[dayIdx];
          const redesFmt    = redesPost ? REDES_FORMATS.find((f) => f.id === redesPost.formatId) : null;

          return (
            <button key={idx}
              onClick={() => onDaySelect(weekOffsetOf(date), dayIdx)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '6px 2px', borderRadius: 12, cursor: 'pointer',
                background: isToday ? '#1E3A1E' : '#141414',
                border: `0.5px solid ${isToday ? '#7A9B6E' : '#1E1E1E'}`,
                opacity: isPast ? 0.45 : 1,
                minHeight: 64,
              } as React.CSSProperties}>

              {/* Número do dia */}
              <span style={{ fontSize: 12, fontWeight: 500, color: isToday ? '#C4A96B' : '#E8E3D8' }}>
                {date.getDate()}
              </span>
              {/* Ícone do sport */}
              <span style={{ fontSize: 14, marginTop: 2 }}>{sportIcon(sport)}</span>
              {therapy && <span style={{ fontSize: 9 }}>🧠</span>}

              {/* Pontos dos eventos + redes */}
              {(dayEvents.length > 0 || redesFmt) && (
                <div style={{ display: 'flex', gap: 2, marginTop: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* Ponto de post de redes (cor do formato) */}
                  {redesFmt && (
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: redesFmt.color,
                      flexShrink: 0,
                    }} />
                  )}
                  {/* Pontos de eventos do calendário (âmbar = todo, azul = rdv) */}
                  {dayEvents.slice(0, 2).map((ev) => (
                    <span key={ev.id} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: EVENT_COLORS[ev.type],
                      flexShrink: 0,
                    }} />
                  ))}
                  {dayEvents.length > 2 && (
                    <span style={{ fontSize: 7, color: '#6b7280', lineHeight: 1 }}>+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legenda ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginTop: 20 }}>
        {[
          { icon: '💪', label: 'Gym' },
          { icon: '🥋', label: 'JJB' },
          { icon: '🏠', label: 'Home' },
          { icon: '🧠', label: 'Thérapie' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{l.icon}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>{l.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLORS.todo, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#6b7280' }}>À faire</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLORS.rdv, display: 'inline-block' }} />
          <span style={{ fontSize: 11, color: '#6b7280' }}>Rendez-vous</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11 }}>📸</span>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Post redes</span>
        </div>
      </div>

      {/* ── Botão exportar ICS ────────────────────────────────── */}
      <div style={{ marginTop: 20 }}>
        <button onClick={exportICS}
          style={{ width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', background: '#141414', border: '0.5px solid #242424', color: '#C4A96B' }}>
          📅 Exporter la semaine (.ics)
        </button>
        <p style={{ fontSize: 11, textAlign: 'center', color: '#4b5563', marginTop: 6 }}>
          Compatible Google Calendar · Apple Calendar · Outlook
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          FORMULÁRIO DE CRIAÇÃO DE EVENTO
      ══════════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 24 }}>

        {/* Botão para abrir/fechar o formulário */}
        {!formOpen ? (
          <button onClick={() => setFormOpen(true)}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 14, cursor: 'pointer',
              border: '1px dashed #374151', background: 'transparent',
              color: '#6b7280', fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
            <span style={{ fontSize: 18 }}>+</span> Ajouter un événement
          </button>
        ) : (
          /* Formulário aberto */
          <div style={{ background: '#141414', border: '0.5px solid #242424', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 14 }}>
              Nouvel événement
            </div>

            {/* Tipo: À faire / Rendez-vous */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {(['todo', 'rdv'] as const).map((t) => (
                <button key={t} onClick={() => setFormType(t)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                    background: formType === t ? (t === 'rdv' ? '#1d4ed8' : '#92400e') : '#181818',
                    color: formType === t ? '#fff' : '#6b7280',
                  }}>
                  {t === 'todo' ? '✅ À faire' : '📅 Rendez-vous'}
                </button>
              ))}
            </div>

            {/* Título */}
            <input
              type="text"
              placeholder="Titre de l'événement"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={inputStyle}
            />

            {/* Data + Hora (na mesma linha) */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                style={{ ...inputStyle, flex: 2 }}
              />
              <input
                type="time"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                placeholder="optionnel"
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={submitEvent}
                disabled={!formTitle.trim() || !formDate}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13,
                  background: (!formTitle.trim() || !formDate) ? '#181818' : '#C4A96B',
                  color: (!formTitle.trim() || !formDate) ? '#4b5563' : '#0A0A0A',
                }}>
                Ajouter
              </button>
              <button onClick={() => { setFormOpen(false); setFormTitle(''); setFormDate(''); setFormTime(''); }}
                style={{ padding: '11px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: '#1f2937', color: '#6b7280', fontSize: 13 }}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          LISTA DE EVENTOS DO MÊS
      ══════════════════════════════════════════════════════════ */}
      {monthEvents.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', marginBottom: 10 }}>
            Événements — {MONTH_NAMES[viewMonth]}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {monthEvents.map((ev) => {
              const color = EVENT_COLORS[ev.type];
              // Formata a data para exibição "DD/MM"
              const [y, m, d] = ev.date.split('-');
              const dateLabel = `${d}/${m}/${y}`;
              return (
                <div key={ev.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 12,
                    background: '#141414', border: `0.5px solid ${color}20`,
                    borderLeft: `3px solid ${color}`,
                  }}>
                  {/* Ponto colorido por tipo */}
                  <span style={{ fontSize: 14, flexShrink: 0 }}>
                    {ev.type === 'rdv' ? '📅' : '✅'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      {dateLabel}{ev.time ? ` · ${ev.time.replace(':', 'h')}` : ''}
                    </div>
                  </div>
                  {/* Botão apagar */}
                  <button onClick={() => deleteEvent(ev.id)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(127,29,29,0.2)', color: '#f87171', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Estilos partilhados ────────────────────────────────────────────────────

const navBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, fontSize: 16, cursor: 'pointer',
  background: '#181818', color: '#9A9590', border: 'none',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 12px', borderRadius: 10,
  background: '#181818', color: '#F5F0E8',
  border: '0.5px solid #2E2E2E', fontSize: 13, outline: 'none',
  boxSizing: 'border-box',
};
