'use client';

/**
 * Semana.tsx — Parte 2
 *
 * Mudanças desta parte:
 *  - Aba Repas: agora é possível adicionar opções personalizadas por slot
 *  - Opções customizadas guardadas em localStorage ("customMealOptions")
 *  - Botão + no final de cada slot para adicionar nova opção
 *  - Botão × para apagar opções customizadas
 *  - buildTimeline usa as opções customizadas ao montar o subtítulo
 */

import { useState, useMemo } from 'react';
import { useLocalStorage } from './hooks';
import {
  DAYS, DAY_ABBR, TREINO_A, TREINO_B, HOME_WORKOUT, NUTRITION, STUDIES, REDES_FORMATS,
  type Exercise, type SportType, type CalendarEvent,
  getSportType, getGymTreino, hasTherapy, sportIcon,
  getWeekId, getDayDate, formatDate,
} from './data';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

type Tab = 'schedule' | 'nutrition' | 'studies';

/** Um bloco na timeline diária */
interface TimelineItem {
  key: string;
  time: string;
  label: string;
  icon: string;
  subtitle?: string;    // texto secundário (ex: opção de refeição selecionada)
  accent: string;       // cor da borda esquerda
  isMeal?: boolean;     // refeição → estilo verde suave
  isWork?: boolean;     // trabalho → tem botão de edição
}

interface Props {
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  selectedDay: number;
  onDayChange: (day: number) => void;
}

// Tipos mínimos para leitura do plano de redes (partilhado com Redes.tsx)
type RedesPostRef = { formatId: string; time: string };
type AllRedesPlan = Record<string, Partial<Record<number, RedesPostRef>>>;

// ─────────────────────────────────────────────
// Função principal: constrói a timeline do dia
// ─────────────────────────────────────────────

/**
 * buildTimeline — Monta todos os eventos do dia em ordem cronológica,
 * incluindo sport, estudo, terapia, refeições e trabalho.
 *
 * Recebe o tipo de sport do dia, treino A/B, flags de terapia/trabalho,
 * o horário de trabalho editado, as seleções de refeição e as opções
 * customizadas adicionadas pelo utilizador.
 */
function buildTimeline(
  sportType: SportType,
  treino: 'A' | 'B' | null,
  therapy: boolean,
  hasWork: boolean,
  workTime: { start: string; end: string },
  mealSel: Record<string, number>,
  // Opções personalizadas: Record<slotKey, string[]>
  customOptions: Record<string, string[]>,
): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Helper: cria um item de refeição com a opção selecionada já preenchida
  function mealItem(key: string, time: string): TimelineItem {
    const meta: Record<string, { label: string; icon: string }> = {
      breakfast: { label: 'Petit-déjeuner', icon: '🌅' },
      lunch:     { label: 'Déjeuner',       icon: '☀️' },
      snack:     { label: 'Collation',      icon: '🍎' },
      dinner:    { label: 'Dîner',          icon: '🌙' },
      evening:   { label: 'Collation soir', icon: '⭐' },
    };
    const m = meta[key];
    const idx = mealSel[key] ?? 0;

    // Combina opções base + customizadas para determinar o texto da opção selecionada
    const baseOptions = NUTRITION[key]?.options ?? [];
    const custom      = customOptions[key] ?? [];
    const allOptions  = [...baseOptions, ...custom];
    const option      = allOptions[idx] ?? allOptions[0] ?? '';

    return {
      key: `meal_${key}`,
      time,
      label: m.label,
      icon: m.icon,
      subtitle: option,
      accent: '#059669',
      isMeal: true,
    };
  }

  // ── Bloco de manhã: varia com o tipo de sport ──────────────────────────────

  if (sportType === 'jjb_fixed') {
    // Quarta e Sexta: JJB às 07h30 (horário fixo do curso)
    items.push({
      key: 'jjb', time: '07h30 – 08h30',
      label: 'JJB — cours fixe', icon: '🥋',
      subtitle: 'Jiu-Jitsu Brésilien', accent: '#a855f7',
    });
    // Estudo do permis depois do sport (regra: sempre depois)
    items.push({ key: 'permis', time: '08h30 – 09h15', label: 'Étude permis', icon: '📚', accent: '#ef4444' });
    // Pequeno-almoço após o JJB e o estudo
    items.push(mealItem('breakfast', '09h15'));

  } else if (sportType === 'jjb_off') {
    // Dia de folga: JJB em horário livre
    items.push({ key: 'wake', time: '07h30 – 08h00', label: 'Réveil', icon: '☀️', accent: '#6b7280' });
    items.push({
      key: 'jjb', time: 'Matin — horaire libre',
      label: 'JJB — jour de repos', icon: '🥋',
      subtitle: 'Escolhe o créneau', accent: '#a855f7',
    });
    items.push({ key: 'permis', time: 'Após JJB', label: 'Étude permis', icon: '📚', accent: '#ef4444' });
    items.push(mealItem('breakfast', '09h00'));

  } else if (sportType === 'gym') {
    // Dias normais: ginásio das 09h às 10h30
    items.push({ key: 'wake', time: '07h30 – 08h00', label: 'Réveil', icon: '☀️', accent: '#6b7280' });
    items.push({
      key: 'gym', time: '09h00 – 10h30',
      label: `Gym — Treino ${treino}`, icon: '💪',
      subtitle: treino === 'A' ? 'Full Body A' : 'Full Body B', accent: '#3b82f6',
    });

    // Nos dias de terapia (Ter/Qui), a ordem muda:
    // ginásio → terapia → permis → pequeno-almoço
    if (therapy) {
      items.push({ key: 'therapy', time: '10h45 – 11h45', label: 'Thérapie', icon: '🧠', accent: '#ec4899' });
      items.push({ key: 'permis', time: '11h45 – 12h15', label: 'Étude permis', icon: '📚', accent: '#ef4444' });
      items.push(mealItem('breakfast', '12h15'));
    } else {
      // Sem terapia: permis logo após o ginásio, depois pequeno-almoço
      items.push({ key: 'permis', time: '10h30 – 11h30', label: 'Étude permis', icon: '📚', accent: '#ef4444' });
      items.push(mealItem('breakfast', '11h30'));
    }

  } else {
    // Domingo: home workout opcional
    items.push({ key: 'wake', time: '07h30 – 08h00', label: 'Réveil', icon: '☀️', accent: '#6b7280' });
    items.push(mealItem('breakfast', '08h30'));
    items.push({
      key: 'home', time: '09h00 – 10h00',
      label: 'Home workout (optionnel)', icon: '🏠',
      subtitle: 'Apoio · Agachamento · Prancha', accent: '#14b8a6',
    });
    items.push({ key: 'permis', time: 'Après workout', label: 'Étude permis', icon: '📚', accent: '#ef4444' });
  }

  // ── Almoço: sempre às 12h30 (antes do trabalho das 13h15) ─────────────────
  items.push(mealItem('lunch', '12h30'));

  // ── Bloco de tarde/noite: trabalho ou descanso ─────────────────────────────
  if (hasWork) {
    // Dia de trabalho: exibe o horário (editável via botão ✏️)
    const start = workTime.start.replace(':', 'h');
    const end   = workTime.end.replace(':', 'h');
    items.push({
      key: 'work', time: `${start} – ${end}`,
      label: 'Travail — Grand Frais', icon: '🛒',
      accent: '#f59e0b', isWork: true,
    });
    // Lanche durante o trabalho (~meio do turno)
    items.push(mealItem('snack', '16h00'));
    // Jantar depois do trabalho
    items.push(mealItem('dinner', '20h30'));
  } else {
    // Dia de folga
    items.push({
      key: 'rest', time: 'Journée entière',
      label: 'Jour de repos', icon: '🌿',
      subtitle: 'Repos & récupération', accent: '#10b981',
    });
    // Horários de refeição ajustados para dia sem trabalho
    items.push(mealItem('snack', '15h00'));
    items.push(mealItem('dinner', '19h30'));
  }

  // Lanche da noite — sempre
  items.push(mealItem('evening', '22h00'));

  return items;
}

// ─────────────────────────────────────────────
// Função: plano automático de estudos
// ─────────────────────────────────────────────

/**
 * computeStudySchedule — Calcula quais estudos são sugeridos para cada dia.
 *
 * Lógica:
 *  1. Conta quantas vezes cada estudo foi feito esta semana
 *  2. Calcula o que ainda falta (quota - feito)
 *  3. Distribui as sessões restantes pelos dias futuros (sem sobrecarregar)
 *
 * Retorna: Record<dayIndex, string[]> — estudos sugeridos por dia
 */
function computeStudySchedule(
  weekId: string,
  studiesDone: Record<string, string[]>,
  todayIndex: number,
  isCurrentWeek: boolean,
): Record<number, string[]> {
  // Passo 1: contar o que foi feito esta semana
  const doneCounts: Record<string, number> = {};
  for (let d = 0; d < 7; d++) {
    const k = `${weekId}-${d}`;
    (studiesDone[k] ?? []).forEach((id) => {
      doneCounts[id] = (doneCounts[id] ?? 0) + 1;
    });
  }

  // Quota semanal de cada estudo
  const quotas: Record<string, number> = { permis: 7, sites: 3, prog: 2, brand: 1 };

  // Para a semana atual planeia a partir de hoje; para outras semanas, desde segunda
  const startDay = isCurrentWeek ? todayIndex : 0;
  const schedule: Record<number, string[]> = {};

  for (const study of STUDIES) {
    const quota   = quotas[study.id] ?? 0;
    const done    = doneCounts[study.id] ?? 0;
    let remaining = Math.max(0, quota - done);

    // Branding só vai ao domingo (índice 6)
    if (study.id === 'brand') {
      if (remaining > 0) schedule[6] = [...(schedule[6] ?? []), study.id];
      continue;
    }

    // Distribui as sessões restantes pelos dias disponíveis
    for (let d = startDay; d < 7 && remaining > 0; d++) {
      const k = `${weekId}-${d}`;
      // Salta dias onde este estudo já foi feito
      if ((studiesDone[k] ?? []).includes(study.id)) continue;
      schedule[d] = [...(schedule[d] ?? []), study.id];
      remaining--;
    }
  }

  return schedule;
}

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function Semana({ weekOffset, onWeekChange, selectedDay, onDayChange }: Props) {
  // ── Identificação da semana ────────────────────────────────────────────────
  const weekId      = getWeekId(weekOffset);   // ex: "2025-05-19"
  const today       = new Date();
  const todayIndex  = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0=Seg…6=Dom
  const isCurrentWeek = weekOffset === 0;

  // ── Estado global persistido (localStorage) ───────────────────────────────
  const [dayOffIndex, setDayOffIndex] = useLocalStorage('dayOff', 5);     // sábado padrão
  const [startWithA, setStartWithA]   = useLocalStorage('startWithA', true); // começa com Treino A

  // Estado por dia, indexado por "weekId-dayIndex"
  const [exerciseChecks, setExerciseChecks] = useLocalStorage<Record<string, boolean[][]>>('exerciseChecks', {});
  const [sportDone,  setSportDone]   = useLocalStorage<Record<string, boolean>>('sportDone', {});
  const [studiesDone, setStudiesDone] = useLocalStorage<Record<string, string[]>>('studiesDone', {});
  const [mealSelections, setMealSelections] = useLocalStorage<Record<string, Record<string, number>>>('mealSelections', {});
  const [workHours, setWorkHours]     = useLocalStorage<Record<string, { start: string; end: string }>>('workHours', {});

  // Opções de refeição personalizadas: { breakfast: ["Minha opção", ...], ... }
  const [customMealOptions, setCustomMealOptions] = useLocalStorage<Record<string, string[]>>('customMealOptions', {});

  // Eventos do calendário (partilhados com Calendario.tsx via mesma chave localStorage)
  const [calendarEvents] = useLocalStorage<CalendarEvent[]>('calendarEvents', []);

  // Plano de redes (partilhado com Redes.tsx via mesma chave localStorage)
  const [allRedesPlan] = useLocalStorage<AllRedesPlan>('redesPlan', {});

  // ── Estado local (UI) ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab]     = useState<Tab>('schedule');
  const [editingWork, setEditingWork] = useState(false);
  const [workEditStart, setWorkEditStart] = useState('13:15');
  const [workEditEnd,   setWorkEditEnd]   = useState('20:15');

  // Estado do formulário "adicionar opção de refeição"
  // addingMeal = qual slot está a ser editado (ex: "breakfast"), ou null
  const [addingMeal, setAddingMeal]   = useState<string | null>(null);
  const [newMealText, setNewMealText] = useState('');

  // ── Dados do dia selecionado ───────────────────────────────────────────────

  // Chave única para persistência deste dia nesta semana
  const dayKey = `${weekId}-${selectedDay}`;

  const sportType: SportType = getSportType(selectedDay, dayOffIndex);
  const treino   = sportType === 'gym' ? getGymTreino(selectedDay, dayOffIndex, startWithA) : null;
  const therapy  = hasTherapy(selectedDay);
  const hasWork  = selectedDay !== dayOffIndex;
  const workTime = workHours[dayKey] ?? { start: '13:15', end: '20:15' };

  // Lista de exercícios do dia (null = sem treino de ginásio/casa)
  const exerciseList: Exercise[] | null =
    sportType === 'gym'  ? (treino === 'A' ? TREINO_A : TREINO_B) :
    sportType === 'home' ? HOME_WORKOUT : null;

  // ── Helpers de estado ──────────────────────────────────────────────────────

  /** Retorna os checks de um exercício específico do dia selecionado */
  function getChecks(exIdx: number): boolean[] {
    // Se não há dados guardados, retorna array de `false` com o tamanho certo
    return exerciseChecks[dayKey]?.[exIdx] ?? Array(exerciseList![exIdx].sets).fill(false);
  }

  /** Inverte o estado de uma série específica (ex: 3ª série do Supino) */
  function toggleSet(exIdx: number, setIdx: number) {
    // Cria uma cópia profunda dos checks atuais
    const current: boolean[][] =
      exerciseChecks[dayKey] ?? exerciseList!.map((ex) => Array(ex.sets).fill(false));
    const updated = current.map((row, i) =>
      i === exIdx ? row.map((v, j) => (j === setIdx ? !v : v)) : [...row],
    );
    setExerciseChecks((prev) => ({ ...prev, [dayKey]: updated }));
  }

  function toggleSport() {
    setSportDone((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));
  }

  function toggleStudy(id: string) {
    setStudiesDone((prev) => {
      const current = prev[dayKey] ?? [];
      const updated = current.includes(id)
        ? current.filter((s) => s !== id)
        : [...current, id];
      return { ...prev, [dayKey]: updated };
    });
  }

  function setMeal(meal: string, idx: number) {
    setMealSelections((prev) => ({
      ...prev,
      [dayKey]: { ...(prev[dayKey] ?? {}), [meal]: idx },
    }));
  }

  /** Adiciona uma nova opção customizada a um slot de refeição */
  function addCustomOption(mealKey: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setCustomMealOptions((prev) => ({
      ...prev,
      [mealKey]: [...(prev[mealKey] ?? []), trimmed],
    }));
  }

  /** Remove uma opção customizada pelo seu índice dentro do array custom */
  function removeCustomOption(mealKey: string, customIdx: number) {
    setCustomMealOptions((prev) => {
      const updated = [...(prev[mealKey] ?? [])];
      updated.splice(customIdx, 1);
      return { ...prev, [mealKey]: updated };
    });
    // Se a opção apagada estava selecionada, volta ao índice 0
    const baseLen = NUTRITION[mealKey]?.options.length ?? 0;
    const selectedIdx = mealSel[mealKey] ?? 0;
    if (selectedIdx === baseLen + customIdx) {
      setMeal(mealKey, 0);
    }
  }

  function saveWorkHours() {
    setWorkHours((prev) => ({ ...prev, [dayKey]: { start: workEditStart, end: workEditEnd } }));
    setEditingWork(false);
  }

  // ── Stats semanais ─────────────────────────────────────────────────────────

  /**
   * useMemo → só recalcula quando weekId, dayOffIndex, sportDone ou studiesDone mudam.
   * Evita recalcular a cada render.
   */
  const weekStats = useMemo(() => {
    let gymDone = 0, gymTotal = 0;
    let jjbDone = 0, jjbTotal = 0;
    let permisDays = 0;

    for (let d = 0; d < 7; d++) {
      const sport = getSportType(d, dayOffIndex);
      const k = `${weekId}-${d}`;
      if (sport === 'gym')                        { gymTotal++; if (sportDone[k]) gymDone++; }
      else if (sport === 'jjb_fixed' || sport === 'jjb_off') { jjbTotal++; if (sportDone[k]) jjbDone++; }
      if ((studiesDone[k] ?? []).includes('permis')) permisDays++;
    }

    return { gymDone, gymTotal, jjbDone, jjbTotal, permisDays };
  }, [weekId, dayOffIndex, sportDone, studiesDone]);

  /**
   * studySchedule — plano sugerido para toda a semana.
   * Ex: { 0: ['permis','sites'], 1: ['permis'], 2: ['permis','prog'], ... }
   * Recalcula quando algum estudo é marcado feito.
   */
  const studySchedule = useMemo(
    () => computeStudySchedule(weekId, studiesDone, todayIndex, isCurrentWeek),
    [weekId, studiesDone, todayIndex, isCurrentWeek],
  );

  /**
   * weekStudyCounts — quantas vezes cada estudo foi feito esta semana.
   * Usado para mostrar o progresso "X/Y cette semaine".
   */
  const weekStudyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (let d = 0; d < 7; d++) {
      const k = `${weekId}-${d}`;
      (studiesDone[k] ?? []).forEach((id) => {
        counts[id] = (counts[id] ?? 0) + 1;
      });
    }
    return counts;
  }, [weekId, studiesDone]);

  // ── Dados auxiliares ───────────────────────────────────────────────────────

  // Datas reais de cada dia desta semana (para exibir o número do dia)
  const weekDates = Array.from({ length: 7 }, (_, i) => getDayDate(weekOffset, i));

  // Seleções de refeição do dia atual
  const mealSel    = mealSelections[dayKey] ?? {};
  // Estudos marcados como feitos hoje
  const studiesSel = studiesDone[dayKey] ?? [];

  // Timeline completa do dia (sport + refeições + trabalho)
  const timeline = buildTimeline(sportType, treino, therapy, hasWork, workTime, mealSel, customMealOptions);

  // Eventos do calendário para o dia selecionado
  // Converte a data do dia para "YYYY-MM-DD" e filtra
  const selectedDate = weekDates[selectedDay];
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const dayCalendarEvents = calendarEvents
    .filter((e) => e.date === selectedDateStr)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

  // Post de redes planeado para este dia (se existir)
  const weekRedesPlan = allRedesPlan[weekId] ?? {};
  const dayRedesPost  = weekRedesPlan[selectedDay];
  const dayRedesFormat = dayRedesPost
    ? (REDES_FORMATS.find((f) => f.id === dayRedesPost.formatId) ?? null)
    : null;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div>

      {/* ── HEADER FIXO ────────────────────────────────────────────────────── */}
      <div style={{ background: '#111118', borderBottom: '1px solid #1f2937', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '12px 16px 10px' }}>

          {/* Navegação entre semanas */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <NavBtn onClick={() => onWeekChange(weekOffset - 1)}>‹</NavBtn>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {isCurrentWeek
                  ? 'Cette semaine'
                  : `${formatDate(weekDates[0])} – ${formatDate(weekDates[6])}`}
              </div>
              {!isCurrentWeek && (
                <button onClick={() => onWeekChange(0)}
                  style={{ fontSize: 11, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2 }}>
                  ↩ Aujourd&apos;hui
                </button>
              )}
            </div>
            <NavBtn onClick={() => onWeekChange(weekOffset + 1)}>›</NavBtn>
          </div>

          {/* Seletor de dia de folga */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>Repos :</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {DAY_ABBR.map((abbr, i) => (
                <button key={i} onClick={() => setDayOffIndex(i)}
                  style={{
                    height: 28, padding: '0 8px', borderRadius: 7,
                    fontSize: 10, fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: dayOffIndex === i ? '#059669' : '#1f2937',
                    color:      dayOffIndex === i ? '#fff'    : '#6b7280',
                  }}>
                  {abbr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── GRID DE DIAS ───────────────────────────────────────────────────── */}
      <div style={{ background: '#111118', borderBottom: '1px solid #1f2937', padding: '10px 12px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {DAYS.map((_, i) => {
            const sport     = getSportType(i, dayOffIndex);
            const isSelected = selectedDay === i;
            const isToday    = isCurrentWeek && i === todayIndex;
            const isDone     = !!sportDone[`${weekId}-${i}`];

            return (
              <button key={i} onClick={() => onDayChange(i)}
                style={{
                  position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '8px 2px', borderRadius: 14, border: 'none',
                  cursor: 'pointer', minHeight: 62,
                  background: isSelected ? '#2563eb' : 'rgba(31,41,55,0.7)',
                  color: isSelected ? '#fff' : '#9ca3af',
                  // Sombra azul suave no dia selecionado
                  boxShadow: isSelected ? '0 4px 20px rgba(37,99,235,0.3)' : undefined,
                }}>

                {/* Ponto azul = hoje */}
                {isToday && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: '#93c5fd' }} />
                )}

                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em' }}>{DAY_ABBR[i]}</span>
                <span style={{ fontSize: 11, color: isSelected ? '#bfdbfe' : '#4b5563', marginTop: 1 }}>{weekDates[i].getDate()}</span>
                <span style={{ fontSize: 16, marginTop: 2 }}>{sportIcon(sport)}</span>

                {/* Check verde se o treino foi marcado como feito */}
                {isDone && <span style={{ fontSize: 9, color: '#4ade80', marginTop: 1, fontWeight: 900 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ABAS ────────────────────────────────────────────────────────────── */}
      <div style={{ background: '#111118', borderBottom: '1px solid #1f2937' }}>
        <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex' }}>
          {(['schedule', 'nutrition', 'studies'] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, height: 44,
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                border: 'none', background: 'none', cursor: 'pointer',
                color: activeTab === tab ? '#60a5fa' : '#6b7280',
                borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
              }}>
              {tab === 'schedule' ? '📅 Planning' : tab === 'nutrition' ? '🥗 Repas' : '📚 Études'}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTEÚDO ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '16px 16px 32px' }}>

        {/* ════════════════════════════════════════
            ABA: PLANNING
            ════════════════════════════════════════ */}
        {activeTab === 'schedule' && (
          <div>

            {/* Cabeçalho do dia */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {DAYS[selectedDay]}
                  <span style={{ fontSize: 13, fontWeight: 400, color: '#6b7280', marginLeft: 8 }}>
                    {formatDate(weekDates[selectedDay])}
                  </span>
                </h2>
                {therapy && (
                  <div style={{ fontSize: 12, color: '#ec4899', marginTop: 4 }}>🧠 Thérapie 10h45</div>
                )}
              </div>

              {/* Botão de alternância Treino A/B — só aparece em dias de ginásio */}
              <div style={{ display: 'flex', gap: 8 }}>
                {sportType === 'gym' && (
                  <SmallBtn onClick={() => setStartWithA(!startWithA)} color="#60a5fa">
                    Treino {startWithA ? 'A' : 'B'}
                  </SmallBtn>
                )}
                {/* Botão para marcar o treino do dia como feito */}
                {exerciseList && (
                  <SmallBtn
                    onClick={toggleSport}
                    color={sportDone[dayKey] ? '#4ade80' : '#6b7280'}
                    active={!!sportDone[dayKey]}>
                    {sportDone[dayKey] ? '✓ Feito' : 'Marcar'}
                  </SmallBtn>
                )}
              </div>
            </div>

            {/* ── TIMELINE ─────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {timeline.map((item) => (
                <div key={item.key}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    // Refeições têm fundo verde muito suave; os outros têm o fundo padrão
                    background: item.isMeal ? 'rgba(5,46,22,0.25)' : '#111118',
                    borderLeft: `3px solid ${item.accent}`,
                    borderRadius: 12,
                    padding: '10px 14px',
                  }}>

                  {/* Ícone do evento */}
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Hora */}
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 2 }}>
                      {item.time}
                    </div>
                    {/* Título */}
                    <div style={{ fontSize: 14, fontWeight: 600, color: item.isMeal ? '#a7f3d0' : '#f3f4f6' }}>
                      {item.label}
                    </div>
                    {/* Subtítulo — para refeições mostra a opção selecionada; para outros mostra descrição */}
                    {item.subtitle && (
                      <div style={{
                        fontSize: 12,
                        color: item.isMeal ? '#6ee7b7' : '#9ca3af',
                        marginTop: 2,
                        // Evita que texto longo quebre o layout
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Botão de edição do horário de trabalho */}
                  {item.isWork && hasWork && !editingWork && (
                    <button
                      onClick={() => { setWorkEditStart(workTime.start); setWorkEditEnd(workTime.end); setEditingWork(true); }}
                      style={{ width: 36, height: 36, borderRadius: 9, background: '#1f2937', border: 'none', fontSize: 14, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      ✏️
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* ── EVENTOS DO CALENDÁRIO ────────────────────────────
                Mostra os eventos criados no Calendário que coincidem
                com o dia selecionado (À faire ou Rendez-vous).
            ─────────────────────────────────────────────────── */}
            {dayCalendarEvents.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionLabel title="Événements du jour" right={`${dayCalendarEvents.length}`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayCalendarEvents.map((ev) => {
                    const color = ev.type === 'rdv' ? '#3b82f6' : '#f59e0b';
                    const icon  = ev.type === 'rdv' ? '📅' : '✅';
                    return (
                      <div key={ev.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px', borderRadius: 12,
                          background: '#111118', borderLeft: `3px solid ${color}`,
                        }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.title}
                          </div>
                          {ev.time && (
                            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                              {ev.time.replace(':', 'h')}
                            </div>
                          )}
                        </div>
                        {/* Badge de tipo */}
                        <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '15', padding: '2px 8px', borderRadius: 6, flexShrink: 0 }}>
                          {ev.type === 'rdv' ? 'RDV' : 'À faire'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── POST DE REDES PLANEADO ───────────────────────────
                Cartão de previsão: aparece quando há um post de redes
                agendado para este dia na aba Redes.
            ─────────────────────────────────────────────────── */}
            {dayRedesPost && dayRedesFormat && (
              <div style={{ marginBottom: 20 }}>
                <SectionLabel title="📸 Redes sociais" right="Previsto" />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12,
                  background: '#111118',
                  border: `1px solid ${dayRedesFormat.color}25`,
                  borderLeft: `3px solid ${dayRedesFormat.color}`,
                }}>
                  {/* Ícone do formato */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: dayRedesFormat.color + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: dayRedesFormat.color }}>
                      {dayRedesFormat.code}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dayRedesFormat.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      🕐 {dayRedesPost.time.replace(':', 'h')} · Instagram · {dayRedesFormat.duration}
                    </div>
                  </div>
                  {/* Badge de hora */}
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: dayRedesFormat.color,
                    background: dayRedesFormat.color + '15',
                    padding: '4px 10px', borderRadius: 8, flexShrink: 0,
                  }}>
                    {dayRedesPost.time.replace(':', 'h')}
                  </span>
                </div>
              </div>
            )}

            {/* ── EDITOR DE HORÁRIO DE TRABALHO ────────────────── */}
            {editingWork && hasWork && (
              <div style={{ background: '#111118', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 10 }}>
                  ✏️ Éditer horaire travail
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="time" value={workEditStart} onChange={(e) => setWorkEditStart(e.target.value)}
                    style={timeInputStyle} />
                  <span style={{ color: '#6b7280' }}>–</span>
                  <input type="time" value={workEditEnd} onChange={(e) => setWorkEditEnd(e.target.value)}
                    style={timeInputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={saveWorkHours} style={{ flex: 1, height: 44, borderRadius: 10, background: '#059669', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    Sauvegarder
                  </button>
                  <button onClick={() => setEditingWork(false)} style={{ height: 44, padding: '0 16px', borderRadius: 10, background: '#1f2937', border: 'none', color: '#9ca3af', fontSize: 14, cursor: 'pointer' }}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {/* ── CHECKLIST DE SÉRIES ───────────────────────────── */}
            {exerciseList && (
              <div style={{ marginBottom: 24 }}>
                <SectionLabel title={sportType === 'gym' ? `Treino ${treino} — Full Body` : 'Home Workout'} right={`${exerciseList.length} exercices`} />
                <div style={{ background: '#111118', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden' }}>
                  {exerciseList.map((ex, exIdx) => {
                    const checks    = getChecks(exIdx);
                    const doneSets  = checks.filter(Boolean).length;
                    const allDone   = doneSets === ex.sets;

                    return (
                      <div key={exIdx}
                        style={{
                          padding: '12px 14px',
                          borderBottom: exIdx < exerciseList.length - 1 ? '1px solid #1f2937' : undefined,
                          // Fundo verde subtil quando todas as séries estão feitas
                          background: allDone ? 'rgba(6,78,59,0.15)' : undefined,
                          transition: 'background 0.3s',
                        }}>

                        {/* Linha do nome + contador */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 11, width: 18, textAlign: 'center', fontFamily: 'monospace', color: '#4b5563' }}>
                              {exIdx + 1}
                            </span>
                            <span style={{ fontSize: 14, color: allDone ? '#6ee7b7' : '#e5e7eb', fontWeight: 500 }}>
                              {ex.name}
                            </span>
                            {allDone && <span style={{ fontSize: 13, color: '#4ade80' }}>✓</span>}
                          </div>
                          {/* Badge "séries feitas / total × reps" */}
                          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa', background: 'rgba(37,99,235,0.15)', padding: '2px 8px', borderRadius: 6 }}>
                            {doneSets}/{ex.sets}×{ex.reps}
                          </span>
                        </div>

                        {/* Botões de série — um por set */}
                        <div style={{ display: 'flex', gap: 8, paddingLeft: 26 }}>
                          {Array.from({ length: ex.sets }, (_, setIdx) => {
                            const done = checks[setIdx] ?? false;
                            return (
                              <button key={setIdx} onClick={() => toggleSet(exIdx, setIdx)}
                                style={{
                                  width: 36, height: 36, borderRadius: 9,
                                  border: `1px solid ${done ? '#10b981' : '#374151'}`,
                                  background: done ? '#059669' : '#1a2235',
                                  color: done ? '#fff' : '#6b7280',
                                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}>
                                {/* Mostra ✓ quando feito, ou o número da série */}
                                {done ? '✓' : setIdx + 1}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STATS DA SEMANA ───────────────────────────────── */}
            <div style={{ background: '#111118', border: '1px solid #1f2937', borderRadius: 14, padding: 16 }}>
              <SectionLabel title="Stats da semana" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
                <StatBar label="Gym 💪"    done={weekStats.gymDone}   total={weekStats.gymTotal}   color="#3b82f6" />
                <StatBar label="JJB 🥋"    done={weekStats.jjbDone}   total={weekStats.jjbTotal}   color="#a855f7" />
                <StatBar label="Permis 📚" done={weekStats.permisDays} total={7}                   color="#ef4444" />
              </div>
            </div>

          </div>
        )}

        {/* ════════════════════════════════════════
            ABA: REPAS (Nutrição detalhada)
            ════════════════════════════════════════ */}
        {activeTab === 'nutrition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Repas</h2>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{DAYS[selectedDay]}</span>
            </div>

            {Object.entries(NUTRITION).map(([key, meal]) => {
              // Opções customizadas para este slot (ex: "breakfast")
              const custom   = customMealOptions[key] ?? [];
              // Índice global da opção selecionada (base + custom combinados)
              const selIdx   = mealSel[key] ?? 0;
              const baseLen  = meal.options.length;
              // true se o formulário de adicionar está aberto neste slot
              const isAdding = addingMeal === key;

              return (
                <div key={key} style={{ background: '#111118', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden' }}>

                  {/* Cabeçalho do slot */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb' }}>{meal.label}</span>
                    <span style={{ fontSize: 10, color: '#4b5563' }}>{baseLen + custom.length} opções</span>
                  </div>

                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>

                    {/* ── Opções base (não apagáveis) ────────── */}
                    {meal.options.map((opt, i) => {
                      const isSel = selIdx === i;
                      return (
                        <button key={i} onClick={() => setMeal(key, i)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
                            textAlign: 'left', minHeight: 44,
                            border: `1px solid ${isSel ? 'rgba(16,185,129,0.4)' : 'transparent'}`,
                            background: isSel ? 'rgba(6,78,59,0.2)' : 'rgba(31,41,55,0.5)',
                          }}>
                          {/* Círculo indicador de seleção */}
                          <span style={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                            border: `2px solid ${isSel ? '#10b981' : '#4b5563'}`,
                            background: isSel ? '#10b981' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, color: '#fff',
                          }}>
                            {isSel ? '✓' : ''}
                          </span>
                          <span style={{ fontSize: 13, color: isSel ? '#6ee7b7' : '#9ca3af' }}>{opt}</span>
                        </button>
                      );
                    })}

                    {/* ── Opções customizadas (apagáveis com ×) ── */}
                    {custom.map((opt, ci) => {
                      // O índice global desta opção custom é baseLen + ci
                      const globalIdx = baseLen + ci;
                      const isSel     = selIdx === globalIdx;
                      return (
                        <div key={`custom-${ci}`} style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
                          {/* Botão de seleção da opção customizada */}
                          <button onClick={() => setMeal(key, globalIdx)}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'flex-start', gap: 10,
                              padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
                              textAlign: 'left', minHeight: 44,
                              border: `1px solid ${isSel ? 'rgba(251,191,36,0.4)' : 'rgba(251,191,36,0.1)'}`,
                              background: isSel ? 'rgba(120,53,15,0.2)' : 'rgba(120,53,15,0.08)',
                            }}>
                            <span style={{
                              width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                              border: `2px solid ${isSel ? '#f59e0b' : '#78350f'}`,
                              background: isSel ? '#f59e0b' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, color: '#fff',
                            }}>
                              {isSel ? '✓' : ''}
                            </span>
                            {/* Cor âmbar para distinguir opções customizadas das base */}
                            <span style={{ fontSize: 13, color: isSel ? '#fcd34d' : '#92400e' }}>{opt}</span>
                          </button>

                          {/* Botão × para apagar esta opção customizada */}
                          <button
                            onClick={() => removeCustomOption(key, ci)}
                            style={{
                              width: 36, borderRadius: 10, border: 'none', background: 'rgba(127,29,29,0.2)',
                              color: '#f87171', fontSize: 14, cursor: 'pointer', flexShrink: 0,
                            }}>
                            ×
                          </button>
                        </div>
                      );
                    })}

                    {/* ── Formulário: adicionar nova opção ──────── */}
                    {isAdding ? (
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Nova opção..."
                          value={newMealText}
                          onChange={(e) => setNewMealText(e.target.value)}
                          // Permite confirmar com Enter
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addCustomOption(key, newMealText);
                              setNewMealText('');
                              setAddingMeal(null);
                            } else if (e.key === 'Escape') {
                              setAddingMeal(null);
                              setNewMealText('');
                            }
                          }}
                          style={{
                            flex: 1, padding: '10px 12px', borderRadius: 10,
                            background: '#1f2937', color: '#fff',
                            border: '1px solid #374151', fontSize: 13, outline: 'none',
                          }}
                        />
                        {/* Confirmar */}
                        <button
                          onClick={() => {
                            addCustomOption(key, newMealText);
                            setNewMealText('');
                            setAddingMeal(null);
                          }}
                          style={{
                            padding: '0 14px', borderRadius: 10, border: 'none',
                            background: '#059669', color: '#fff', fontWeight: 700,
                            fontSize: 13, cursor: 'pointer',
                          }}>
                          OK
                        </button>
                        {/* Cancelar */}
                        <button
                          onClick={() => { setAddingMeal(null); setNewMealText(''); }}
                          style={{
                            padding: '0 12px', borderRadius: 10, border: 'none',
                            background: '#1f2937', color: '#6b7280',
                            fontSize: 13, cursor: 'pointer',
                          }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      /* Botão + para abrir o formulário */
                      <button
                        onClick={() => { setAddingMeal(key); setNewMealText(''); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                          border: '1px dashed #374151', background: 'transparent',
                          color: '#4b5563', fontSize: 12, fontWeight: 600,
                          marginTop: 2,
                        }}>
                        <span style={{ fontSize: 16, lineHeight: 1, color: '#6b7280' }}>+</span>
                        Ajouter une option
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════
            ABA: ÉTUDES
            ════════════════════════════════════════ */}
        {activeTab === 'studies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Études</h2>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{DAYS[selectedDay]}</span>
            </div>

            {/* ══════════════════════════════════════════════════════
                SECÇÃO 1 — "O que estudei hoje"
                O utilizador regista aqui o que fez neste dia.
                Só depois de registar é que o plano da semana
                atualiza com as sugestões para os dias restantes.
            ══════════════════════════════════════════════════════ */}
            <div style={{ background: '#111118', border: '1px solid #1f2937', borderRadius: 14, overflow: 'hidden' }}>
              {/* Cabeçalho da secção de log */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>
                  📝 O que estudei hoje
                </span>
                {/* Contador: quantos foram registados */}
                <span style={{ fontSize: 11, color: studiesSel.length > 0 ? '#4ade80' : '#4b5563', fontWeight: 600 }}>
                  {studiesSel.length} registado{studiesSel.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Cards de cada estudo — toque para registar/cancelar */}
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STUDIES.map((study) => {
                  const isDone     = studiesSel.includes(study.id);
                  // Branding só disponível ao domingo
                  const isDisabled = study.id === 'brand' && selectedDay !== 6;
                  // Quota semanal e progresso
                  const quotas: Record<string, number> = { permis: 7, sites: 3, prog: 2, brand: 1 };
                  const quota      = quotas[study.id] ?? 0;
                  const weekCount  = weekStudyCounts[study.id] ?? 0;
                  const isComplete = weekCount >= quota;

                  return (
                    <button key={study.id} disabled={isDisabled}
                      onClick={() => !isDisabled && toggleStudy(study.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 12, textAlign: 'left',
                        // Feito = fundo verde suave; por fazer = fundo cinza
                        border: `1px solid ${isDone ? study.color + '40' : '#1f2937'}`,
                        background: isDone ? study.color + '12' : 'rgba(31,41,55,0.4)',
                        opacity: isDisabled ? 0.3 : 1,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        minHeight: 52, transition: 'all 0.15s',
                      }}>

                      {/* Círculo de estado */}
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isDone ? 'transparent' : '#374151'}`,
                        background: isDone ? study.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isDone && <span style={{ color: '#fff', fontSize: 12, fontWeight: 900 }}>✓</span>}
                      </div>

                      {/* Nome + detalhe */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600,
                          color: isDone ? study.color : '#d1d5db',
                        }}>
                          {study.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                          {study.freq}
                        </div>
                      </div>

                      {/* Direita: progresso semanal + prioridade */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: study.color, background: '#1a2235', padding: '2px 7px', borderRadius: 6 }}>
                          P{study.priority}
                        </span>
                        <span style={{ fontSize: 10, color: isComplete ? '#4ade80' : '#4b5563', fontWeight: 600 }}>
                          {weekCount}/{quota} sem.
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                SECÇÃO 2 — "Plano da semana"
                Gerado AUTOMATICAMENTE com base no que foi registado.
                Mostra o que falta fazer nos dias restantes.
            ══════════════════════════════════════════════════════ */}
            <div style={{ background: '#111118', border: '1px solid #1f2937', borderRadius: 14, padding: 14 }}>
              {/* Título + explicação */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#6b7280', marginBottom: 4 }}>
                  Plano da semana
                </div>
                <div style={{ fontSize: 11, color: '#4b5563' }}>
                  Actualizado com base no que registaste · toca num dia para editar
                </div>
              </div>

              {/* Mini calendário com pontos por estudo sugerido */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {Array.from({ length: 7 }, (_, d) => {
                  const isSel     = d === selectedDay;
                  const isToday   = isCurrentWeek && d === todayIndex;
                  const scheduled = studySchedule[d] ?? [];
                  const k         = `${weekId}-${d}`;
                  const dayDone   = studiesDone[k] ?? [];
                  const allDone   = scheduled.length > 0 && scheduled.every((id) => dayDone.includes(id));

                  return (
                    <button key={d} onClick={() => onDayChange(d)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                        padding: '8px 3px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: isSel ? '#2563eb' : isToday ? 'rgba(37,99,235,0.12)' : 'transparent',
                      }}>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', color: isSel ? '#fff' : '#6b7280' }}>
                        {DAY_ABBR[d]}
                      </span>
                      <span style={{ fontSize: 11, color: isSel ? '#bfdbfe' : '#4b5563' }}>
                        {weekDates[d].getDate()}
                      </span>
                      {/* Ponto por estudo: cheio = feito, contorno = por fazer */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', minHeight: 10 }}>
                        {scheduled.map((id) => {
                          const s      = STUDIES.find((x) => x.id === id)!;
                          const isDone = dayDone.includes(id);
                          return (
                            <span key={id} style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: isDone ? s.color : 'transparent',
                              border: `1.5px solid ${s.color}`,
                              opacity: isDone ? 0.9 : 0.5,
                            }} />
                          );
                        })}
                      </div>
                      {allDone && <span style={{ fontSize: 8, color: '#4ade80', fontWeight: 900 }}>✓</span>}
                    </button>
                  );
                })}
              </div>

              {/* Legenda dos estudos */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {STUDIES.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{s.label.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso de prioridade do permis */}
            <div style={{ background: 'rgba(69,10,10,0.2)', border: '1px solid rgba(127,29,29,0.25)', borderRadius: 14, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>📚</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f87171' }}>Rappel — Permis</span>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                Étudier <strong style={{ color: '#d1d5db' }}>chaque jour après le sport</strong>. Priorité absolue.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-componentes reutilizáveis
// (extraídos para manter o render principal limpo)
// ─────────────────────────────────────────────

/** Botão de navegação (‹ ›) */
function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      style={{ minWidth: 44, minHeight: 44, background: '#1f2937', color: '#9ca3af', border: 'none', borderRadius: 10, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  );
}

/** Botão pequeno de ação (Treino A/B, Marcar feito) */
function SmallBtn({ onClick, children, color, active }: { onClick: () => void; children: React.ReactNode; color: string; active?: boolean }) {
  return (
    <button onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 9,
        border: `1px solid ${active ? color + '60' : '#374151'}`,
        background: active ? color + '20' : '#1a2235',
        color, fontWeight: 700, fontSize: 12, cursor: 'pointer',
        minHeight: 36,
      }}>
      {children}
    </button>
  );
}

/** Label de secção (título pequeno maiúsculo + texto direita) */
function SectionLabel({ title, right }: { title: string; right?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#6b7280' }}>
        {title}
      </span>
      {right && <span style={{ fontSize: 11, color: '#4b5563' }}>{right}</span>}
    </div>
  );
}

/** Barra de progresso com label e contador */
function StatBar({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min((done / total) * 100, 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{done}/{total}</span>
      </div>
      <div style={{ height: 5, borderRadius: 4, background: '#1f2937' }}>
        <div style={{ height: '100%', borderRadius: 4, background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// Estilo partilhado para inputs de hora
const timeInputStyle: React.CSSProperties = {
  flex: 1, padding: '10px 12px', borderRadius: 9,
  background: '#1f2937', color: '#fff',
  border: '1px solid #374151', fontSize: 15,
  outline: 'none',
};
