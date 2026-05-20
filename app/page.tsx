'use client';

import { useState, useMemo } from 'react';

// ---- DATA ----

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DAY_ABBR = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

const TREINO_A = [
  { name: 'Supino reto', sets: '4×10' },
  { name: 'Crucifixo inclinado', sets: '3×12' },
  { name: 'Remada curvada', sets: '4×10' },
  { name: 'Pulldown', sets: '3×12' },
  { name: 'Desenvolvimento ombro', sets: '3×10' },
  { name: 'Rosca direta', sets: '3×12' },
  { name: 'Agachamento livre', sets: '3×10' },
];

const TREINO_B = [
  { name: 'Supino inclinado', sets: '4×10' },
  { name: 'Crossover / Peck deck', sets: '3×12' },
  { name: 'Remada unilateral', sets: '4×10' },
  { name: 'Remada alta', sets: '3×12' },
  { name: 'Elevação lateral', sets: '3×12' },
  { name: 'Rosca martelo', sets: '3×12' },
  { name: 'Terra romeno', sets: '3×10' },
];

const HOME_WORKOUT = [
  { name: 'Apoio largo', sets: '4×max' },
  { name: 'Apoio fechado', sets: '3×max' },
  { name: 'Apoio declinado', sets: '3×max' },
  { name: 'Agachamento livre', sets: '4×15' },
  { name: 'Prancha', sets: '3×60s' },
];

const NUTRITION: Record<string, { label: string; options: string[] }> = {
  breakfast: {
    label: '🌅 Petit-déjeuner',
    options: [
      'Yaourt 150g + fruit 100g + flocons avoine 30g',
      'Omelette 2 œufs + épinards 30g + tomate 50g',
      'Shake whey 30g + banane 100g + lait 200ml',
      'Pain 1 tranche + beurre de cacahuète 15g',
      'Pancake 1 œuf + avoine 30g + banane 100g',
    ],
  },
  lunch: {
    label: '☀️ Déjeuner',
    options: [
      'Riz 100g + viande/poulet 150g + légumes 100g',
      'Patate douce 100g + 2 œufs + salade 50g',
    ],
  },
  snack: {
    label: '🍎 Collation',
    options: [
      'Thon 80g + carotte 50g',
      '2 œufs durs + fruit 100g',
      'Fromage blanc 150g + avoine 30g + fruit 100g',
      '2 tranches pain + thon ou œuf 80g + carotte 30g',
      'Pancake 1 œuf + banane 100g + avoine 30g',
    ],
  },
  dinner: {
    label: '🌙 Dîner',
    options: [
      'Riz 80g + poulet/viande 100g + légumes 100g',
      '2 œufs + légumes 100g + riz ou pomme de terre 80g',
    ],
  },
  evening: {
    label: '⭐ Collation soir',
    options: [
      'Fromage blanc 150g + fruit 100g + avoine 30g',
      '1 œuf dur + banane 100g',
    ],
  },
};

const STUDIES = [
  {
    id: 'permis',
    label: 'Code de la route',
    detail: 'Priorité absolue — chaque jour',
    freq: 'Chaque jour',
    priority: 1,
    color: 'text-red-400',
    dotColor: '#ef4444',
  },
  {
    id: 'sites',
    label: 'Sites / Landing pages',
    detail: '3 fois par semaine',
    freq: '3×/sem',
    priority: 2,
    color: 'text-orange-400',
    dotColor: '#f97316',
  },
  {
    id: 'prog',
    label: 'Programmation & IA',
    detail: '2 fois par semaine',
    freq: '2×/sem',
    priority: 3,
    color: 'text-yellow-400',
    dotColor: '#eab308',
  },
  {
    id: 'brand',
    label: 'Branding',
    detail: 'Dimanche uniquement',
    freq: 'Dimanche',
    priority: 4,
    color: 'text-green-400',
    dotColor: '#22c55e',
  },
];

// ---- TYPES ----

type SportType = 'jjb_fixed' | 'jjb_off' | 'gym' | 'home';
type Tab = 'schedule' | 'nutrition' | 'studies';

// ---- HELPERS ----

function getSportType(dayIndex: number, dayOffIndex: number): SportType {
  if (dayIndex === 6) return 'home';
  if (dayIndex === 2 || dayIndex === 4) return 'jjb_fixed';
  if (dayIndex === dayOffIndex) return 'jjb_off';
  return 'gym';
}

function getGymTreino(dayIndex: number, dayOffIndex: number, startWithA: boolean): 'A' | 'B' {
  let gymCount = 0;
  for (let i = 0; i < dayIndex; i++) {
    if (getSportType(i, dayOffIndex) === 'gym') gymCount++;
  }
  const isA = startWithA ? gymCount % 2 === 0 : gymCount % 2 === 1;
  return isA ? 'A' : 'B';
}

function hasTherapy(dayIndex: number): boolean {
  return dayIndex === 1 || dayIndex === 3;
}

function sportIcon(sport: SportType): string {
  if (sport === 'jjb_fixed' || sport === 'jjb_off') return '🥋';
  if (sport === 'gym') return '💪';
  return '🏠';
}

// ---- COMPONENT ----

export default function RoutinePage() {
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const [dayOffIndex, setDayOffIndex] = useState(5);
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [startWithA, setStartWithA] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [mealSelections, setMealSelections] = useState<Record<string, number>>({
    breakfast: 0,
    lunch: 0,
    snack: 0,
    dinner: 0,
    evening: 0,
  });
  const [completedStudies, setCompletedStudies] = useState<string[]>([]);

  const sportType = getSportType(selectedDay, dayOffIndex);
  const treino = sportType === 'gym' ? getGymTreino(selectedDay, dayOffIndex, startWithA) : null;
  const therapy = hasTherapy(selectedDay);
  const hasWork = selectedDay !== dayOffIndex;

  const scheduleItems = useMemo(() => {
    const items: {
      time: string;
      label: string;
      icon: string;
      detail?: string;
      borderColor: string;
    }[] = [];

    items.push({ time: '07h30 – 08h00', label: 'Réveil', icon: '☀️', borderColor: '#6b7280' });

    if (sportType === 'jjb_fixed') {
      items.push({
        time: '07h30 – 08h30',
        label: 'JJB — cours fixe',
        icon: '🥋',
        detail: 'Jiu-Jitsu Brésilien',
        borderColor: '#a855f7',
      });
      items.push({ time: '08h30 – 09h30', label: 'Étude permis', icon: '📚', borderColor: '#ef4444' });
    } else if (sportType === 'jjb_off') {
      items.push({
        time: 'Matin — horaire libre',
        label: 'JJB — jour de repos',
        icon: '🥋',
        detail: 'Choisir le créneau selon disponibilité',
        borderColor: '#a855f7',
      });
      items.push({ time: 'Après JJB', label: 'Étude permis', icon: '📚', borderColor: '#ef4444' });
    } else if (sportType === 'gym') {
      items.push({
        time: '09h00 – 10h30',
        label: `Gym — Treino ${treino}`,
        icon: '💪',
        detail:
          treino === 'A'
            ? 'Full Body A (Supino, Remada, Ombro...)'
            : 'Full Body B (Inclinado, Unilateral, Terra...)',
        borderColor: '#3b82f6',
      });
      items.push({ time: '10h30 – 11h30', label: 'Étude permis', icon: '📚', borderColor: '#ef4444' });
    } else if (sportType === 'home') {
      items.push({
        time: '09h00 – 10h00',
        label: 'Home workout (optionnel)',
        icon: '🏠',
        detail: 'Apoio + Agachamento + Prancha',
        borderColor: '#14b8a6',
      });
      items.push({ time: 'Après workout', label: 'Étude permis', icon: '📚', borderColor: '#ef4444' });
    }

    if (therapy) {
      items.push({ time: '10h45 – 11h45', label: 'Thérapie', icon: '🧠', borderColor: '#ec4899' });
    }

    if (hasWork) {
      items.push({ time: '13h15 – 20h15', label: 'Travail — Grand Frais', icon: '🛒', borderColor: '#f59e0b' });
    } else {
      items.push({
        time: 'Journée entière',
        label: 'Jour de repos',
        icon: '🌿',
        detail: 'Repos & récupération',
        borderColor: '#10b981',
      });
    }

    return items;
  }, [selectedDay, dayOffIndex, sportType, treino, therapy, hasWork]);

  const exerciseList =
    sportType === 'gym'
      ? treino === 'A'
        ? TREINO_A
        : TREINO_B
      : sportType === 'home'
        ? HOME_WORKOUT
        : null;

  function toggleStudy(id: string) {
    setCompletedStudies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f', color: '#f3f4f6' }}>
      {/* Header */}
      <div
        className="px-4 py-4 sticky top-0 z-10"
        style={{ background: '#111118', borderBottom: '1px solid #1f2937' }}
      >
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-white tracking-tight mb-3">
            Planning Hebdomadaire
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs shrink-0" style={{ color: '#6b7280' }}>
              Jour de repos :
            </span>
            <div className="flex gap-1 flex-wrap">
              {DAYS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setDayOffIndex(i)}
                  className="px-2 py-1 rounded text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: dayOffIndex === i ? '#059669' : '#1f2937',
                    color: dayOffIndex === i ? '#fff' : '#9ca3af',
                  }}
                >
                  {DAY_ABBR[i]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div
        className="px-3 py-3"
        style={{ background: '#111118', borderBottom: '1px solid #1f2937' }}
      >
        <div className="max-w-lg mx-auto grid grid-cols-7 gap-1">
          {DAYS.map((_, i) => {
            const sport = getSportType(i, dayOffIndex);
            const isSelected = selectedDay === i;
            const isToday = i === todayIndex;
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className="relative flex flex-col items-center py-2 rounded-xl transition-all cursor-pointer"
                style={{
                  background: isSelected ? '#2563eb' : 'rgba(31,41,55,0.6)',
                  color: isSelected ? '#fff' : '#9ca3af',
                  boxShadow: isSelected ? '0 4px 24px rgba(29,78,216,0.25)' : undefined,
                }}
              >
                {isToday && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                    style={{ background: '#60a5fa' }}
                  />
                )}
                <span className="text-[10px] font-bold tracking-wide">{DAY_ABBR[i]}</span>
                <span className="text-sm mt-0.5">{sportIcon(sport)}</span>
                {hasTherapy(i) && <span className="text-[9px] mt-0.5">🧠</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="sticky top-[105px] z-10"
        style={{ background: '#111118', borderBottom: '1px solid #1f2937' }}
      >
        <div className="max-w-lg mx-auto flex">
          {(['schedule', 'nutrition', 'studies'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-3 text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer"
              style={{
                color: activeTab === tab ? '#60a5fa' : '#6b7280',
                borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
              }}
            >
              {tab === 'schedule' ? '📅 Planning' : tab === 'nutrition' ? '🥗 Nutrition' : '📚 Études'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-12">

        {/* ---- SCHEDULE ---- */}
        {activeTab === 'schedule' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{DAYS[selectedDay]}</h2>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                  {hasWork ? 'Travail 13h15 – 20h15' : 'Pas de travail'}
                  {therapy ? ' · Thérapie 10h45' : ''}
                </p>
              </div>
              {sportType === 'gym' && (
                <button
                  onClick={() => setStartWithA(!startWithA)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                  style={{ background: '#1f2937', border: '1px solid #374151', color: '#d1d5db' }}
                >
                  <span style={{ color: '#60a5fa', fontWeight: 700 }}>
                    Treino {startWithA ? 'A' : 'B'}
                  </span>
                  <span style={{ color: '#6b7280' }}>semaine</span>
                </button>
              )}
            </div>

            <div className="space-y-2 mb-6">
              {scheduleItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl p-3"
                  style={{ background: '#111118', borderLeft: `2px solid ${item.borderColor}` }}
                >
                  <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium" style={{ color: '#6b7280' }}>
                      {item.time}
                    </div>
                    <div className="text-sm font-semibold text-white mt-0.5">{item.label}</div>
                    {item.detail && (
                      <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
                        {item.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {exerciseList && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: '#9ca3af' }}
                  >
                    {sportType === 'gym' ? `Treino ${treino} — Full Body` : 'Home Workout'}
                  </h3>
                  <span className="text-xs" style={{ color: '#4b5563' }}>
                    {exerciseList.length} exercices
                  </span>
                </div>
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: '#111118', border: '1px solid #1f2937' }}
                >
                  {exerciseList.map((ex, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center px-4 py-3"
                      style={{
                        borderBottom: i < exerciseList.length - 1 ? '1px solid #1f2937' : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-5 text-center font-mono" style={{ color: '#4b5563' }}>
                          {i + 1}
                        </span>
                        <span className="text-sm" style={{ color: '#e5e7eb' }}>
                          {ex.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono font-bold px-2 py-1 rounded-lg"
                        style={{ color: '#60a5fa', background: 'rgba(30,58,95,0.25)' }}
                      >
                        {ex.sets}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- NUTRITION ---- */}
        {activeTab === 'nutrition' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Repas du jour</h2>
              <span className="text-xs" style={{ color: '#6b7280' }}>{DAYS[selectedDay]}</span>
            </div>
            {Object.entries(NUTRITION).map(([key, meal]) => (
              <div
                key={key}
                className="rounded-xl overflow-hidden"
                style={{ background: '#111118', border: '1px solid #1f2937' }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #1f2937' }}>
                  <h3 className="text-sm font-semibold" style={{ color: '#e5e7eb' }}>
                    {meal.label}
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {meal.options.map((opt, i) => {
                    const isSelected = mealSelections[key] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setMealSelections((prev) => ({ ...prev, [key]: i }))}
                        className="w-full text-left text-sm px-3 py-2.5 rounded-lg transition-all flex items-start gap-2 cursor-pointer"
                        style={{
                          background: isSelected ? 'rgba(6,78,59,0.25)' : 'rgba(31,41,55,0.4)',
                          border: `1px solid ${isSelected ? 'rgba(6,95,70,0.5)' : 'transparent'}`,
                          color: isSelected ? '#6ee7b7' : '#9ca3af',
                        }}
                      >
                        <span
                          className="mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold"
                          style={{
                            borderColor: isSelected ? '#10b981' : '#4b5563',
                            background: isSelected ? '#10b981' : 'transparent',
                            color: '#fff',
                          }}
                        >
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

        {/* ---- STUDIES ---- */}
        {activeTab === 'studies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Études</h2>
              <span className="text-xs" style={{ color: '#6b7280' }}>{DAYS[selectedDay]}</span>
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: '#111118', border: '1px solid #1f2937' }}
            >
              <h3
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: '#6b7280' }}
              >
                Système de priorités
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {STUDIES.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${s.color}`}>P{s.priority}</span>
                    <span className="text-xs" style={{ color: '#6b7280' }}>{s.freq}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {STUDIES.map((study) => {
                const isDone = completedStudies.includes(study.id);
                const isBrandToday = study.id === 'brand' && selectedDay === 6;
                const isDisabled = study.id === 'brand' && selectedDay !== 6;
                return (
                  <button
                    key={study.id}
                    disabled={isDisabled}
                    onClick={() => !isDisabled && toggleStudy(study.id)}
                    className="w-full flex items-center gap-4 rounded-xl p-4 transition-all"
                    style={{
                      background: '#111118',
                      border: `1px solid ${isDone ? '#374151' : '#1f2937'}`,
                      opacity: isDisabled ? 0.3 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <div
                      className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: isDone ? 'transparent' : '#4b5563',
                        background: isDone ? study.dotColor : 'transparent',
                      }}
                    >
                      {isDone && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div
                        className="text-sm font-semibold"
                        style={{
                          color: isDone ? '#4b5563' : '#fff',
                          textDecoration: isDone ? 'line-through' : undefined,
                        }}
                      >
                        {study.label}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
                        {study.detail}
                      </div>
                      {isBrandToday && !isDone && (
                        <span className="text-[10px] font-medium mt-1 inline-block" style={{ color: '#22c55e' }}>
                          ● disponible aujourd&apos;hui
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${study.color}`}
                      style={{ background: '#1f2937' }}
                    >
                      P{study.priority}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(69,10,10,0.2)', border: '1px solid rgba(127,29,29,0.25)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📚</span>
                <span className="text-sm font-semibold text-red-400">Rappel — Permis</span>
              </div>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                Étudier le code{' '}
                <strong style={{ color: '#d1d5db' }}>chaque jour après le sport</strong>.
                Priorité absolue, même les jours de repos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
