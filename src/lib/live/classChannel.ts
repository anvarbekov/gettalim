/**
 * Sinf kanali.
 *
 * O'qituvchi bir marta bosadi — ayni damda tizimda turgan barcha o'quvchilar
 * o'z qurilmasida kirish ma'lumotini ko'radi.
 *
 * **Muhim:** PIN kanal orqali yuborilmaydi. Signal kelganda har bir qurilma
 * o'z ma'lumotini bazadan **o'zi** oladi (RLS bo'yicha o'quvchi faqat o'z
 * satrini ko'ra oladi). Shuning uchun boshqa o'quvchining PIN kodi hech qachon
 * chet qurilmaga tushmaydi.
 */

export const classChannelName = (classId: string) => `gettalim:class:${classId}`;

export const CLASS_EVENT = {
  /** Ma'lumotni ko'rsatish. */
  show: "credentials-show",
  /** Yopish. */
  hide: "credentials-hide",
} as const;

/** Presence yozuvi — o'qituvchi kim onlayn ekanini ko'radi. */
export interface ClassPresence {
  name: string;
  at: number;
}
