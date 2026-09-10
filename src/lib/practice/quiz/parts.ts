import type { PracticeItem } from "@/lib/practice/quiz/types";

/**
 * "Kompyuter qismlari" mashqi.
 *
 * Savollar ikki turda: qurilmani tanish (bu nima?) va vazifasini bilish
 * (nima qiladi?). Ikkinchisi muhimroq — yodlash emas, tushunish kerak.
 */
export const PARTS_ITEMS: PracticeItem[] = [
  {
    id: "p1",
    prompt: "Bu qurilma nima?",
    options: ["Protsessor (CPU)", "Operativ xotira (RAM)", "Videokarta (GPU)", "Quvvat manbai"],
    answer: "Protsessor (CPU)",
    level: 1,
    media: { kind: "device", emoji: "🧠", caption: "Kompyuterning «miyasi» — barcha hisob-kitoblarni bajaradi" },
    explanation:
      "Protsessor barcha buyruqlarni bajaradi va tizimning tezligini belgilaydi. Uni kompyuterning miyasi deyishadi.",
  },
  {
    id: "p2",
    prompt: "Kompyuter o'chganda ma'lumot qaysi qurilmada yo'qoladi?",
    options: ["Operativ xotirada (RAM)", "Qattiq diskda (HDD)", "SSD da", "Flesh xotirada"],
    answer: "Operativ xotirada (RAM)",
    level: 2,
    explanation:
      "RAM — vaqtinchalik xotira, tok uzilishi bilan tozalanadi. Shuning uchun ish tugashidan oldin faylni saqlash kerak: saqlanmagan hujjat aynan RAM da turadi.",
  },
  {
    id: "p3",
    prompt: "Barcha qurilmalarni o'zaro bog'laydigan asosiy plata qanday ataladi?",
    options: ["Anakart (Motherboard)", "Videokarta", "Protsessor", "Korpus"],
    answer: "Anakart (Motherboard)",
    level: 1,
    media: { kind: "device", emoji: "🔲", caption: "Barcha qismlar shunga ulanadi" },
    explanation:
      "Anakart — kompyuterning asosiy platasi. Protsessor, xotira, videokarta va boshqa barcha qurilmalar shunga ulanadi va u orqali ma'lumot almashadi.",
  },
  {
    id: "p4",
    prompt: "Videokarta (GPU) asosan nima uchun kerak?",
    options: [
      "Grafik ma'lumotni qayta ishlab, monitorga chiqarish",
      "Fayllarni doimiy saqlash",
      "Elektr tokini o'zgartirish",
      "Tizimni sovutish",
    ],
    answer: "Grafik ma'lumotni qayta ishlab, monitorga chiqarish",
    level: 1,
    media: { kind: "device", emoji: "🎮", caption: "O'yin, video montaj va grafik dizayn uchun" },
    explanation:
      "Videokarta tasvirni hisoblab, ekranga chiqaradi. O'yin, video montaj va 3D grafikada asosiy yukni u ko'taradi.",
  },
  {
    id: "p5",
    prompt: "220V tokni kompyuterga mos kuchlanishga kim aylantiradi?",
    options: ["Quvvat manbai (Power Supply)", "Anakart", "Korpus fanlari", "Protsessor"],
    answer: "Quvvat manbai (Power Supply)",
    level: 2,
    media: { kind: "device", emoji: "⚡", caption: "Rozetkadan olingan tokni tarqatadi" },
    explanation:
      "Quvvat manbai rozetkadagi 220 voltni 12, 5 va 3.3 voltga aylantirib, har bir qurilmaga keraklisini beradi. Kuchsiz quvvat manbai butun tizimni beqaror qiladi.",
  },
  {
    id: "p6",
    prompt: "HDD va SSD orasidagi asosiy farq nima?",
    options: [
      "SSD da harakatlanuvchi qism yo'q va u ancha tez",
      "HDD tezroq ishlaydi",
      "SSD faqat video saqlaydi",
      "HDD ma'lumotni vaqtincha saqlaydi",
    ],
    answer: "SSD da harakatlanuvchi qism yo'q va u ancha tez",
    level: 2,
    explanation:
      "HDD ichida aylanuvchi disk va o'quvchi kalla bor — shuning uchun sekinroq va zarbaga sezgir. SSD esa xotira mikrosxemalaridan iborat: tezroq, jimroq va ishonchliroq.",
  },
  {
    id: "p7",
    prompt: "Korpus fanlari nima uchun kerak?",
    options: [
      "Issiq havoni chiqarib, qismlarni sovutish",
      "Tovushni kuchaytirish",
      "Ma'lumot saqlash",
      "Internetga ulanish",
    ],
    answer: "Issiq havoni chiqarib, qismlarni sovutish",
    level: 1,
    media: { kind: "device", emoji: "🌀", caption: "Ichki haroratni pasaytiradi" },
    explanation:
      "Protsessor va videokarta ishlaganda juda qiziydi. Fanlar issiq havoni chiqarib, salqin havo kiritadi. Sovutish yetarli bo'lmasa, kompyuter sekinlashadi yoki o'chib qoladi.",
  },
  {
    id: "p8",
    prompt: "Qaysi qurilma kiritish qurilmasi hisoblanadi?",
    options: ["Klaviatura", "Monitor", "Printer", "Kolonka"],
    answer: "Klaviatura",
    level: 1,
    explanation:
      "Kiritish qurilmalari kompyuterga ma'lumot beradi: klaviatura, sichqoncha, mikrofon, skaner. Monitor, printer va kolonka esa chiqarish qurilmalari — ular natijani ko'rsatadi.",
  },
  {
    id: "p9",
    prompt: "1 bayt necha bitdan iborat?",
    options: ["8", "16", "10", "4"],
    answer: "8",
    level: 1,
    explanation:
      "Bir bayt — sakkiz bit. Bu bitta harf yoki belgini saqlashga yetadi. Sakkiz bit bilan 256 ta turli qiymat ifodalanadi.",
  },
  {
    id: "p10",
    prompt: "Kompyuter juda sekin ishlayapti va bir vaqtda ko'p dastur ochilgan. Avval nimani oshirish kerak?",
    options: ["Operativ xotirani (RAM)", "Monitor o'lchamini", "Klaviatura tezligini", "Korpus hajmini"],
    answer: "Operativ xotirani (RAM)",
    level: 3,
    explanation:
      "Ko'p dastur bir vaqtda ochilganda ular RAM ni to'ldiradi va tizim diskdan foydalanishga o'tadi — bu esa ancha sekin. Shu holatda RAM qo'shish eng ta'sirli yechim.",
  },
  {
    id: "p11",
    prompt: "Optik disk qurilmasi (ODD) nima qiladi?",
    options: [
      "CD va DVD disklarini o'qiydi",
      "Internetga ulaydi",
      "Tasvirni chiqaradi",
      "Tokni taqsimlaydi",
    ],
    answer: "CD va DVD disklarini o'qiydi",
    level: 1,
    media: { kind: "device", emoji: "💿", caption: "CD, DVD va Blu-ray disklar uchun" },
    explanation:
      "ODD disklardagi ma'lumotni lazer yordamida o'qiydi va yozadi. Hozir u kamdan-kam ishlatiladi, chunki fleshka va internet uni siqib chiqardi.",
  },
  {
    id: "p12",
    prompt: "Qaysi qurilma ma'lumotni tok uzilganda ham saqlab qoladi?",
    options: ["SSD", "Operativ xotira", "Protsessor kesh xotirasi", "Videokarta xotirasi"],
    answer: "SSD",
    level: 2,
    explanation:
      "SSD va HDD — doimiy xotira, tok uzilsa ham ma'lumot qoladi. RAM, kesh va videoxotira esa vaqtinchalik: ular faqat kompyuter ishlab turganda ma'lumot saqlaydi.",
  },
];
