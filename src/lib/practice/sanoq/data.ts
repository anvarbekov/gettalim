/**
 * Sanoq sistemalari mashqi.
 *
 * Bu mavzu odatda eng og'ir o'zlashtiriladi, chunki bola raqamlarni
 * ko'zi bilan ko'rmaydi. Shuning uchun mashqda har bir bit — lampochka:
 * yonsa 1, o'chsa 0. Son ko'z oldida yig'iladi.
 */

export type Base = 2 | 10 | 16;

export const BASE_NAME: Record<Base, string> = {
  2: "Ikkilik",
  10: "O'nlik",
  16: "O'n oltilik",
};

export const BASE_SHORT: Record<Base, string> = { 2: "2", 10: "10", 16: "16" };

/** Sonni berilgan asosga o'tkazadi. */
export function toBase(value: number, base: Base): string {
  if (value === 0) return "0";
  return value.toString(base).toUpperCase();
}

/** Matnni songa o'tkazadi. Noto'g'ri belgi bo'lsa `null`. */
export function fromBase(text: string, base: Base): number | null {
  const clean = text.trim().toUpperCase();
  if (!clean) return null;

  const digits = "0123456789ABCDEF".slice(0, base);
  for (const ch of clean) {
    if (!digits.includes(ch)) return null;
  }

  const value = Number.parseInt(clean, base);
  return Number.isNaN(value) ? null : value;
}

/** Bitlar massivi (chapdan o'ngga, eng katta razryad birinchi). */
export function toBits(value: number, width = 8): number[] {
  const bits: number[] = [];
  for (let i = width - 1; i >= 0; i -= 1) bits.push((value >> i) & 1);
  return bits;
}

export const bitsToValue = (bits: number[]) =>
  bits.reduce((sum, bit, i) => sum + bit * 2 ** (bits.length - 1 - i), 0);

/** Razryad qiymati: 128, 64, 32… */
export const bitWeight = (index: number, width: number) => 2 ** (width - 1 - index);

/* ------------------------------------------------------------------ */
/*  Nazariya                                                           */
/* ------------------------------------------------------------------ */

export interface TheorySection {
  title: string;
  body: string[];
  /** Ixtiyoriy misol — kod ko'rinishida chiqadi. */
  example?: { label: string; rows: [string, string][] };
}

export const THEORY: TheorySection[] = [
  {
    title: "Sanoq sistemasi nima?",
    body: [
      "Sanoq sistemasi — bu sonlarni yozish usuli. Unda nechta raqam ishlatilishi «asos» deb ataladi.",
      "Biz kundalik hayotda o'nlik sistemadan foydalanamiz: 0 dan 9 gacha o'nta raqam bor. Bu tasodif emas — odamning ikki qo'lida o'nta barmoq bor va sanash shundan boshlangan.",
      "Har bir raqamning qiymati uning turgan o'rniga bog'liq. Masalan 235 sonida 2 — yuzlikni, 3 — o'nlikni, 5 — birlikni bildiradi.",
    ],
    example: {
      label: "235 sonining tuzilishi",
      rows: [
        ["2 × 100", "200"],
        ["3 × 10", "30"],
        ["5 × 1", "5"],
        ["Jami", "235"],
      ],
    },
  },
  {
    title: "Nega kompyuter ikkilik sistemadan foydalanadi?",
    body: [
      "Kompyuter ichida hamma narsa elektr signaliga aylanadi. Signal esa faqat ikki holatda bo'la oladi: tok bor yoki tok yo'q. Yoritilgan lampochka va o'chgan lampochka kabi.",
      "Shuning uchun kompyuter uchun eng qulay sistema — ikkilik: faqat 0 va 1. Nol — tok yo'q, bir — tok bor.",
      "Agar kompyuter o'nlik sistemada ishlaganida, u o'nta turli kuchlanish darajasini bir-biridan ajrata olishi kerak bo'lardi. Bu esa xatolarga olib kelardi: kuchlanish biroz o'zgarsa, 6 ni 7 deb o'qib yuborishi mumkin. Ikki holatni chalkashtirish esa deyarli imkonsiz.",
      "Bitta 0 yoki 1 — bu bir bit. Sakkizta bit birlashib bayt hosil qiladi, u esa bitta harf yoki belgini saqlashga yetadi.",
    ],
    example: {
      label: "Bit va bayt",
      rows: [
        ["1 bit", "0 yoki 1"],
        ["1 bayt", "8 bit"],
        ["1 bayt nechta qiymat", "256 ta (0–255)"],
        ["1 Kbayt", "1024 bayt"],
      ],
    },
  },
  {
    title: "Ikkilik sondan o'nlikka qanday o'tiladi?",
    body: [
      "Har bir bitning o'z «og'irligi» bor: o'ngdan chapga qarab 1, 2, 4, 8, 16, 32, 64, 128 — ya'ni ikkining darajalari.",
      "Faqat 1 turgan razryadlarning og'irliklari qo'shiladi, xolos. 0 turgan joylar hisobga olinmaydi.",
      "Mashqda buni lampochkalar orqali ko'rasiz: qaysi lampochka yonsa, uning tagidagi son yig'indiga qo'shiladi.",
    ],
    example: {
      label: "10110101 → o'nlik",
      rows: [
        ["1 × 128", "128"],
        ["0 × 64", "0"],
        ["1 × 32", "32"],
        ["1 × 16", "16"],
        ["0 × 8", "0"],
        ["1 × 4", "4"],
        ["0 × 2", "0"],
        ["1 × 1", "1"],
        ["Jami", "181"],
      ],
    },
  },
  {
    title: "O'nlik sondan ikkilikka",
    body: [
      "Sonni 2 ga bo'lib boramiz va har safar qoldiqni yozib qo'yamiz. Bo'linma nolga aylanganda to'xtaymiz.",
      "Keyin qoldiqlarni pastdan yuqoriga qarab o'qiymiz — bu ikkilik son bo'ladi.",
      "Ikkinchi usul ham bor: eng katta razryaddan boshlab, «bu son sig'adimi?» deb so'raymiz. Sig'sa 1 yozamiz va ayiramiz, sig'masa 0 yozamiz.",
    ],
    example: {
      label: "13 → ikkilik",
      rows: [
        ["13 : 2", "6, qoldiq 1"],
        ["6 : 2", "3, qoldiq 0"],
        ["3 : 2", "1, qoldiq 1"],
        ["1 : 2", "0, qoldiq 1"],
        ["Pastdan o'qiymiz", "1101"],
      ],
    },
  },
  {
    title: "O'n oltilik sistema nima uchun kerak?",
    body: [
      "Ikkilik sonlar juda uzun bo'ladi: bitta bayt sakkizta belgi bilan yoziladi. Odamga buni o'qish qiyin.",
      "O'n oltilik sistemada 16 ta raqam bor: 0–9 va A, B, C, D, E, F. Bu yerda A — o'n, F — o'n besh.",
      "Sirri shundaki, to'rtta bit aynan bitta o'n oltilik raqamga to'g'ri keladi. Shuning uchun bitta baytni ikki belgi bilan yozish mumkin: 11010110 → D6.",
      "Shu sababli o'n oltilik sistema dasturlashda, ranglarni yozishda va xotira manzillarida ishlatiladi.",
    ],
    example: {
      label: "Qayerda uchraydi",
      rows: [
        ["Rang kodi", "#FF5733"],
        ["MAC manzil", "A4:B1:C2:D3:E4:F5"],
        ["Xotira manzili", "0x7FFF"],
        ["Bitta bayt", "00–FF (0–255)"],
      ],
    },
  },
  {
    title: "Bu bilim qayerda kerak bo'ladi?",
    body: [
      "Rang kodlari: veb-sahifada #FF0000 — qip-qizil rang. FF — bu 255, ya'ni qizil rang eng yuqori darajada.",
      "Fayl hajmi: 1 Kbayt nega 1000 emas, 1024 baytga teng? Chunki 1024 = 2¹⁰ — bu ikkilik sistemaning tabiiy qadami.",
      "Tarmoq: IP manzillar va tarmoq niqoblari ikkilik sonlar ustida ishlaydi.",
      "Ruxsatlar: Linux tizimida fayl huquqlari 755 kabi sonlar bilan beriladi — bu ham razryadlar yig'indisi.",
      "Eng muhimi: kompyuter ichida nima sodir bo'layotganini tushunish. Kim ikkilik sistemani biladi, u kompyuterni sehrli quti deb emas, tushunarli mashina deb ko'radi.",
    ],
  },
];
