/**
 * Ulangan rejim protokoli — "sinf testi" modeli.
 *
 * Har bir o'quvchi **o'z tezligida** test yechadi: savollar ro'yxati bir marta
 * tarqatiladi, keyin har kim o'z navbatida javob beradi. Vaqt tugaguncha kim
 * ko'p to'g'ri javob bersa — o'sha yuqorida turadi.
 *
 * Holat Supabase Realtime **broadcast** orqali yuriladi (bazaga yozilmaydi),
 * shuning uchun 25–30 o'quvchi bir vaqtda ishlaganda ham kechikish sezilmaydi.
 * Bazaga faqat yakuniy natija va har bir javob yoziladi — jurnal to'liq qoladi.
 */

export const channelName = (pin: string) => `gettalim:${pin}`;

export type LivePhase = "lobby" | "running" | "finished";

/** Savol — **to'g'ri javobsiz**. Javob faqat o'qituvchi kompyuterida qoladi. */
export interface LiveQuestion {
  index: number;
  prompt: string;
  options: string[];
}

/** Reyting satri — o'qituvchi ekranidagi kartochka shundan quriladi. */
export interface BoardRow {
  participantId: string;
  nickname: string;
  teamNo: number;
  /** Ball: to'g'ri javob 100 + tezlik uchun 50 gacha. */
  score: number;
  correct: number;
  wrong: number;
  /** Nechta savolga javob berdi. */
  answered: number;
  /** Ketma-ket to'g'ri javoblar. */
  streak: number;
}

export interface LiveState {
  phase: LivePhase;
  gameId: string;
  /** Jamoalar soni (0 — yakka musobaqa). */
  teams: number;
  teamNames: string[];
  /** Jamoalarning to'g'ri javoblari yig'indisi. */
  teamPoints: number[];
  /** Savollar bazasi — `running` bosqichida to'ldiriladi. */
  bank: LiveQuestion[];
  /** Test qachon tugaydi (epoch ms). 0 — hali boshlanmagan. */
  endsAt: number;
  /** To'liq reyting — barcha o'quvchilar. */
  board: BoardRow[];
}

/** O'quvchi → HOST: javob. */
export interface LiveAnswer {
  participantId: string;
  nickname: string;
  teamNo: number;
  questionIndex: number;
  choice: string;
  ms: number;
}

/** HOST → o'quvchi: javob to'g'rimi (faqat o'z egasi ishlatadi). */
export interface LiveVerdict {
  participantId: string;
  questionIndex: number;
  correct: boolean;
  answer: string;
  score: number;
  rank: number;
  of: number;
  /** Savol hisobga olinmadi (HOST bankni topa olmadi) — shunchaki o'tkazamiz. */
  skipped?: boolean;
}

export interface LiveHello {
  participantId: string;
  nickname: string;
  teamNo: number;
}

export const EVENT = {
  state: "state",
  answer: "answer",
  verdict: "verdict",
  hello: "hello",
  sync: "sync",
} as const;

/* ------------------------------------------------------------------ */
/*  O'quvchi seansini brauzerda saqlash                                */
/* ------------------------------------------------------------------ */

export interface StoredPlayer {
  pin: string;
  sessionId: string;
  participantId: string;
  nickname: string;
  teamNo: number;
  gameId: string;
}

const KEY = "gettalim.player.v1";

export function storePlayer(player: StoredPlayer) {
  try {
    localStorage.setItem(KEY, JSON.stringify(player));
  } catch {
    /* xotira to'la — e'tiborsiz */
  }
}

export function readPlayer(pin: string): StoredPlayer | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPlayer;
    return parsed.pin === pin ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPlayer() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* e'tiborsiz */
  }
}

/** Har bir o'quvchi savollarni boshqa nuqtadan boshlaydi — ko'chirish qiyinlashadi. */
export function startOffset(participantId: string, bankSize: number): number {
  if (bankSize <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < participantId.length; i += 1) {
    hash = (hash * 31 + participantId.charCodeAt(i)) % 100000;
  }
  return hash % bankSize;
}
