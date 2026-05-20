'use client';

import { useState, useMemo } from 'react';
import { useLocalStorage } from './hooks';
import {
  DAYS, DAY_ABBR, TREINO_A, TREINO_B, HOME_WORKOUT, NUTRITION, STUDIES,
  type Exercise, type SportType,
  getSportType, getGymTreino, hasTherapy, sportIcon,
  getWeekId, getDayDate, formatDate,
} from './data';

type Tab = 'schedule' | 'nutrition' | 'studies';

interface Props {
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  selectedDay: number;
  onDayChange: (day: number) => void;
}

export default function Semana({ weekOffset, onWeekChange, selectedDay, onDayChange }: Props) {
  const weekId = getWeekId(weekOffset);
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const isCurrentWeek = weekOffset === 0;

  // Global settings
  const [dayOffIndex, setDayOffIndex] = useLocalStorage('dayOff', 5);
  const [startWithA, setStartWithA] = useLocalStorage('startWithA', true);

  // Per-day persistent state (keyed by weekId-dayIndex)
  const [exerciseChecks, setExerciseChecks] = useLocalStorage<Record<string, boolean[][]>>('exerciseChecks', {});
  const [sportDone, setSportDone] = useLocalStorage<Record<string, boolean>>('sportDone', {});
  const [studiesDone, setStudiesDone] = useLocalStorage<Record<string, string[]>>('studiesDone', {});
  const [mealSelections, setMealSelections] = useLocalStorage<Record<string, Record<string, number>>>('mealSelections', {});
  const [workHours, setWorkHours] = useLocalStorage<Record<string, { start: string; end: string }>>('workHours', {});

  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [editingWork, setEditingWork] = useState(false);
  const [workEditStart, setWorkEditStart] = useState('13:15');
  const [workEditEnd, setWorkEditEnd] = useState('20:15');

  // Derived state for selected day
  const dayKey = `${weekId}-${selectedDay}`;
  const sportType: SportType = getSportType(selectedDay, dayOffIndex);
  const treino = sportType === 'gym' ? getGymTreino(selectedDay, dayOffIndex, startWithA) : null;
  const therapy = hasTherapy(selectedDay);
  const hasWork = selectedDay !== dayOffIndex;
  const workTime = workHours[dayKey] ?? { start: '13:15', end: '20:15' };

  const exerciseList: Exercise[] | null =
    sportType === 'gym'
      ? treino === 'A' ? TREINO_A : TREINO_B
      : sportType === 'home'
        ? HOME_WORKOUT
        : null;

  function getChecks(exIdx: number): boolean[] {
    const stored = exerciseChecks[dayKey];
    if (stored?.[exIdx]) return stored[exIdx];
    return Array(exerciseList![exIdx].sets).fill(false) as boolean[];
  }

  function toggleSet(exIdx: number, setIdx: number) {
    const current: boolean[][] = exerciseChecks[dayKey] ??
      exerciseList!.map((ex) => Array(ex.sets).fill(false) as boolean[]);
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

  function saveWorkHours() {
    setWorkHours((prev) => ({ ...prev, [dayKey]: { start: workEditStart, end: workEditEnd } }));
    setEditingWork(false);
  }

  // Weekly stats
  const weekStats = useMemo(() => {
    let gymDone = 0, gymTotal = 0;
    let jjbDone = 0, jjbTotal = 0;
    let permisDays = 0;
    for (let d = 0; d < 7; d++) {
      const sport = getSportType(d, dayOffIndex);
      const key = `${weekId}-${d}`;
      if (sport === 'gym') {
        gymTotal++;
        if (sportDone[key]) gymDone++;
      } else if (sport === 'jjb_fixed' || sport === 'jjb_off') {
        jjbTotal++;
        if (sportDone[key]) jjbDone++;
      }
      if ((studiesDone[key] ?? []).includes('permis')) permisDays++;
    }
    return { gymDone, gymTotal, jjbDone, jjbTotal, permisDays };
  }, [weekId, dayOffIndex, sportDone, studiesDone]);

  // Schedule timeline
  const scheduleItems = useMemo(() => {
    const items: { time: string; label: string; icon: string; detail?: string; borderColor: string; isWork?: boolean }[] = [];
    items.push({ time: '07h30 – 08h00', label: 'Réveil', icon: '☀️', borderColor: '#6b7280' });
    if (sportType === 'jjb_fixed') {
      items.push({ time: '07h30 – 08h30', label: 'JJB — cours fixe', icon: '🥋', detail: 'Jiu-Jitsu Brésilien', borderColor: '#a855f7' });
      items.push({ time: '08h30 – 09h30', label: 'Étude permis', icon: '📚', borderColor: '#ef4444' });
    } else if (sportType === 'jjb_off') {
      items.push({ time: 'Matin — horaire libre', label: 'JJB — jour de repos', icon: '🥋', detail: 'Créneau libre', borderColor: '#a855f7' });
      items.push({ time: 'Après JJB', label: 'Étude permis', icon: '📚', borderColor: '#ef4444' });
    } else if (sportType === 'gym') {
      items.push({ time: '09h00 – 10h30', label: `Gym — Treino ${treino}`, icon: '💪', detail: treino === 'A' ? 'Full Body A' : 'Full Body B', borderColor: '#3b82f6' });
      items.push({ time: '10h30 – 11h30', label: 'Étude permis', icon: '📚', borderColor: '#ef4444' });
    } else {
      items.push({ time: '09h00 – 10h00', label: 'Home workout (optionnel)', icon: '🏠', borderColor: '#14b8a6' });
      items.push({ time: 'Après workout', label: 'Étude permis', icon: '📚', borderColor: '#ef4444' });
    }
    if (therapy) {
      items.push({ time: '10h45 – 11h45', label: 'Thérapie', icon: '🧠', borderColor: '#ec4899' });
    }
    if (hasWork) {
      items.push({
        time: `${workTime.start.replace(':', 'h')} – ${workTime.end.replace(':', 'h')}`,
        label: 'Travail — Grand Frais', icon: '🛒', borderColor: '#f59e0b', isWork: true,
      });
    } else {
      items.push({ time: 'Journée entière', label: 'Jour de repos', icon: '🌿', detail: 'Repos & récupération', borderColor: '#10b981' });
    }
    return items;
  }, [selectedDay, dayOffIndex, sportType, treino, therapy, hasWork, workTime]);

  const weekDates = Array.from({ length: 7 }, (_, i) => getDayDate(weekOffset, i));
  const mealSel = mealSelections[dayKey] ?? {};
  const studiesSel = studiesDone[dayKey] ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#111118', borderBottom: '1px solid #1f2937' }} className="px-4 py-3 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          {/* Week nav */}
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => onWeekChange(weekOffset - 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: '#1f2937', color: '#9ca3af' }}>←</button>
            <div className="text-center">
              <div className="text-sm font-semibold text-white">
                {isCurrentWeek ? 'Cette semaine' : `${formatDate(weekDates[0])} – ${formatDate(weekDates[6])}`}
              </div>
              {!isCurrentWeek && (
                <button onClick={() => onWeekChange(0)} className="text-[10px] cursor-pointer" style={{ color: '#60a5fa' }}>
                  Retour aujourd&apos;hui
                </button>
              )}
            </div>
            <button onClick={() => onWeekChange(weekOffset + 1)} className="px-3 py-1.5 rounded-lg text-sm cursor-pointer" style={{ background: '#1f2937', color: '#9ca3af' }}>→</button>
          </div>
          {/* Day off */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] shrink-0" style={{ color: '#6b7280' }}>Repos:</span>
            <div className="flex gap-1">
              {DAY_ABBR.map((abbr, i) => (
                <button key={i} onClick={() => setDayOffIndex(i)} className="px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer"
                  style={{ background: dayOffIndex === i ? '#059669' : '#1f2937', color: dayOffIndex === i ? '#fff' : '#6b7280' }}>
                  {abbr}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div style={{ background: '#111118', borderBottom: '1px solid #1f2937' }} className="px-3 py-2">
        <div className="max-w-lg mx-auto grid grid-cols-7 gap-1">
          {DAYS.map((_, i) => {
            const sport = getSportType(i, dayOffIndex);
            const isSelected = selectedDay === i;
            const isToday = isCurrentWeek && i === todayIndex;
            return (
              <button key={i} onClick={() => onDayChange(i)} className="relative flex flex-col items-center py-1.5 rounded-xl cursor-pointer transition-all"
                style={{ background: isSelected ? '#2563eb' : 'rgba(31,41,55,0.6)', color: isSelected ? '#fff' : '#9ca3af' }}>
                {isToday && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: '#60a5fa' }} />}
                <span className="text-[9px] font-bold">{DAY_ABBR[i]}</span>
                <span className="text-[11px]" style={{ color: isSelected ? '#bfdbfe' : '#4b5563' }}>{weekDates[i].getDate()}</span>
                <span className="text-xs">{sportIcon(sport)}</span>
                {sportDone[`${weekId}-${i}`] && <span style={{ color: '#22c55e', fontSize: 8 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#111118', borderBottom: '1px solid #1f2937' }}>
        <div className="max-w-lg mx-auto flex">
          {(['schedule', 'nutrition', 'studies'] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="flex-1 py-2.5 text-[11px] font-semibold uppercase tracking-wide cursor-pointer"
              style={{ color: activeTab === tab ? '#60a5fa' : '#6b7280', borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent' }}>
              {tab === 'schedule' ? '📅 Planning' : tab === 'nutrition' ? '🥗 Nutrition' : '📚 Études'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-6">

        {/* --- SCHEDULE --- */}
        {activeTab === 'schedule' && (
          <div>
            {/* Day header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{DAYS[selectedDay]} <span className="text-sm font-normal" style={{ color: '#6b7280' }}>{formatDate(weekDates[selectedDay])}</span></h2>
                {therapy && <p className="text-xs mt-0.5" style={{ color: '#ec4899' }}>🧠 Thérapie 10h45</p>}
              </div>
              <div className="flex gap-2 items-center">
                {sportType === 'gym' && (
                  <button onClick={() => setStartWithA(!startWithA)} className="text-xs px-2 py-1 rounded-lg cursor-pointer font-bold"
                    style={{ background: '#1f2937', border: '1px solid #374151', color: '#60a5fa' }}>
                    Treino {startWithA ? 'A' : 'B'}
                  </button>
                )}
                {exerciseList && (
                  <button onClick={toggleSport} className="text-xs px-2 py-1 rounded-lg cursor-pointer font-semibold"
                    style={{
                      background: sportDone[dayKey] ? '#065f46' : '#1f2937',
                      border: `1px solid ${sportDone[dayKey] ? '#10b981' : '#374151'}`,
                      color: sportDone[dayKey] ? '#6ee7b7' : '#9ca3af',
                    }}>
                    {sportDone[dayKey] ? '✓ Feito' : 'Marcar feito'}
                  </button>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2 mb-5">
              {scheduleItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                  style={{ background: '#111118', borderLeft: `2px solid ${item.borderColor}` }}>
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: '#6b7280' }}>{item.time}</div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    {item.detail && <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{item.detail}</div>}
                  </div>
                  {item.isWork && hasWork && !editingWork && (
                    <button onClick={() => { setWorkEditStart(workTime.start); setWorkEditEnd(workTime.end); setEditingWork(true); }}
                      className="text-sm px-2 py-1 rounded cursor-pointer shrink-0"
                      style={{ background: '#1f2937', color: '#9ca3af' }}>✏️</button>
                  )}
                </div>
              ))}
            </div>

            {/* Edit work hours */}
            {editingWork && hasWork && (
              <div className="rounded-xl p-4 mb-4" style={{ background: '#111118', border: '1px solid #f59e0b50' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#f59e0b' }}>✏️ Éditer horaire travail</p>
                <div className="flex items-center gap-3">
                  <input type="time" value={workEditStart} onChange={(e) => setWorkEditStart(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
                  <span style={{ color: '#6b7280' }}>–</span>
                  <input type="time" value={workEditEnd} onChange={(e) => setWorkEditEnd(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm"
                    style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151' }} />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={saveWorkHours} className="flex-1 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                    style={{ background: '#059669', color: '#fff' }}>Sauvegarder</button>
                  <button onClick={() => setEditingWork(false)} className="px-4 py-2 rounded-lg text-sm cursor-pointer"
                    style={{ background: '#1f2937', color: '#9ca3af' }}>Annuler</button>
                </div>
              </div>
            )}

            {/* Exercise checklist */}
            {exerciseList && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                    {sportType === 'gym' ? `Treino ${treino} — Full Body` : 'Home Workout'}
                  </h3>
                  <span className="text-xs" style={{ color: '#4b5563' }}>{exerciseList.length} exercices</span>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1f2937' }}>
                  {exerciseList.map((ex, exIdx) => {
                    const checks = getChecks(exIdx);
                    const allDone = checks.every(Boolean);
                    const doneSets = checks.filter(Boolean).length;
                    return (
                      <div key={exIdx} className="px-4 py-3"
                        style={{ borderBottom: exIdx < exerciseList.length - 1 ? '1px solid #1f2937' : undefined, background: allDone ? 'rgba(6,78,59,0.12)' : undefined }}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-5 text-center font-mono" style={{ color: '#4b5563' }}>{exIdx + 1}</span>
                            <span className="text-sm" style={{ color: allDone ? '#6ee7b7' : '#e5e7eb' }}>{ex.name}</span>
                            {allDone && <span style={{ color: '#22c55e', fontSize: 12 }}>✓</span>}
                          </div>
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: '#60a5fa', background: 'rgba(30,58,95,0.25)' }}>
                            {doneSets}/{ex.sets}×{ex.reps}
                          </span>
                        </div>
                        <div className="flex gap-2 pl-7">
                          {Array.from({ length: ex.sets }, (_, setIdx) => {
                            const done = checks[setIdx] ?? false;
                            return (
                              <button key={setIdx} onClick={() => toggleSet(exIdx, setIdx)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-all"
                                style={{
                                  background: done ? '#059669' : '#1f2937',
                                  color: done ? '#fff' : '#6b7280',
                                  border: `1px solid ${done ? '#10b981' : '#374151'}`,
                                }}>
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

            {/* Weekly stats */}
            <div className="rounded-xl p-4" style={{ background: '#111118', border: '1px solid #1f2937' }}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#6b7280' }}>
                Stats de la semaine
              </h3>
              <div className="space-y-3">
                <StatBar label="Gym 💪" done={weekStats.gymDone} total={weekStats.gymTotal} color="#3b82f6" />
                <StatBar label="JJB 🥋" done={weekStats.jjbDone} total={weekStats.jjbTotal} color="#a855f7" />
                <StatBar label="Permis 📚" done={weekStats.permisDays} total={7} color="#ef4444" />
              </div>
            </div>
          </div>
        )}

        {/* --- NUTRITION --- */}
        {activeTab === 'nutrition' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Repas</h2>
              <span className="text-xs" style={{ color: '#6b7280' }}>{DAYS[selectedDay]}</span>
            </div>
            {Object.entries(NUTRITION).map(([key, meal]) => (
              <div key={key} className="rounded-xl overflow-hidden" style={{ background: '#111118', border: '1px solid #1f2937' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #1f2937' }}>
                  <h3 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>{meal.label}</h3>
                </div>
                <div className="p-3 space-y-2">
                  {meal.options.map((opt, i) => {
                    const isSelected = mealSel[key] === i;
                    return (
                      <button key={i} onClick={() => setMeal(key, i)}
                        className="w-full text-left text-sm px-3 py-2.5 rounded-lg flex items-start gap-2 cursor-pointer"
                        style={{
                          background: isSelected ? 'rgba(6,78,59,0.25)' : 'rgba(31,41,55,0.4)',
                          border: `1px solid ${isSelected ? 'rgba(6,95,70,0.5)' : 'transparent'}`,
                          color: isSelected ? '#6ee7b7' : '#9ca3af',
                        }}>
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                          style={{ border: `1px solid ${isSelected ? '#10b981' : '#4b5563'}`, background: isSelected ? '#10b981' : 'transparent', color: '#fff' }}>
                          {isSelected ? '✓' : ''}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- STUDIES --- */}
        {activeTab === 'studies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Études</h2>
              <span className="text-xs" style={{ color: '#6b7280' }}>{DAYS[selectedDay]}</span>
            </div>
            <div className="space-y-2">
              {STUDIES.map((study) => {
                const isDone = studiesSel.includes(study.id);
                const isDisabled = study.id === 'brand' && selectedDay !== 6;
                return (
                  <button key={study.id} disabled={isDisabled} onClick={() => !isDisabled && toggleStudy(study.id)}
                    className="w-full flex items-center gap-4 rounded-xl p-4 transition-all"
                    style={{ background: '#111118', border: `1px solid ${isDone ? '#374151' : '#1f2937'}`, opacity: isDisabled ? 0.3 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
                    <div className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: isDone ? 'transparent' : '#4b5563', background: isDone ? study.color : 'transparent' }}>
                      {isDone && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold" style={{ color: isDone ? '#4b5563' : '#fff', textDecoration: isDone ? 'line-through' : undefined }}>{study.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{study.detail}</div>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: study.color, background: '#1f2937' }}>P{study.priority}</span>
                  </button>
                );
              })}
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(69,10,10,0.2)', border: '1px solid rgba(127,29,29,0.25)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📚</span>
                <span className="text-sm font-semibold text-red-400">Rappel — Permis</span>
              </div>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Étudier le code <strong style={{ color: '#d1d5db' }}>chaque jour après le sport</strong>. Priorité absolue.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBar({ label, done, total, color }: { label: string; done: number; total: number; color: string }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs" style={{ color: '#9ca3af' }}>{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{done}/{total}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: '#1f2937' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
