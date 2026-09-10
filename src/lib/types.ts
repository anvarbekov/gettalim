export type QuestionType = "number" | "text" | "choice";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  /** To'g'ri javob. `choice` uchun variant matni. */
  answer: string;
  /** Qo'shimcha to'g'ri javoblar (sinonimlar, boshqa yozilishi). */
  alt?: string[];
  /** `choice` uchun variantlar. */
  options?: string[];
  hint?: string;
  /** Savol qiyinligi: 1 (oson) … 3 (qiyin). Ochko shunga qarab beriladi. */
  level?: 1 | 2 | 3;
  /** Javobdan keyin ko'rsatiladigan izoh — o'quv qiymati uchun. */
  explanation?: string;
}

export type GeneratorConfig = {
  kind: "arithmetic";
  ops: Array<"+" | "-" | "*" | "/">;
  min: number;
  max: number;
  /** Ayirishda manfiy natijaga yo'l qo'yilmasin. */
  noNegative?: boolean;
};

export interface Pack {
  id: string;
  title: string;
  subject: string;
  icon: string;
  /** Fan uchun aksent rang (hex). */
  color: string;
  description?: string;
  grade?: string;
  language?: "uz" | "ru" | "en";
  author?: string;
  /** Savollar ro'yxati. Generator bo'lsa, bo'sh bo'lishi mumkin. */
  questions: Question[];
  /** Cheksiz savol yaratuvchi (masalan, arifmetika). */
  generator?: GeneratorConfig;
  builtin?: boolean;
  createdAt?: string;
  /** Supabase'dan kelgan bo'lsa. */
  remoteId?: string;
}

export interface MatchSettings {
  packId: string;
  teamA: string;
  teamB: string;
  /** G'alaba uchun kerakli ochko farqi (arqon necha qadamdan iborat). */
  pullToWin: number;
  /** Sekundlarda. 0 — vaqt cheklanmagan. */
  duration: number;
  /** Oldingi savolga qaytish (javobni ko'rish) tugmasi ko'rinsinmi. */
  allowReview: boolean;
  shuffle: boolean;
  sound: boolean;
  keyboard: boolean;
  /** Jamoa personajlari — `lib/characters.ts` dagi model id'lari. */
  charA: string;
  charB: string;
}

/* ------------------------------------------------------------------ */
/*  Poyga                                                              */
/* ------------------------------------------------------------------ */

export interface RaceSettings {
  packId: string;
  /** 2..4 */
  teamCount: number;
  teams: string[];
  /** "horse" | "car" */
  racer: "horse" | "car";
  /** Marraga yetish uchun kerakli to'g'ri javoblar soni. */
  distance: number;
  duration: number;
  shuffle: boolean;
  sound: boolean;
  keyboard: boolean;
  allowReview: boolean;
}

export interface RainSettings {
  packId: string;
  /** 1 yoki 2 */
  teamCount: number;
  teams: string[];
  /** Har bir jamoaning jonlari. */
  lives: number;
  duration: number;
  tempo: "slow" | "normal" | "fast";
  shuffle: boolean;
  sound: boolean;
  keyboard: boolean;
}

export interface RaceResult {
  id: string;
  packTitle: string;
  subject: string;
  teams: string[];
  scores: number[];
  correct: number[];
  wrong: number[];
  winner: number | null;
  durationSec: number;
  playedAt: string;
}

export interface TeamStats {
  correct: number;
  wrong: number;
  score: number;
  bestStreak: number;
}

export interface MatchResult {
  id: string;
  packId: string;
  packTitle: string;
  subject: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  winner: "A" | "B" | "draw";
  statsA: TeamStats;
  statsB: TeamStats;
  durationSec: number;
  playedAt: string;
}


/* ------------------------------------------------------------------ */
/*  Kim millioner bo'ladi                                              */
/* ------------------------------------------------------------------ */

export interface MillionerSettings {
  packId: string;
  /** 1 — yakka (butun sinf), 2–4 — jamoalar navbat bilan o'ynaydi. */
  teamCount: number;
  teams: string[];
  /** Bitta savolga beriladigan vaqt (soniya). 0 — cheklovsiz. */
  seconds: number;
  /** Yordamlar yoqilganmi. */
  lifelines: boolean;
  sound: boolean;
  keyboard: boolean;
}

/* ------------------------------------------------------------------ */
/*  Xotira jufti                                                       */
/* ------------------------------------------------------------------ */

export type MemorySize = "4x4" | "4x5" | "6x6";

export interface XotiraSettings {
  packId: string;
  size: MemorySize;
  /** 1 — yakka, 2–4 — navbat bilan. */
  teamCount: number;
  teams: string[];
  sound: boolean;
}


/* ------------------------------------------------------------------ */
/*  Xazina xaritasi                                                    */
/* ------------------------------------------------------------------ */

export interface XazinaSettings {
  packId: string;
  teamCount: number;
  teams: string[];
  /** Yo'ldagi kataklar soni. */
  length: number;
  /** Bonus va tuzoqlar bo'lsinmi. */
  events: boolean;
  sound: boolean;
}

/* ------------------------------------------------------------------ */
/*  Krossvord                                                          */
/* ------------------------------------------------------------------ */

export interface KrossvordSettings {
  packId: string;
  /** Nechta so'z joylashtirishga urinamiz. */
  words: number;
  /** Savollar ko'rinib tursinmi (chop etishda o'chirish mumkin). */
  showClues: boolean;
}
