import type { Pack, Question } from "@/lib/types";
import { shuffle } from "@/lib/utils";

/**
 * Krossvord generatori.
 *
 * Savollar paketidan avtomatik to'r quriladi: **javob — so'z**, **savol — ta'rif**.
 * So'zlar kesishgan harflar orqali bir-biriga ulanadi.
 */

export type Direction = "across" | "down";

export interface PlacedWord {
  /** Ro'yxatdagi tartib raqami (to'rda ko'rinadi). */
  number: number;
  answer: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
}

export interface CrosswordCell {
  row: number;
  col: number;
  letter: string;
  /** Shu katakdan boshlanadigan so'z raqami. */
  number: number | null;
  /** Katak qaysi so'zlarga tegishli. */
  words: number[];
}

export interface Crossword {
  rows: number;
  cols: number;
  cells: (CrosswordCell | null)[][];
  words: PlacedWord[];
  /** Joylashtirib bo'lmagan so'zlar soni. */
  skipped: number;
}

/**
 * So'zni krossvordga mos ko'rinishga keltiradi.
 * O'zbek tilidagi tutuq belgilari (o', g', ʻ) olib tashlanadi — har bir
 * katakda bitta harf turishi kerak.
 */
export function normalizeWord(text: string): string {
  return text
    .toUpperCase()
    .replace(/[''`ʻʼ’]/g, "")
    .replace(/[^A-ZА-ЯЁO'ĞŞÇÖÜİ]/gi, "")
    .trim();
}

/** Krossvordga yaroqli savollar: bitta so'zli, 3–12 harfli javob. */
export function usableQuestions(pack: Pack | undefined): Question[] {
  if (!pack || pack.generator) return [];
  const seen = new Set<string>();
  return pack.questions.filter((q) => {
    if (q.answer.trim().includes(" ")) return false;
    const word = normalizeWord(q.answer);
    if (word.length < 3 || word.length > 12) return false;
    if (seen.has(word)) return false;
    seen.add(word);
    return true;
  });
}

interface Placement {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
}

const SIZE = 24; // ichki ish maydoni

/** Joylashtirish mumkinmi — qo'shni kataklar qoidalari bilan tekshiriladi. */
function fits(grid: (string | null)[][], word: string, row: number, col: number, dir: Direction): boolean {
  const len = word.length;
  if (row < 0 || col < 0) return false;
  if (dir === "across" ? col + len > SIZE : row + len > SIZE) return false;

  // So'z boshi va oxiri bo'sh bo'lishi kerak
  const beforeR = dir === "across" ? row : row - 1;
  const beforeC = dir === "across" ? col - 1 : col;
  const afterR = dir === "across" ? row : row + len;
  const afterC = dir === "across" ? col + len : col;
  if (grid[beforeR]?.[beforeC]) return false;
  if (grid[afterR]?.[afterC]) return false;

  let crossings = 0;
  for (let i = 0; i < len; i += 1) {
    const r = dir === "across" ? row : row + i;
    const c = dir === "across" ? col + i : col;
    const existing = grid[r]?.[c];

    if (existing) {
      if (existing !== word[i]) return false;
      crossings += 1;
      continue;
    }

    // Bo'sh katak — yon tomonlari ham bo'sh bo'lsin
    if (dir === "across") {
      if (grid[r - 1]?.[c] || grid[r + 1]?.[c]) return false;
    } else {
      if (grid[r]?.[c - 1] || grid[r]?.[c + 1]) return false;
    }
  }

  return crossings > 0;
}

function write(grid: (string | null)[][], word: string, row: number, col: number, dir: Direction) {
  for (let i = 0; i < word.length; i += 1) {
    const r = dir === "across" ? row : row + i;
    const c = dir === "across" ? col + i : col;
    grid[r][c] = word[i];
  }
}

/**
 * Krossvord quradi. So'zlar uzunligi bo'yicha tartiblanadi — uzunlari
 * avval joylashadi, shunda kesishmalar ko'proq bo'ladi.
 */
export function buildCrossword(pack: Pack | undefined, limit: number): Crossword {
  // Joylashtirish tasodifga bog'liq — bir necha marta urinib, eng ko'p
  // so'z sig'gan variantni tanlaymiz.
  let best: Crossword | null = null;
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const candidate = buildOnce(pack, limit);
    if (!best || candidate.words.length > best.words.length) best = candidate;
    if (best.skipped === 0) break;
  }
  return best ?? { rows: 0, cols: 0, cells: [], words: [], skipped: 0 };
}

function buildOnce(pack: Pack | undefined, limit: number): Crossword {
  const questions = shuffle(usableQuestions(pack))
    .map((q) => ({ word: normalizeWord(q.answer), clue: q.prompt.trim() }))
    .sort((a, b) => b.word.length - a.word.length)
    .slice(0, Math.max(2, limit));

  const empty: Crossword = { rows: 0, cols: 0, cells: [], words: [], skipped: 0 };
  if (questions.length < 2) return empty;

  const grid: (string | null)[][] = Array.from({ length: SIZE }, () => Array<string | null>(SIZE).fill(null));
  const placed: Placement[] = [];

  // Birinchi so'z markazga gorizontal joylashadi
  const first = questions[0];
  const startRow = Math.floor(SIZE / 2);
  const startCol = Math.floor((SIZE - first.word.length) / 2);
  write(grid, first.word, startRow, startCol, "across");
  placed.push({ ...first, row: startRow, col: startCol, direction: "across" });

  let skipped = 0;

  for (let qi = 1; qi < questions.length; qi += 1) {
    const { word, clue } = questions[qi];
    let done = false;

    // Har bir joylashgan so'z bilan kesishishga urinamiz
    outer: for (const anchor of shuffle(placed)) {
      for (let ai = 0; ai < anchor.word.length; ai += 1) {
        for (let wi = 0; wi < word.length; wi += 1) {
          if (anchor.word[ai] !== word[wi]) continue;

          const dir: Direction = anchor.direction === "across" ? "down" : "across";
          const row = anchor.direction === "across" ? anchor.row - wi : anchor.row + ai;
          const col = anchor.direction === "across" ? anchor.col + ai : anchor.col - wi;

          if (fits(grid, word, row, col, dir)) {
            write(grid, word, row, col, dir);
            placed.push({ word, clue, row, col, direction: dir });
            done = true;
            break outer;
          }
        }
      }
    }

    if (!done) skipped += 1;
  }

  // To'rni kesamiz
  let minR = SIZE;
  let maxR = -1;
  let minC = SIZE;
  let maxC = -1;
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (grid[r][c]) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  if (maxR < 0) return empty;

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  // So'zlarni tartib raqami bilan: yuqoridan pastga, chapdan o'ngga
  const shifted = placed
    .map((p) => ({ ...p, row: p.row - minR, col: p.col - minC }))
    .sort((a, b) => a.row - b.row || a.col - b.col);

  const numbers = new Map<string, number>();
  let counter = 0;
  const words: PlacedWord[] = shifted.map((p) => {
    const key = `${p.row}:${p.col}`;
    if (!numbers.has(key)) {
      counter += 1;
      numbers.set(key, counter);
    }
    return {
      number: numbers.get(key)!,
      answer: p.word,
      clue: p.clue,
      row: p.row,
      col: p.col,
      direction: p.direction,
    };
  });

  // Kataklar
  const cells: (CrosswordCell | null)[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const letter = grid[r + minR][c + minC];
      if (!letter) return null;
      return { row: r, col: c, letter, number: null, words: [] as number[] };
    }),
  );

  words.forEach((word, index) => {
    for (let i = 0; i < word.answer.length; i += 1) {
      const r = word.direction === "across" ? word.row : word.row + i;
      const c = word.direction === "across" ? word.col + i : word.col;
      const cell = cells[r]?.[c];
      if (!cell) continue;
      cell.words.push(index);
      if (i === 0) cell.number = word.number;
    }
  });

  return { rows, cols, cells, words, skipped };
}
