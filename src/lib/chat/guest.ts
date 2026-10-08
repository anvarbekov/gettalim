"use client";

/**
 * Mehmon shaxsi.
 *
 * «Ro'yxatdan o'tmasdan yozish» — lekin butunlay anonim emas. Brauzerda
 * barqaror kalit saqlanadi, shuning uchun:
 *   - bir kishining xabarlari bitta odamga tegishli ekani ko'rinadi;
 *   - o'qituvchi tartib buzganni bloklay oladi;
 *   - keyingi kirishda ism qaytadan so'ralmaydi.
 *
 * Kalit faqat shu brauzerda turadi — hech qanday shaxsiy ma'lumot emas.
 */

const ID_KEY = "gettalim.chat.guest.id";
const NAME_KEY = "gettalim.chat.guest.name";

export interface Guest {
  id: string;
  name: string;
}

export function readGuest(): Guest | null {
  try {
    const id = localStorage.getItem(ID_KEY);
    const name = localStorage.getItem(NAME_KEY);
    if (!id || !name) return null;
    return { id, name };
  } catch {
    return null;
  }
}

export function saveGuest(name: string): Guest {
  let id = "";
  try {
    id = localStorage.getItem(ID_KEY) ?? "";
  } catch {
    /* xotira yopiq */
  }
  if (!id) id = `g_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

  const clean = name.trim().slice(0, 40);
  try {
    localStorage.setItem(ID_KEY, id);
    localStorage.setItem(NAME_KEY, clean);
  } catch {
    /* xotira yopiq — sessiya davomida ishlaydi */
  }
  return { id, name: clean };
}
