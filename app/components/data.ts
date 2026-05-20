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

// ─────────────────────────────────────────────
// REDES SOCIAIS — dados dos formatos
// ─────────────────────────────────────────────

export interface RedesFormat {
  id: string;
  code: string;
  label: string;
  type: string;
  duration: string;
  day: string;     // dia padrão de publicação
  hour: string;    // hora padrão
  color: string;   // cor de destaque
  guide: {
    what: string;      // o que gravar
    equipment: string; // equipamento
    tip: string;       // regra de ouro
  };
}

export const REDES_FORMATS: RedesFormat[] = [
  {
    id: 'f1', code: 'F1', label: 'Compilação semanal', type: 'Reel',
    duration: '15–30s', day: 'Domingo', hour: '10h00', color: '#6366f1',
    guide: {
      what: 'Tudo. 10–20 clips de 3–8s ao longo dos 7 dias: caminhos, treino, cozinhar, estudar.',
      equipment: 'Celular vertical 9:16 ou Akaso V50.',
      tip: 'Gravar sempre que mudas de ambiente. 3 segundos de transição já bastam.',
    },
  },
  {
    id: 'f2', code: 'F2', label: 'POV', type: 'Reel',
    duration: '8–15s', day: 'Segunda', hour: '19h00', color: '#ec4899',
    guide: {
      what: 'Um único gesto visto pelos teus olhos: amarrar faixa, abrir caderno, preparar café. Sem rosto.',
      equipment: 'Celular em primeira pessoa. Luz natural. Corte seco.',
      tip: 'Gravar 3–4 versões do mesmo gesto. Escolher a mais fluida.',
    },
  },
  {
    id: 'f3', code: 'F3', label: 'Transição', type: 'Reel',
    duration: '7–12s', day: 'Segunda', hour: '19h00', color: '#f97316',
    guide: {
      what: 'Dois estados opostos: uniforme → kimono, caderno → academia.',
      equipment: 'Celular em apoio fixo ou tripé. Mesmo ângulo nos dois lados.',
      tip: 'O corte acontece num movimento (tirar a camisa = início do corte).',
    },
  },
  {
    id: 'f4', code: 'F4', label: 'Detalhes + frase', type: 'Reel',
    duration: '6–10s', day: 'Quarta', hour: '19h00', color: '#14b8a6',
    guide: {
      what: 'Um objeto parado: kimono no gancho, xícara, livro aberto, mãos em repouso.',
      equipment: 'Celular em apoio fixo, macro. Luz natural lateral.',
      tip: 'Gravar 5–6 opções. Frase sobreposta no CapCut — fonte simples, cor clara sobre fundo escuro.',
    },
  },
  {
    id: 'f5', code: 'F5', label: 'Compilação JJB', type: 'Reel',
    duration: '15–25s', day: 'Segunda', hour: '19h00', color: '#a855f7',
    guide: {
      what: 'Melhores momentos de treino do mês: queda, raspagem, suor. Foco em técnica, não vitória.',
      equipment: 'Celular estável ou Akaso grande angular. Pedir ao parceiro para filmar.',
      tip: 'Acumular material ao longo do mês. Reservado para a Semana 4.',
    },
  },
  {
    id: 'f6', code: 'F6', label: 'Brasileiro na França', type: 'Reel',
    duration: '15–30s', day: 'Seg/Qua', hour: '19h00', color: '#22c55e',
    guide: {
      what: 'Momento específico e honesto: Grand Frais, fila do RER, sotaque, marmita. Não turístico.',
      equipment: 'Celular. Modo vlog rápido. Tom documental, íntimo.',
      tip: 'Planear a frase em FR e PT antes de editar. Legenda bilíngue é parte do formato.',
    },
  },
  {
    id: 'ca', code: 'CA', label: 'Carrossel filosófico', type: 'Carrossel',
    duration: '4–5 slides', day: 'Sexta', hour: '19h00', color: '#f59e0b',
    guide: {
      what: '4–5 slides no Canva. Fundo escuro (#0a0a0a), tipografia limpa. Frase → contexto → reflexão → Renitēns.',
      equipment: 'Canva ou Unfold.',
      tip: 'Fontes: Marco Aurélio, Sêneca, Camus, Weil, Rickson, Goggins, Bíblia.',
    },
  },
  {
    id: 'cb', code: 'CB', label: 'Foto-conceito', type: 'Estático',
    duration: '1 imagem', day: 'Sexta', hour: '19h00', color: '#94a3b8',
    guide: {
      what: 'Imagem documental forte: silhueta, detalhe de ambiente, mãos.',
      equipment: 'Celular. Edição mínima: contraste leve, P&B ou paleta fria.',
      tip: 'Sem filtro forçado. Legenda curta (Sem 2) ou reflexiva de fechamento (Sem 4).',
    },
  },
  {
    id: 'yt', code: 'YT', label: 'Compilado YouTube', type: 'Vídeo',
    duration: '6–10 min', day: 'Sábado', hour: '10h00', color: '#ef4444',
    guide: {
      what: 'Semana completa: trabalho → treino → estudo → cultura → reflexão final 30s.',
      equipment: 'Akaso V50. Cortes naturais. Voiceover quando faz sentido.',
      tip: 'Agendar no YouTube Studio. Sem música chiclete. 6–10 min.',
    },
  },
  {
    id: 'stories', code: 'ST', label: 'Stories diários', type: 'Stories',
    duration: 'ao longo do dia', day: 'Diário', hour: '—', color: '#3b82f6',
    guide: {
      what: 'Bastidor do dia: caminho, treino, frase curta. Espontâneo.',
      equipment: 'Celular direto no Instagram. Sem produção.',
      tip: 'Seg, Qua, Qui, Sex, Dom. Enquetes e perguntas geram mais interação.',
    },
  },
];

/** Dias de publicação fixos (ordenados) */
export const REDES_POSTING_DAYS = [
  { id: 'seg', label: 'Segunda', hour: '19h00' },
  { id: 'qua', label: 'Quarta',  hour: '19h00' },
  { id: 'sex', label: 'Sexta',   hour: '19h00' },
  { id: 'sab', label: 'Sábado',  hour: '10h00' },
  { id: 'dom', label: 'Domingo', hour: '10h00' },
];

/** Checklist de produção agrupado por formato */
export const REDES_CHECKLIST: Record<string, { id: string; text: string }[]> = {
  base: [
    { id: 'b1', text: 'Material organizado por pasta/dia' },
    { id: 'b2', text: 'Stories publicados (Seg, Qua, Qui, Sex, Dom)' },
    { id: 'b3', text: 'Captions revisadas — máx. 8 linhas, sem coach-speak' },
    { id: 'b4', text: 'Hashtags no comentário (não na caption)' },
  ],
  f1: [
    { id: 'f1_1', text: 'Filmei 10–20 clips de 3–8s ao longo da semana?' },
    { id: 'f1_2', text: 'Selecionei os 8–12 melhores clips?' },
    { id: 'f1_3', text: 'Editei no CapCut (9:16, música fria, legenda FR)?' },
    { id: 'f1_4', text: 'Agendado: Domingo 10h00' },
  ],
  f2: [
    { id: 'f2_1', text: 'Escolhi o gesto a filmar?' },
    { id: 'f2_2', text: 'Gravei 3–4 versões do mesmo gesto?' },
    { id: 'f2_3', text: 'Escolhi a versão mais fluida?' },
    { id: 'f2_4', text: 'Agendado: Segunda 19h00' },
  ],
  f3: [
    { id: 'f3_1', text: 'Planeei os dois estados (A e B)?' },
    { id: 'f3_2', text: 'Gravei lado A e lado B com mesmo ângulo?' },
    { id: 'f3_3', text: 'Corte sincronizado no movimento testado?' },
    { id: 'f3_4', text: 'Agendado: Segunda 19h00' },
  ],
  f4: [
    { id: 'f4_1', text: 'Objeto escolhido (rodízio — não repetir)?' },
    { id: 'f4_2', text: '5–6 opções filmadas?' },
    { id: 'f4_3', text: 'Frase nova sobreposta na edição?' },
    { id: 'f4_4', text: 'Agendado: Quarta 19h00' },
  ],
  f5: [
    { id: 'f5_1', text: 'Material de treino acumulado ao longo do mês?' },
    { id: 'f5_2', text: 'Melhores momentos selecionados (queda, técnica, suor)?' },
    { id: 'f5_3', text: 'Montagem com música forte, legenda FR?' },
    { id: 'f5_4', text: 'Agendado: Segunda 19h00' },
  ],
  f6: [
    { id: 'f6_1', text: 'Momento específico e honesto escolhido?' },
    { id: 'f6_2', text: 'Tema diferente das semanas anteriores?' },
    { id: 'f6_3', text: 'Frase planeada em FR e PT?' },
    { id: 'f6_4', text: 'Legenda bilíngue na edição?' },
    { id: 'f6_5', text: 'Agendado: Segunda ou Quarta 19h00' },
  ],
  ca: [
    { id: 'ca_1', text: 'Frase escolhida (diferente das semanas anteriores)?' },
    { id: 'ca_2', text: '4–5 slides criados (fundo escuro, tipografia limpa)?' },
    { id: 'ca_3', text: 'Slide final: Renitēns?' },
    { id: 'ca_4', text: 'Agendado: Sexta 19h00' },
  ],
  cb: [
    { id: 'cb_1', text: 'Imagem documental forte selecionada?' },
    { id: 'cb_2', text: 'Edição mínima aplicada (contraste, P&B ou paleta fria)?' },
    { id: 'cb_3', text: 'Legenda escrita no estilo Renitēns?' },
    { id: 'cb_4', text: 'Agendado: Sexta 19h00' },
  ],
  yt: [
    { id: 'yt_1', text: 'Material suficiente gravado com Akaso V50?' },
    { id: 'yt_2', text: 'Estrutura: abertura → trabalho → treino → estudo → cultura → reflexão?' },
    { id: 'yt_3', text: 'Voiceover gravado (se aplicável)?' },
    { id: 'yt_4', text: 'Agendado no YouTube Studio: Sábado 10h00' },
  ],
  stories: [
    { id: 'st_1', text: 'Bastidores do dia filmados?' },
    { id: 'st_2', text: 'Enquete ou pergunta publicada?' },
    { id: 'st_3', text: 'Stories em todos os dias programados?' },
  ],
};

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
