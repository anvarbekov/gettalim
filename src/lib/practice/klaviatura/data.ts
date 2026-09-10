/**
 * Klaviatura trenajyori uchun matnlar.
 *
 * Bosqichlar barmoq holatidan boshlanadi: avval faqat asosiy qator
 * (fjdksla), keyin harflar qo'shiladi, so'ng haqiqiy so'zlar va jumlalar.
 * Bu — klassik ketma-ketlik, chunki bola avval barmoqni to'g'ri qo'yishni
 * o'rganishi kerak, keyin tezlik keladi.
 */

export interface TypingLevel {
  id: string;
  nomi: string;
  izoh: string;
  grades: string;
  /** Mashq matnlari — har safar tasodifiy biri tanlanadi. */
  texts: string[];
}

export const TYPING_LEVELS: TypingLevel[] = [
  {
    id: "asos",
    nomi: "1. Asosiy qator",
    izoh: "Barmoqlar joyi: chap qo'l a s d f, o'ng qo'l j k l ;",
    grades: "2–4",
    texts: [
      "fff jjj ddd kkk sss lll aaa fff jjj ddd kkk",
      "fj fj dk dk sl sl a; a; fj dk sl a; fj dk sl",
      "asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf",
      "ffjj ddkk sslllaa ffjj ddkk ssll aa ffjj ddkk",
    ],
  },
  {
    id: "sozlar",
    nomi: "2. Oddiy so'zlar",
    izoh: "Qisqa o'zbekcha so'zlar bilan mashq",
    grades: "3–5",
    texts: [
      "ona ota aka opa non suv olma non kitob qalam daftar",
      "bola qiz uy bog sinf maktab doska stol stul deraza",
      "kun tun oy yil bahor yoz kuz qish issiq sovuq shamol",
      "olma anor uzum shaftoli behi anjir tarvuz qovun nok",
    ],
  },
  {
    id: "jumla",
    nomi: "3. Jumlalar",
    izoh: "Katta harf va tinish belgilari qo'shiladi",
    grades: "5–7",
    texts: [
      "Bugun havo juda issiq. Biz bogda oynadik.",
      "Kompyuter ishlashi uchun protsessor va xotira kerak.",
      "Maktabda informatika darsi eng qiziqarli fan hisoblanadi.",
      "Har kuni kitob oqigan bola tez orada kop narsani biladi.",
    ],
  },
  {
    id: "terminlar",
    nomi: "4. Informatika atamalari",
    izoh: "Fanga oid so'zlar va inglizcha atamalar",
    grades: "6–9",
    texts: [
      "protsessor xotira klaviatura sichqoncha monitor printer skaner",
      "internet brauzer sayt fayl papka dastur tizim algoritm",
      "keyboard mouse monitor folder file program system network",
      "bayt kilobayt megabayt gigabayt terabayt bit ikkilik sanoq",
    ],
  },
  {
    id: "kod",
    nomi: "5. Belgilar va raqamlar",
    izoh: "Yuqori qator: raqamlar, qavslar, belgilar",
    grades: "8–11",
    texts: [
      "1234567890 !@#$%^&*() 1234567890 !@#$%^&*()",
      "=SUM(A1:A10) =IF(B2>60; \"Otdi\"; \"Yiqildi\") =AVERAGE(C1:C9)",
      "192.168.1.1 255.255.255.0 8.8.8.8 127.0.0.1",
      "#FF5733 #2F7EE0 0x7FFF 0b10110101 1024 2048 4096",
    ],
  },
];

/** So'z/daqiqa: standart hisob — 5 belgi bitta so'z deb olinadi. */
export function wordsPerMinute(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  return Math.round((chars / 5) * (60000 / ms));
}

export function accuracy(correct: number, typed: number): number {
  if (typed <= 0) return 100;
  return Math.max(0, Math.round((correct / typed) * 100));
}

/** Natijaga baho — bolaga tushunarli til bilan. */
export function verdict(wpm: number, acc: number): { title: string; note: string; tone: "great" | "good" | "work" } {
  if (acc < 85) {
    return {
      title: "Aniqlikni oshiring",
      note: "Tezlik keyin keladi. Avval xatosiz yozishga harakat qiling — barmoqni to'g'ri klavishaga qo'ying.",
      tone: "work",
    };
  }
  if (wpm >= 40) {
    return { title: "Ajoyib tezlik!", note: "Bu daraja katta odamlarning o'rtacha tezligidan yuqori.", tone: "great" };
  }
  if (wpm >= 25) {
    return { title: "Yaxshi natija", note: "Muntazam mashq qilsangiz, tez orada 40 so'z/daqiqaga chiqasiz.", tone: "good" };
  }
  return {
    title: "Yaxshi boshlanish",
    note: "Har dars 3–5 daqiqa mashq qiling. Bir oyda natija sezilarli o'zgaradi.",
    tone: "good",
  };
}

/* ------------------------------------------------------------------ */
/*  Rekordlarni saqlash                                                */
/* ------------------------------------------------------------------ */

const KEY = "gettalim.typing.v1";

export interface TypingRecord {
  wpm: number;
  accuracy: number;
  at: string;
}

export function readRecords(): Record<string, TypingRecord> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Record<string, TypingRecord>) : {};
  } catch {
    return {};
  }
}

/** Rekord faqat yaxshilanganda yangilanadi. */
export function saveRecord(levelId: string, wpm: number, acc: number): boolean {
  try {
    const all = readRecords();
    const current = all[levelId];
    if (current && current.wpm >= wpm) return false;
    all[levelId] = { wpm, accuracy: acc, at: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}
