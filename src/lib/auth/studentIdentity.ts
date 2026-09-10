/**
 * O'quvchi hisobini aniqlash.
 *
 * Maktabda o'quvchilarda pochta bo'lmaydi, shuning uchun ular
 * **sinf kodi + ism + 4 xonali PIN** bilan kiradi. Kirish ma'lumotlari
 * shu uchtasidan hisoblab topiladi — bazadan oldindan hech narsa
 * o'qish shart emas (bu esa RLS'ni ochiq qoldirmaslikka imkon beradi).
 *
 * O'qituvchi o'quvchi hisobini yaratganda ham xuddi shu funksiyalar
 * ishlatiladi, shuning uchun ikkala tomon bir xil natijaga keladi.
 */

/** Ism → xavfsiz identifikator. Kirill va apostroflar hisobga olinadi. */
export function slugifyName(name: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh",
    щ: "sh", ы: "i", э: "e", ю: "yu", я: "ya", ъ: "", ь: "",
    ў: "o", қ: "q", ғ: "g", ҳ: "h",
  };

  return name
    .toLowerCase()
    .trim()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[''`ʻʼ’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Sinf kodi normallashtiriladi — katta harf, faqat harf va raqam. */
export const normalizeClassCode = (code: string) =>
  code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

/**
 * Supabase auth uchun sintetik pochta. Haqiqiy pochta emas —
 * shuning uchun Supabase'da "Confirm email" o'chirilgan bo'lishi kerak.
 */
export function studentEmail(classCode: string, fullName: string): string {
  return `stu.${normalizeClassCode(classCode).toLowerCase()}.${slugifyName(fullName)}@gettalim.local`;
}

/** PIN → parol. Supabase kamida 6 belgi talab qiladi. */
export const studentPassword = (pin: string) => `${pin.trim()}-gt`;

/** O'quvchi profilida saqlanadigan qisqa kod (o'qituvchi ro'yxatida ko'rinadi). */
export const studentCode = (classCode: string, fullName: string) =>
  `${normalizeClassCode(classCode)}-${slugifyName(fullName).slice(0, 12)}`;

/** Tasodifiy 4 xonali PIN. */
export const randomPin = () => String(Math.floor(1000 + Math.random() * 9000));

/** Sinf uchun tasodifiy kod: o'qish oson bo'lishi uchun chalkash harflar yo'q. */
export function randomClassCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}
