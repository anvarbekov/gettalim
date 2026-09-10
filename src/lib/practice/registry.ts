/**
 * Mashqlar registri.
 *
 * Mashq — bu test emas: bola shu yerda **yangi narsa o'rganadi** yoki
 * ko'nikma mashq qiladi. Har biri 10–15 daqiqalik bo'lak qilib o'ylangan,
 * shuning uchun 90 daqiqalik darsning istalgan joyiga tushadi.
 */

export type PracticeId =
  | "algoritm"
  | "sanoq"
  | "fishing"
  | "qismlar"
  | "excel"
  | "klaviatura";

export type PracticeStatus = "ready" | "planned";

export interface PracticeDef {
  id: PracticeId;
  slug: string;
  nomi: string;
  shior: string;
  tavsif: string;
  ikonka: string;
  rang: string;
  /** Qaysi sinflarga mos. */
  grades: string;
  /** Taxminiy davomiylik (daqiqa). */
  minutes: string;
  status: PracticeStatus;
}

export const PRACTICES: PracticeDef[] = [
  {
    id: "algoritm",
    slug: "algoritm",
    nomi: "Algoritm yig'ish",
    shior: "Qadamlarni to'g'ri tartibga sol",
    tavsif:
      "Aralashtirilgan qadamlardan to'g'ri algoritm tuziladi. 2-sinfda kundalik ishlar, yuqori sinflarda shart va takrorlanish bloklari.",
    ikonka: "🧩",
    rang: "#7a3fd0",
    grades: "2–11",
    minutes: "10–15",
    status: "ready",
  },
  {
    id: "sanoq",
    slug: "sanoq",
    nomi: "Sanoq sistemalari",
    shior: "Ikkilik, o'nlik, o'n oltilik",
    tavsif:
      "Lampochkalar yordamida ikkilik sanoq ko'rinadi. Nazariya va besh xil mashq rejimi — o'nlikdan ikkilikka va aksincha.",
    ikonka: "🔢",
    rang: "#0f9b8e",
    grades: "5–11",
    minutes: "10–20",
    status: "ready",
  },
  {
    id: "fishing",
    slug: "fishing",
    nomi: "Firibgar xatni topish",
    shior: "Raqamli savodxonlik",
    tavsif: "Haqiqiy va soxta xabarlarni ajratish: manzil, havola, iltimos va bosim belgilarini topish.",
    ikonka: "🎣",
    rang: "#d2402f",
    grades: "5–11",
    minutes: "10–15",
    status: "ready",
  },
  {
    id: "qismlar",
    slug: "qismlar",
    nomi: "Kompyuter qismlari",
    shior: "Har bir qism o'z joyiga",
    tavsif: "Tizimli blok ichidagi qurilmalarni joyiga qo'yish va vazifasini eslab qolish.",
    ikonka: "🖥️",
    rang: "#1f6fd0",
    grades: "5–9",
    minutes: "10–15",
    status: "ready",
  },
  {
    id: "excel",
    slug: "excel",
    nomi: "Excel formulalari",
    shior: "SUM, AVERAGE, IF",
    tavsif: "Jadval bilan ishlash: formulani yozish, natijani ko'rish, xatoni topish.",
    ikonka: "📊",
    rang: "#1f9d63",
    grades: "7–11",
    minutes: "15–20",
    status: "ready",
  },
  {
    id: "klaviatura",
    slug: "klaviatura",
    nomi: "Klaviatura trenajyori",
    shior: "Tez va xatosiz yozish",
    tavsif: "Har dars boshida 3–5 daqiqa. So'z/daqiqa va aniqlik o'lchanadi, o'z rekordingizni yangilaysiz.",
    ikonka: "⌨️",
    rang: "#e0a92e",
    grades: "2–11",
    minutes: "3–5",
    status: "ready",
  },
];

export const getPractice = (id: PracticeId) => PRACTICES.find((p) => p.id === id)!;
