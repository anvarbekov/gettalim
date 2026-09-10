import type { PracticeItem } from "@/lib/practice/quiz/types";

/**
 * "Excel formulalari" mashqi.
 *
 * Har bir topshiriqda kichik jadval ko'rsatiladi va formulaning natijasi
 * yoki to'g'ri yozilishi so'raladi. Bola jadvalni ko'rib turgani uchun
 * javobni yodlamaydi, hisoblab topadi.
 */
export const EXCEL_ITEMS: PracticeItem[] = [
  {
    id: "e1",
    prompt: "=SUM(B2:B4) formulasi qanday natija beradi?",
    options: ["255", "85", "3", "B2:B4"],
    answer: "255",
    level: 1,
    media: {
      kind: "sheet",
      headers: ["A — Fan", "B — Ball"],
      rows: [
        ["Matematika", "90"],
        ["Fizika", "85"],
        ["Informatika", "80"],
      ],
    },
    explanation:
      "SUM belgilangan katakchalar yig'indisini hisoblaydi: 90 + 85 + 80 = 255. Ikki nuqta (:) «dan ... gacha» degani.",
  },
  {
    id: "e2",
    prompt: "O'rtacha ballni topish uchun qaysi formula to'g'ri?",
    options: ["=AVERAGE(B2:B4)", "=SUM(B2:B4)", "=COUNT(B2:B4)", "=MAX(B2:B4)"],
    answer: "=AVERAGE(B2:B4)",
    level: 1,
    media: {
      kind: "sheet",
      headers: ["A — Fan", "B — Ball"],
      rows: [
        ["Matematika", "90"],
        ["Fizika", "85"],
        ["Informatika", "80"],
      ],
    },
    explanation:
      "AVERAGE o'rta arifmetikni hisoblaydi: (90 + 85 + 80) / 3 = 85. SUM yig'indini, COUNT sonini, MAX eng kattasini beradi.",
  },
  {
    id: "e3",
    prompt: "Har bir formulaning boshida nima turishi shart?",
    options: ["= belgisi", "+ belgisi", "Qavs", "Nuqta-vergul"],
    answer: "= belgisi",
    level: 1,
    explanation:
      "Excel katakchadagi yozuvni faqat = belgisidan boshlangan bo'lsa formula deb tushunadi. Aks holda u oddiy matn bo'lib qoladi.",
  },
  {
    id: "e4",
    prompt: "=IF(B2>=60; \"O'tdi\"; \"Yiqildi\") formulasi B2=55 bo'lganda nima qaytaradi?",
    options: ["Yiqildi", "O'tdi", "55", "Xato"],
    answer: "Yiqildi",
    level: 2,
    media: {
      kind: "sheet",
      headers: ["A — O'quvchi", "B — Ball"],
      rows: [["Alisher", "55"]],
      formula: '=IF(B2>=60; "O\'tdi"; "Yiqildi")',
    },
    explanation:
      "IF shartni tekshiradi: 55 >= 60 emas, shuning uchun ikkinchi javob qaytadi. IF ning tuzilishi: shart, rost bo'lsa nima, yolg'on bo'lsa nima.",
  },
  {
    id: "e5",
    prompt: "Eng yuqori ballni topish uchun qaysi funksiya kerak?",
    options: ["MAX", "MIN", "SUM", "COUNT"],
    answer: "MAX",
    level: 1,
    explanation:
      "MAX eng katta qiymatni, MIN eng kichigini qaytaradi. Bahoni tahlil qilishda ikkalasi ham tez-tez ishlatiladi.",
  },
  {
    id: "e6",
    prompt: "=COUNT(B2:B6) formulasi nimani sanaydi?",
    options: [
      "Ichida son turgan katakchalar sonini",
      "Barcha katakchalar sonini",
      "Bo'sh katakchalar sonini",
      "Matn turgan katakchalar sonini",
    ],
    answer: "Ichida son turgan katakchalar sonini",
    level: 2,
    explanation:
      "COUNT faqat sonlarni sanaydi. Matn va bo'sh katakchalar hisobga olinmaydi. Hamma to'ldirilgan katakchani sanash uchun COUNTA ishlatiladi.",
  },
  {
    id: "e7",
    prompt: "A1 katakchani formulani ko'chirganda ham o'zgarmas qilish uchun qanday yoziladi?",
    options: ["$A$1", "A1", "A$1$", "«A1»"],
    answer: "$A$1",
    level: 3,
    explanation:
      "Dollar belgisi manzilni qotiradi. $A$1 — ustun ham, qator ham o'zgarmaydi. Bu masalan soliq foizi turgan bitta katakchaga hamma formuladan murojaat qilganda kerak bo'ladi.",
  },
  {
    id: "e8",
    prompt: "Jadvalda #DIV/0! xatosi chiqdi. Sababi nima?",
    options: [
      "Nolga bo'lishga urinilgan",
      "Formulada = qo'yilmagan",
      "Katakcha tor",
      "Fayl saqlanmagan",
    ],
    answer: "Nolga bo'lishga urinilgan",
    level: 2,
    explanation:
      "Excel nolga bo'lishni bajara olmaydi. Ko'pincha bo'luvchi katakcha bo'sh qolganda chiqadi. IF bilan oldini olish mumkin: bo'luvchi nolmi, deb tekshiriladi.",
  },
  {
    id: "e9",
    prompt: "Bu formulaning natijasi qancha?",
    options: ["30", "20", "50", "10"],
    answer: "30",
    level: 2,
    media: {
      kind: "sheet",
      headers: ["A", "B", "C"],
      rows: [["10", "20", "=A1+B1"]],
      formula: "=A1+B1",
    },
    explanation:
      "Formula boshqa katakchalarga murojaat qiladi: A1 = 10, B1 = 20, natija 30. Agar A1 o'zgarsa, natija ham o'zi yangilanadi — bu jadvallarning asosiy kuchi.",
  },
  {
    id: "e10",
    prompt: "Katakchada ##### belgilari chiqdi. Nima qilish kerak?",
    options: [
      "Ustun kengligini oshirish",
      "Formulani o'chirish",
      "Faylni qayta ochish",
      "Boshqa varaqqa ko'chirish",
    ],
    answer: "Ustun kengligini oshirish",
    level: 1,
    explanation:
      "Bu xato emas: son katakchaga sig'mayapti, xolos. Ustun chegarasini surib kengaytirsangiz yoki chegarasiga ikki marta bossangiz, son ko'rinadi.",
  },
  {
    id: "e11",
    prompt: "Faqat 60 dan yuqori ballarni sanash uchun qaysi funksiya kerak?",
    options: ["COUNTIF", "COUNT", "SUM", "IF"],
    answer: "COUNTIF",
    level: 3,
    explanation:
      "COUNTIF shart bo'yicha sanaydi: =COUNTIF(B2:B20; \">60\"). Oddiy COUNT shartni bilmaydi, IF esa bitta katakchani tekshiradi.",
  },
  {
    id: "e12",
    prompt: "Jadvalda ma'lumotni kattadan kichikka tartiblash qanday ataladi?",
    options: ["Saralash (Sort)", "Filtr (Filter)", "Formula", "Diagramma"],
    answer: "Saralash (Sort)",
    level: 1,
    explanation:
      "Saralash qatorlarni tartibga soladi, filtr esa keraksizlarini vaqtincha yashiradi. Ballarni saralasangiz, eng yuqori natija tepaga chiqadi.",
  },
];
