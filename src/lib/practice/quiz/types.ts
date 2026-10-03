/**
 * Mashq savoli.
 *
 * Firibgar xatlar, kompyuter qismlari va Excel formulalari mashqlari
 * bir xil tuzilishga ega: vaziyat ko'rsatiladi, variantlar beriladi,
 * javobdan keyin **nima uchun** shunday ekani tushuntiriladi.
 *
 * Shu tuzilma tufayli mashq savollari savol paketiga ham aylanadi va
 * musobaqa rejimida, arqon tortishda, poygada — hamma joyda ishlaydi.
 */
export interface PracticeItem {
  id: string;
  /** Savol matni. */
  prompt: string;
  /** Variantlar. Birinchisi to'g'ri deb yozilmaydi — `answer` alohida. */
  options: string[];
  answer: string;
  /** Javobdan keyingi tushuntirish — mashqning eng qimmatli qismi. */
  explanation: string;
  /** Qo'shimcha ko'rgazma: xat, jadval yoki qurilma tavsifi. */
  media?: PracticeMedia;
  level?: 1 | 2 | 3;
}

export type PracticeMedia =
  | { kind: "email"; from: string; subject: string; body: string; link?: string }
  | { kind: "device"; emoji: string; caption: string }
  | { kind: "sheet"; headers: string[]; rows: string[][]; formula?: string }
  | { kind: "note"; text: string };
