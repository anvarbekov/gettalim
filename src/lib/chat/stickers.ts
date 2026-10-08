/**
 * Chat stikerlari.
 *
 * Ikki xil:
 *   - REACTIONS — xabar ostiga bosiladigan kichik belgilar (Telegram'dagi
 *     reaksiyalar kabi). Bir xil belgini ikkinchi marta bosish — olib tashlaydi.
 *   - STICKERS — alohida xabar sifatida yuboriladigan katta stikerlar.
 *     O'qituvchi tez-tez aytadigan gaplar: «Barakalla!», «Jimlik» va hokazo.
 *
 * Rasm emas, emoji + yozuv: hech qanday fayl yuklanmaydi, har qanday
 * ekranda tiniq, internet sekin bo'lsa ham bir zumda chiqadi.
 */

export const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "⭐", "💯", "😮", "🤔", "🎉", "✅", "❌"] as const;

export interface Sticker {
  id: string;
  emoji: string;
  label: string;
  /** Fon gradiyenti (Tailwind ranglari emas — dinamik class'lar yig'ilmay qoladi). */
  from: string;
  to: string;
}

export const STICKERS: Sticker[] = [
  { id: "barakalla", emoji: "🏆", label: "Barakalla!", from: "#f59e0b", to: "#ea580c" },
  { id: "ofarin", emoji: "👏", label: "Ofarin!", from: "#10b981", to: "#0d9488" },
  { id: "alo", emoji: "⭐", label: "A'lo!", from: "#facc15", to: "#f59e0b" },
  { id: "zor", emoji: "🔥", label: "Zo'r!", from: "#f97316", to: "#dc2626" },
  { id: "100", emoji: "💯", label: "100 ball", from: "#ef4444", to: "#be123c" },
  { id: "tabrik", emoji: "🎉", label: "Tabriklayman!", from: "#a855f7", to: "#ec4899" },
  { id: "togri", emoji: "✅", label: "To'g'ri", from: "#22c55e", to: "#15803d" },
  { id: "xato", emoji: "❌", label: "Xato", from: "#f43f5e", to: "#9f1239" },
  { id: "oyla", emoji: "🤔", label: "O'ylab ko'r", from: "#6366f1", to: "#4338ca" },
  { id: "diqqat", emoji: "👀", label: "Diqqat!", from: "#0ea5e9", to: "#1d4ed8" },
  { id: "jim", emoji: "🤫", label: "Jimlik", from: "#64748b", to: "#334155" },
  { id: "tez", emoji: "⚡", label: "Tezroq!", from: "#eab308", to: "#ca8a04" },
  { id: "vaqt", emoji: "⏰", label: "Vaqt tugadi", from: "#fb7185", to: "#e11d48" },
  { id: "uyvazifa", emoji: "📚", label: "Uy vazifasi", from: "#8b5cf6", to: "#6d28d9" },
  { id: "salom", emoji: "👋", label: "Salom!", from: "#38bdf8", to: "#0284c7" },
  { id: "rahmat", emoji: "🙏", label: "Rahmat", from: "#14b8a6", to: "#0f766e" },
  { id: "omad", emoji: "🍀", label: "Omad!", from: "#4ade80", to: "#16a34a" },
  { id: "oldinga", emoji: "🚀", label: "Oldinga!", from: "#3b82f6", to: "#7c3aed" },
  { id: "haha", emoji: "😂", label: "Haha", from: "#fbbf24", to: "#f97316" },
  { id: "yoqdi", emoji: "❤️", label: "Yoqdi", from: "#f472b6", to: "#e11d48" },
];

const BY_ID = new Map(STICKERS.map((s) => [s.id, s]));

export function stickerById(id: string | null | undefined): Sticker | null {
  return id ? BY_ID.get(id) ?? null : null;
}
