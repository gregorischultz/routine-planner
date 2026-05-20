'use client';

/**
 * Redes.tsx — Planeamento de redes sociais por semana
 *
 * Fluxo:
 *  1. Vês os 7 dias da semana
 *  2. Tocas num dia e escolhes o formato + hora de publicação
 *  3. Aba "Gravar" mostra o guia de gravação só para os formatos escolhidos
 *  4. Aba "Checklist" adapta-se aos formatos da semana
 *
 * Os dados são partilhados com Semana (cartão de previsão na timeline)
 * e com Calendário (pontos nos dias com post agendado).
 */

import { useState, useMemo } from 'react';
import { useLocalStorage } from './hooks';
import {
  DAYS, DAY_ABBR, REDES_FORMATS, REDES_CHECKLIST,
  getWeekId, getDayDate, formatDate,
} from './data';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

/** Um post planeado para um dia */
export interface RedesPost {
  formatId: string;  // ex: 'f1', 'ca'
  time: string;      // ex: '19:00'
}

/** Plano de uma semana: dayIndex (0–6) → post */
export type WeekRedesPlan = Partial<Record<number, RedesPost>>;

/** Todos os planos, indexados por weekId ("YYYY-MM-DD") */
export type AllRedesPlan = Record<string, WeekRedesPlan>;

type RedesTab = 'plan' | 'record' | 'checklist';

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function Redes() {
  const today        = new Date();
  const todayDayIdx  = today.getDay() === 0 ? 6 : today.getDay() - 1;

  // Navegação de semana (mesmo sistema que Semana.tsx)
  const [weekOffset, setWeekOffset] = useState(0);
  // Dia selecionado para atribuir formato (null = nenhum)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeTab,   setActiveTab]   = useState<RedesTab>('plan');

  // Dados persistidos: plano de posts e checklist
  const [allPlan,  setAllPlan]  = useLocalStorage<AllRedesPlan>('redesPlan', {});
  const [checkMap, setCheckMap] = useLocalStorage<Record<string, boolean>>('redesChecklist', {});

  // Identificação da semana
  const weekId        = getWeekId(weekOffset);
  const isCurrentWeek = weekOffset === 0;
  const weekDates     = Array.from({ length: 7 }, (_, i) => getDayDate(weekOffset, i));
  const weekPlan: WeekRedesPlan = allPlan[weekId] ?? {};

  // ── Helpers de dados ──────────────────────────────────────────────────

  /** Define (ou apaga) o post de um dia */
  function setDayPost(dayIdx: number, post: RedesPost | undefined) {
    setAllPlan((prev) => {
      const weekData = { ...(prev[weekId] ?? {}) };
      if (post === undefined) delete weekData[dayIdx];
      else weekData[dayIdx] = post;
      return { ...prev, [weekId]: weekData };
    });
  }

  /** IDs de formatos únicos usados esta semana (para guia e checklist) */
  const usedFormatIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(weekPlan).forEach((p) => { if (p) ids.add(p.formatId); });
    return [...ids];
  }, [weekPlan]);

  /** Quantos posts estão planeados */
  const postCount = Object.values(weekPlan).filter(Boolean).length;

  // ── Checklist ─────────────────────────────────────────────────────────

  const allCheckItems = useMemo(() => [
    ...REDES_CHECKLIST.base,
    ...usedFormatIds.flatMap((id) => REDES_CHECKLIST[id] ?? []),
  ], [usedFormatIds]);

  const doneCount = allCheckItems.filter((i) => !!checkMap[`${weekId}-${i.id}`]).length;
  const progress  = allCheckItems.length > 0 ? Math.round((doneCount / allCheckItems.length) * 100) : 0;

  function toggleCheck(itemId: string) {
    const key = `${weekId}-${itemId}`;
    setCheckMap((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div>

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div style={{ background: '#111118', borderBottom: '1px solid #1f2937', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '12px 16px 10px' }}>

          {/* Navegação de semana */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <button onClick={() => { setWeekOffset((w) => w - 1); setSelectedDay(null); }} style={navBtnStyle}>‹</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {isCurrentWeek ? 'Esta semana' : `${formatDate(weekDates[0])} – ${formatDate(weekDates[6])}`}
              </div>
              {!isCurrentWeek && (
                <button onClick={() => { setWeekOffset(0); setSelectedDay(null); }}
                  style={{ fontSize: 11, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>
                  ↩ Semana atual
                </button>
              )}
            </div>
            <button onClick={() => { setWeekOffset((w) => w + 1); setSelectedDay(null); }} style={navBtnStyle}>›</button>
          </div>

          {/* Grelha de dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: 7 }, (_, d) => {
              const post      = weekPlan[d];
              const fmt       = post ? REDES_FORMATS.find((f) => f.id === post.formatId) : null;
              const isToday   = isCurrentWeek && d === todayDayIdx;
              const isSel     = selectedDay === d;

              return (
                <button key={d} onClick={() => setSelectedDay(isSel ? null : d)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '7px 2px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: isSel ? '#2563eb' : isToday ? 'rgba(37,99,235,0.15)' : 'rgba(31,41,55,0.6)',
                    boxShadow: isSel ? '0 4px 16px rgba(37,99,235,0.3)' : undefined,
                    minHeight: 70, position: 'relative',
                  }}>
                  {/* Ponto de "hoje" */}
                  {isToday && !isSel && (
                    <span style={{ position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderRadius: '50%', background: '#93c5fd' }} />
                  )}
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', color: isSel ? '#fff' : '#9ca3af' }}>
                    {DAY_ABBR[d]}
                  </span>
                  <span style={{ fontSize: 11, color: isSel ? '#bfdbfe' : '#4b5563' }}>
                    {weekDates[d].getDate()}
                  </span>
                  {/* Código do formato atribuído (ou +) */}
                  {fmt ? (
                    <>
                      <span style={{
                        fontSize: 10, fontWeight: 900, marginTop: 2,
                        color: isSel ? '#fff' : fmt.color,
                      }}>
                        {fmt.code}
                      </span>
                      <span style={{ fontSize: 9, color: isSel ? '#bfdbfe' : '#6b7280' }}>
                        {post!.time.replace(':', 'h')}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 16, color: isSel ? '#bfdbfe' : '#374151', marginTop: 4 }}>+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ABAS ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#111118', borderBottom: '1px solid #1f2937' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex' }}>
          {([
            { id: 'plan',      label: `📋 Plano (${postCount})` },
            { id: 'record',    label: '🎬 Gravar' },
            { id: 'checklist', label: `✅ ${progress}%` },
          ] as { id: RedesTab; label: string }[]).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, height: 44, fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                border: 'none', background: 'none', cursor: 'pointer',
                color: activeTab === tab.id ? '#60a5fa' : '#6b7280',
                borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTEÚDO ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px 16px 32px' }}>

        {/* ════════════════════════════════════════════════════
            ABA: PLANO
            Painel de atribuição de formato ao dia selecionado
            + lista de todos os posts planeados.
        ════════════════════════════════════════════════════ */}
        {activeTab === 'plan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── Painel de atribuição ────────────────────────
                Aparece apenas quando um dia está selecionado.
            ──────────────────────────────────────────────── */}
            {selectedDay !== null && (
              <AssignPanel
                dayLabel={`${DAYS[selectedDay]} · ${formatDate(weekDates[selectedDay])}`}
                current={weekPlan[selectedDay]}
                onSave={(post) => { setDayPost(selectedDay, post); setSelectedDay(null); }}
                onClear={() => { setDayPost(selectedDay, undefined); setSelectedDay(null); }}
                onClose={() => setSelectedDay(null)}
              />
            )}

            {/* ── Posts planeados esta semana ──────────────── */}
            {postCount > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>
                  Posts desta semana
                </div>
                {Array.from({ length: 7 }, (_, d) => {
                  const post = weekPlan[d];
                  if (!post) return null;
                  const fmt = REDES_FORMATS.find((f) => f.id === post.formatId);
                  if (!fmt) return null;
                  return (
                    <div key={d}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 12,
                        background: '#111118', border: `1px solid ${fmt.color}30`,
                        borderLeft: `3px solid ${fmt.color}`,
                      }}>
                      {/* Código */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                        background: fmt.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: fmt.color }}>{fmt.code}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>
                          {fmt.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                          {DAYS[d]} · {post.time.replace(':', 'h')} · Instagram
                        </div>
                      </div>
                      {/* Botão editar */}
                      <button onClick={() => { setSelectedDay(d); setActiveTab('plan'); }}
                        style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#1f2937', color: '#9ca3af', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                        ✏️
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Estado vazio
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📸</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                  Nenhum post planeado
                </div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>
                  Toca num dia da grelha para escolher o formato
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            ABA: GRAVAR
            Guia de gravação só para os formatos desta semana.
        ════════════════════════════════════════════════════ */}
        {activeTab === 'record' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {usedFormatIds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af', marginBottom: 6 }}>
                  Sem formatos atribuídos
                </div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>
                  Define os posts na aba <strong style={{ color: '#fff' }}>Plano</strong> para ver o que gravar.
                </div>
              </div>
            ) : (
              usedFormatIds.map((id) => {
                const fmt = REDES_FORMATS.find((f) => f.id === id);
                if (!fmt) return null;
                // Dias em que este formato está planeado
                const days = Object.entries(weekPlan)
                  .filter(([, p]) => p?.formatId === id)
                  .map(([d, p]) => `${DAYS[Number(d)]} ${p!.time.replace(':', 'h')}`);

                return (
                  <div key={id} style={{ background: '#111118', border: `1px solid ${fmt.color}30`, borderRadius: 14, overflow: 'hidden' }}>
                    {/* Cabeçalho */}
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${fmt.color}20`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: fmt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{fmt.code}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{fmt.label}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{days.join(' · ')} · {fmt.duration}</div>
                      </div>
                    </div>
                    {/* Guia */}
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <GuideRow icon="🎬" label="O que gravar" text={fmt.guide.what} color={fmt.color} />
                      <GuideRow icon="📱" label="Equipamento"  text={fmt.guide.equipment} color={fmt.color} />
                      <GuideRow icon="💡" label="Regra de ouro" text={fmt.guide.tip}  color={fmt.color} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            ABA: CHECKLIST
            Itens base + itens dos formatos desta semana.
        ════════════════════════════════════════════════════ */}
        {activeTab === 'checklist' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Barra de progresso */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Progresso da semana</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: progress === 100 ? '#4ade80' : '#60a5fa' }}>
                {doneCount}/{allCheckItems.length}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 4, background: '#1f2937', marginBottom: 4 }}>
              <div style={{ height: '100%', borderRadius: 4, background: progress === 100 ? '#10b981' : '#3b82f6', width: `${progress}%`, transition: 'width 0.4s' }} />
            </div>

            {usedFormatIds.length === 0 && (
              <div style={{ background: 'rgba(120,53,15,0.15)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
                  ⚠️ Define os formatos na aba Plano para ver o checklist completo.
                </div>
              </div>
            )}

            {/* Base */}
            <ChecklistSection title="Base — toda semana" color="#60a5fa"
              items={REDES_CHECKLIST.base} weekId={weekId} checkMap={checkMap} onToggle={toggleCheck} />

            {/* Por formato */}
            {usedFormatIds.map((id) => {
              const fmt   = REDES_FORMATS.find((f) => f.id === id);
              const items = REDES_CHECKLIST[id];
              if (!fmt || !items) return null;
              return (
                <ChecklistSection key={id}
                  title={`${fmt.code} — ${fmt.label}`} color={fmt.color}
                  items={items} weekId={weekId} checkMap={checkMap} onToggle={toggleCheck} />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Painel de atribuição de formato a um dia
// ─────────────────────────────────────────────

function AssignPanel({
  dayLabel, current, onSave, onClear, onClose,
}: {
  dayLabel: string;
  current?: RedesPost;
  onSave: (post: RedesPost) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  // Estado local do painel — inicia com os valores existentes ou defaults
  const [selFormatId, setSelFormatId] = useState<string>(current?.formatId ?? '');
  const [time, setTime] = useState<string>(current?.time ?? '19:00');

  const selFmt = REDES_FORMATS.find((f) => f.id === selFormatId);

  // Quando o utilizador escolhe um formato, atualiza a hora padrão
  function pickFormat(id: string) {
    setSelFormatId(id);
    const fmt = REDES_FORMATS.find((f) => f.id === id);
    if (fmt && fmt.hour !== '—') {
      // Converte "19h00" → "19:00"
      setTime(fmt.hour.replace('h', ':'));
    }
  }

  return (
    <div style={{ background: '#111118', border: '1px solid #374151', borderRadius: 14, padding: 16 }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{dayLabel}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16 }}>✕</button>
      </div>

      {/* Seletor de formatos — scroll horizontal */}
      <div style={{ overflowX: 'auto', marginBottom: 12, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
          {REDES_FORMATS.map((fmt) => {
            const isSel = selFormatId === fmt.id;
            return (
              <button key={fmt.id} onClick={() => pickFormat(fmt.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: isSel ? fmt.color : '#1f2937',
                  minWidth: 56,
                  boxShadow: isSel ? `0 0 12px ${fmt.color}60` : undefined,
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: isSel ? '#fff' : fmt.color }}>{fmt.code}</span>
                <span style={{ fontSize: 9, color: isSel ? 'rgba(255,255,255,0.8)' : '#6b7280', whiteSpace: 'nowrap' }}>
                  {fmt.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Nome do formato selecionado */}
      {selFmt && (
        <div style={{ fontSize: 12, color: selFmt.color, fontWeight: 600, marginBottom: 12 }}>
          {selFmt.code} — {selFmt.label} · {selFmt.duration}
        </div>
      )}

      {/* Hora de publicação */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }}>Hora:</span>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 9,
            background: '#1f2937', color: '#fff', border: '1px solid #374151',
            fontSize: 14, outline: 'none',
          }} />
      </div>

      {/* Botões de ação */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => selFormatId && onSave({ formatId: selFormatId, time })}
          disabled={!selFormatId}
          style={{
            flex: 1, height: 44, borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: selFormatId ? 'pointer' : 'not-allowed',
            background: selFormatId ? (selFmt?.color ?? '#2563eb') : '#1f2937',
            color: selFormatId ? '#fff' : '#4b5563',
          }}>
          Confirmar
        </button>
        {current && (
          <button onClick={onClear}
            style={{ padding: '0 16px', height: 44, borderRadius: 10, border: 'none', background: 'rgba(127,29,29,0.2)', color: '#f87171', fontSize: 13, cursor: 'pointer' }}>
            Remover
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────

function GuideRow({ icon, label, text, color }: { icon: string; label: string; text: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color, marginRight: 6 }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{text}</span>
      </div>
    </div>
  );
}

function ChecklistSection({
  title, color, items, weekId, checkMap, onToggle,
}: {
  title: string; color: string;
  items: { id: string; text: string }[];
  weekId: string;
  checkMap: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const doneHere = items.filter((i) => !!checkMap[`${weekId}-${i.id}`]).length;
  const allDone  = doneHere === items.length && items.length > 0;

  return (
    <div style={{
      background: allDone ? 'rgba(6,78,59,0.08)' : '#111118',
      border: `1px solid ${allDone ? 'rgba(16,185,129,0.2)' : '#1f2937'}`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{title}</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: allDone ? '#4ade80' : '#4b5563' }}>{doneHere}/{items.length}</span>
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map((item) => {
          const done = !!checkMap[`${weekId}-${item.id}`];
          return (
            <button key={item.id} onClick={() => onToggle(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 10, cursor: 'pointer',
                border: 'none', background: done ? 'rgba(6,78,59,0.12)' : 'transparent',
                textAlign: 'left', minHeight: 40, transition: 'background 0.15s',
              }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${done ? color : '#374151'}`,
                background: done ? color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: done ? '#6b7280' : '#d1d5db', textDecoration: done ? 'line-through' : undefined }}>
                {item.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  minWidth: 40, minHeight: 40, background: '#1f2937', color: '#9ca3af',
  border: 'none', borderRadius: 10, fontSize: 20, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
