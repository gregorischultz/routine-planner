export type Exercise = { name: string; sets: number; reps: string };
export type SportType = 'jjb_fixed' | 'jjb_off' | 'gym' | 'home';

/** Evento criado pelo utilizador no Calendário */
export interface CalendarEvent {
  id: string;      // identificador único (timestamp)
  title: string;
  date: string;    // "YYYY-MM-DD"
  time?: string;   // "HH:MM" — opcional
  type: 'todo' | 'rdv';  // À faire | Rendez-vous
}

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
export const DAY_ABBR = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
export const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const TREINO_A: Exercise[] = [
  { name: 'Supino reto', sets: 4, reps: '10' },
  { name: 'Crucifixo inclinado', sets: 3, reps: '12' },
  { name: 'Remada curvada', sets: 4, reps: '10' },
  { name: 'Pulldown', sets: 3, reps: '12' },
  { name: 'Desenvolvimento ombro', sets: 3, reps: '10' },
  { name: 'Rosca direta', sets: 3, reps: '12' },
  { name: 'Agachamento livre', sets: 3, reps: '10' },
];

export const TREINO_B: Exercise[] = [
  { name: 'Supino inclinado', sets: 4, reps: '10' },
  { name: 'Crossover / Peck deck', sets: 3, reps: '12' },
  { name: 'Remada unilateral', sets: 4, reps: '10' },
  { name: 'Remada alta', sets: 3, reps: '12' },
  { name: 'Elevação lateral', sets: 3, reps: '12' },
  { name: 'Rosca martelo', sets: 3, reps: '12' },
  { name: 'Terra romeno', sets: 3, reps: '10' },
];

export const HOME_WORKOUT: Exercise[] = [
  { name: 'Apoio largo', sets: 4, reps: 'max' },
  { name: 'Apoio fechado', sets: 3, reps: 'max' },
  { name: 'Apoio declinado', sets: 3, reps: 'max' },
  { name: 'Agachamento livre', sets: 4, reps: '15' },
  { name: 'Prancha', sets: 3, reps: '60s' },
];

export const NUTRITION: Record<string, { label: string; options: string[] }> = {
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

export const STUDIES = [
  { id: 'permis', label: 'Code de la route', detail: 'Priorité absolue — chaque jour', freq: 'Chaque jour', priority: 1, color: '#ef4444' },
  { id: 'sites', label: 'Sites / Landing pages', detail: '3 fois par semaine', freq: '3×/sem', priority: 2, color: '#f97316' },
  { id: 'prog', label: 'Programmation & IA', detail: '2 fois par semaine', freq: '2×/sem', priority: 3, color: '#eab308' },
  { id: 'brand', label: 'Branding', detail: 'Dimanche uniquement', freq: 'Dimanche', priority: 4, color: '#22c55e' },
];

export const FINANCAS_CATEGORIES = [
  {
    id: 'apartamento',
    label: 'Apartamento',
    color: '#60a5fa',
    items: ['Alug', 'Ass casa', 'Eletricidade', 'Box', 'Compra'],
  },
  {
    id: 'outros',
    label: 'Outros',
    color: '#a78bfa',
    items: ['Assurance BPCE', 'Cot. Bancaires', 'CELC', 'Assurance emprestimo (vie)', 'Emprestimo'],
  },
  {
    id: 'forfaits',
    label: 'Forfaits',
    color: '#f97316',
    items: ['Freebox', 'Chatgpt', 'Basic', 'Espaço Apple', 'Ionos', 'Espaço google'],
  },
  {
    id: 'despesas',
    label: 'Despesas',
    color: '#22c55e',
    items: ['Dizimo', 'Terapia', 'Variaveis', 'Aula Jiu', 'Camila', 'Relogio Apple'],
  },
];

// --- Helpers ---

export function getSportType(dayIndex: number, dayOffIndex: number): SportType {
  if (dayIndex === 6) return 'home';
  if (dayIndex === 2 || dayIndex === 4) return 'jjb_fixed';
  if (dayIndex === dayOffIndex) return 'jjb_off';
  return 'gym';
}

export function getGymTreino(dayIndex: number, dayOffIndex: number, startWithA: boolean): 'A' | 'B' {
  let gymCount = 0;
  for (let i = 0; i < dayIndex; i++) {
    if (getSportType(i, dayOffIndex) === 'gym') gymCount++;
  }
  const isA = startWithA ? gymCount % 2 === 0 : gymCount % 2 === 1;
  return isA ? 'A' : 'B';
}

export function hasTherapy(dayIndex: number): boolean {
  return dayIndex === 1 || dayIndex === 3;
}

export function sportIcon(sport: SportType): string {
  if (sport === 'jjb_fixed' || sport === 'jjb_off') return '🥋';
  if (sport === 'gym') return '💪';
  return '🏠';
}

export function getWeekStart(weekOffset: number = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekId(weekOffset: number = 0): string {
  const start = getWeekStart(weekOffset);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
}

export function getDayDate(weekOffset: number, dayIndex: number): Date {
  const start = getWeekStart(weekOffset);
  const date = new Date(start);
  date.setDate(start.getDate() + dayIndex);
  return date;
}

export function formatDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}
