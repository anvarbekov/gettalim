import { BUILTIN_PACKS } from "@/data/packs";
import { PRACTICE_PACKS } from "./practice/packs";
import type {
  MatchResult,
  MatchSettings,
  MillionerSettings,
  Pack,
  RaceSettings,
  RainSettings,
  XazinaSettings,
  XotiraSettings,
  KrossvordSettings,
} from "./types";

const KEY_PACKS = "arqon.packs.v1";
const KEY_MATCHES = "arqon.matches.v1";
const KEY_SETTINGS = "arqon.settings.v1";
const KEY_LANG = "arqon.lang";

const canUse = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!canUse()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!canUse()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* kvota to'lgan bo'lishi mumkin — jim o'tamiz */
  }
}

/* ---------------------------- Paketlar ---------------------------- */

/** Foydalanuvchi yaratgan/import qilgan paketlar (tayyorlari alohida). */
export function getCustomPacks(): Pack[] {
  return read<Pack[]>(KEY_PACKS, []);
}

export function getAllPacks(): Pack[] {
  // Mashq mavzulari ham savol paketi sifatida chiqadi — shuning uchun
  // ular barcha o'yinlarda va musobaqa rejimida ishlatilishi mumkin.
  return [...BUILTIN_PACKS, ...PRACTICE_PACKS, ...getCustomPacks()];
}

export function getPack(id: string): Pack | undefined {
  return getAllPacks().find((p) => p.id === id);
}

export function savePack(pack: Pack) {
  const packs = getCustomPacks();
  const index = packs.findIndex((p) => p.id === pack.id);
  if (index >= 0) packs[index] = pack;
  else packs.unshift(pack);
  write(KEY_PACKS, packs);
  return pack;
}

export function removePack(id: string) {
  write(
    KEY_PACKS,
    getCustomPacks().filter((p) => p.id !== id),
  );
}

/* ---------------------------- Natijalar --------------------------- */

export function getMatches(): MatchResult[] {
  return read<MatchResult[]>(KEY_MATCHES, []);
}

export function saveMatch(result: MatchResult) {
  const all = [result, ...getMatches()].slice(0, 100);
  write(KEY_MATCHES, all);
}

export function clearMatches() {
  write(KEY_MATCHES, []);
}

/* ---------------------------- Sozlamalar -------------------------- */

export const DEFAULT_SETTINGS: MatchSettings = {
  packId: "math-add-sub",
  teamA: "1-Jamoa",
  teamB: "2-Jamoa",
  pullToWin: 6,
  duration: 180,
  allowReview: true,
  shuffle: true,
  sound: true,
  keyboard: true,
  charA: "bola",
  charB: "bola",
};

export function getSettings(): MatchSettings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<MatchSettings>>(KEY_SETTINGS, {}) };
}

export function saveSettings(settings: MatchSettings) {
  write(KEY_SETTINGS, settings);
}

/* ---------------------------- Poyga ------------------------------- */

const KEY_RACE = "arqon.race.v1";

export const DEFAULT_RACE: RaceSettings = {
  packId: "math-add-sub",
  teamCount: 2,
  teams: ["1-Jamoa", "2-Jamoa", "3-Jamoa", "4-Jamoa"],
  racer: "horse",
  distance: 10,
  duration: 180,
  shuffle: true,
  sound: true,
  keyboard: true,
  allowReview: true,
};

export function getRaceSettings(): RaceSettings {
  const stored = read<Partial<RaceSettings>>(KEY_RACE, {});
  return { ...DEFAULT_RACE, ...stored, teams: stored.teams ?? DEFAULT_RACE.teams };
}

export function saveRaceSettings(settings: RaceSettings) {
  write(KEY_RACE, settings);
}

/* ------------------------- Savol yomg'iri ------------------------- */

const KEY_RAIN = "arqon.rain.v1";

export const DEFAULT_RAIN: RainSettings = {
  packId: "math-add-sub",
  teamCount: 2,
  teams: ["1-Jamoa", "2-Jamoa"],
  lives: 3,
  duration: 180,
  tempo: "normal",
  shuffle: true,
  sound: true,
  keyboard: true,
};

export function getRainSettings(): RainSettings {
  const stored = read<Partial<RainSettings>>(KEY_RAIN, {});
  return { ...DEFAULT_RAIN, ...stored, teams: stored.teams ?? DEFAULT_RAIN.teams };
}

export function saveRainSettings(settings: RainSettings) {
  write(KEY_RAIN, settings);
}

/* ------------------------------- Til ------------------------------ */

export function getStoredLang(): string | null {
  if (!canUse()) return null;
  return window.localStorage.getItem(KEY_LANG);
}

export function setStoredLang(lang: string) {
  if (!canUse()) return;
  window.localStorage.setItem(KEY_LANG, lang);
}


/* ---------------------- Kim millioner ----------------------------- */

const KEY_MILLIONER = "arqon.millioner.v1";

export const DEFAULT_MILLIONER: MillionerSettings = {
  packId: "informatika",
  teamCount: 1,
  teams: ["1-Jamoa", "2-Jamoa", "3-Jamoa", "4-Jamoa"],
  seconds: 45,
  lifelines: true,
  sound: true,
  keyboard: true,
};

export function getMillionerSettings(): MillionerSettings {
  const stored = read<Partial<MillionerSettings>>(KEY_MILLIONER, {});
  return { ...DEFAULT_MILLIONER, ...stored, teams: stored.teams ?? DEFAULT_MILLIONER.teams };
}

export function saveMillionerSettings(settings: MillionerSettings) {
  write(KEY_MILLIONER, settings);
}

/* ------------------------ Xotira jufti ---------------------------- */

const KEY_XOTIRA = "arqon.xotira.v1";

export const DEFAULT_XOTIRA: XotiraSettings = {
  packId: "informatika",
  size: "4x4",
  teamCount: 2,
  teams: ["1-Jamoa", "2-Jamoa", "3-Jamoa", "4-Jamoa"],
  sound: true,
};

export function getXotiraSettings(): XotiraSettings {
  const stored = read<Partial<XotiraSettings>>(KEY_XOTIRA, {});
  return { ...DEFAULT_XOTIRA, ...stored, teams: stored.teams ?? DEFAULT_XOTIRA.teams };
}

export function saveXotiraSettings(settings: XotiraSettings) {
  write(KEY_XOTIRA, settings);
}


/* ---------------------- Xazina xaritasi --------------------------- */

const KEY_XAZINA = "arqon.xazina.v1";

export const DEFAULT_XAZINA: XazinaSettings = {
  packId: "informatika",
  teamCount: 2,
  teams: ["1-Jamoa", "2-Jamoa", "3-Jamoa", "4-Jamoa"],
  length: 24,
  events: true,
  sound: true,
};

export function getXazinaSettings(): XazinaSettings {
  const stored = read<Partial<XazinaSettings>>(KEY_XAZINA, {});
  return { ...DEFAULT_XAZINA, ...stored, teams: stored.teams ?? DEFAULT_XAZINA.teams };
}

export function saveXazinaSettings(settings: XazinaSettings) {
  write(KEY_XAZINA, settings);
}

/* -------------------------- Krossvord ----------------------------- */

const KEY_KROSSVORD = "arqon.krossvord.v1";

export const DEFAULT_KROSSVORD: KrossvordSettings = {
  packId: "informatika",
  words: 12,
  showClues: true,
};

export function getKrossvordSettings(): KrossvordSettings {
  const stored = read<Partial<KrossvordSettings>>(KEY_KROSSVORD, {});
  return { ...DEFAULT_KROSSVORD, ...stored };
}

export function saveKrossvordSettings(settings: KrossvordSettings) {
  write(KEY_KROSSVORD, settings);
}
