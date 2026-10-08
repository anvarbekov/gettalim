/**
 * Tashqi o'quv vositalari.
 *
 * GetMotion — o'quvchilar video va animatsiya qiladigan muharrir. Undagi
 * ishlarning havolasi «Mening ishlarim» va uy vazifasiga qo'yiladi.
 */

export const GETMOTION_URL = "https://getmotions.netlify.app/";

export function isGetMotion(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname === "getmotions.netlify.app";
  } catch {
    return false;
  }
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

/** «8-okt, 09:29» — brauzer tiliga bog'liq bo'lmagan o'zbekcha sana. */
export function uzDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const year = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : "";
  return `${d.getDate()}-${MONTHS[d.getMonth()]}${year}, ${hh}:${mm}`;
}
