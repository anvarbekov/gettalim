/**
 * "Algoritm yig'ish" mashqi uchun topshiriqlar.
 *
 * Qiyinlik bosqichma-bosqich ortadi:
 *  - 2–4 sinf: kundalik ishlar, 4–6 qadam, faqat ketma-ketlik;
 *  - 5–7 sinf: kompyuterdagi amallar, shart bloki paydo bo'ladi;
 *  - 8–9 sinf: sonlar bilan ishlash, takrorlanish;
 *  - 10–11 sinf: klassik algoritmlar (saralash, qidiruv, EKUB).
 *
 * Har bir qadamning turi bor — blok-sxemadagi shakli shunga qarab chiziladi.
 */

export type StepKind = "start" | "action" | "input" | "output" | "condition" | "loop" | "end";

export interface AlgoStep {
  /** Qadam matni. */
  text: string;
  kind: StepKind;
}

export interface AlgoTask {
  id: string;
  title: string;
  /** Qisqa vaziyat tavsifi — bola nima qilishini tushunishi uchun. */
  intro: string;
  /** Qaysi sinflarga. */
  level: AlgoLevel;
  /** To'g'ri tartibdagi qadamlar. */
  steps: AlgoStep[];
  /** Yechilgandan keyin ko'rsatiladigan izoh — asosiy o'quv fikri. */
  lesson: string;
}

export type AlgoLevel = "2-4" | "5-7" | "8-9" | "10-11";

export const LEVELS: { id: AlgoLevel; nomi: string; izoh: string }[] = [
  { id: "2-4", nomi: "2–4 sinf", izoh: "Kundalik ishlar ketma-ketligi" },
  { id: "5-7", nomi: "5–7 sinf", izoh: "Kompyuterdagi amallar va shartlar" },
  { id: "8-9", nomi: "8–9 sinf", izoh: "Sonlar, takrorlanish, mantiq" },
  { id: "10-11", nomi: "10–11 sinf", izoh: "Klassik algoritmlar" },
];

export const STEP_STYLE: Record<StepKind, { label: string; color: string; shape: string }> = {
  start: { label: "Boshlanish", color: "#1f9d63", shape: "rounded-full" },
  action: { label: "Amal", color: "#1f6fd0", shape: "rounded-xl" },
  input: { label: "Kiritish", color: "#7a3fd0", shape: "rounded-xl" },
  output: { label: "Chiqarish", color: "#0f9b8e", shape: "rounded-xl" },
  condition: { label: "Shart", color: "#e0a92e", shape: "rounded-xl" },
  loop: { label: "Takrorlash", color: "#d2402f", shape: "rounded-xl" },
  end: { label: "Tugash", color: "#12233f", shape: "rounded-full" },
};

/* ------------------------------------------------------------------ */
/*  2–4 sinf — kundalik ishlar                                         */
/* ------------------------------------------------------------------ */

const GRADE_2_4: AlgoTask[] = [
  {
    id: "choy",
    title: "Choy damlash",
    intro: "Onangizga choy damlab bermoqchisiz. Qadamlarni to'g'ri tartibga soling.",
    level: "2-4",
    lesson:
      "Algoritm — bu ish qadamlarining aniq ketma-ketligi. Qadamlar o'rni almashsa, natija chiqmaydi: qaynamagan suv bilan choy damlab bo'lmaydi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Choynakka suv quyish", kind: "action" },
      { text: "Suvni qaynatish", kind: "action" },
      { text: "Choynakka choy solish", kind: "action" },
      { text: "Qaynagan suvni quyish", kind: "action" },
      { text: "5 daqiqa kutish", kind: "action" },
      { text: "Piyolaga quyish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "maktab",
    title: "Maktabga tayyorgarlik",
    intro: "Ertalab maktabga chiqishdan oldin nima qilasiz?",
    level: "2-4",
    lesson:
      "Ba'zi qadamlarni almashtirsa bo'ladi, ba'zilarini yo'q. Kiyinmasdan turib maktabga chiqib bo'lmaydi — bu majburiy tartib.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Uyg'onish", kind: "action" },
      { text: "Yuzni yuvish", kind: "action" },
      { text: "Nonushta qilish", kind: "action" },
      { text: "Kiyinish", kind: "action" },
      { text: "Sumkani olish", kind: "action" },
      { text: "Maktabga chiqish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "rasm",
    title: "Kompyuterda rasm chizish",
    intro: "Paint dasturida rasm chizib, uni saqlamoqchisiz.",
    level: "2-4",
    lesson:
      "Kompyuterdagi ish ham algoritm: dasturni ochmasdan chizib bo'lmaydi, chizmasdan saqlab bo'lmaydi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Paint dasturini ochish", kind: "action" },
      { text: "Cho'tka va rangni tanlash", kind: "action" },
      { text: "Rasm chizish", kind: "action" },
      { text: "«Fayl → Saqlash» ni bosish", kind: "action" },
      { text: "Fayl nomini yozish", kind: "input" },
      { text: "«Saqlash» tugmasini bosish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "qollar",
    title: "Qo'lni to'g'ri yuvish",
    intro: "Shifokorlar aytgan tartibda qo'lni yuving.",
    level: "2-4",
    lesson:
      "Aniq algoritm salomatlikni saqlaydi. Sovunni suvsiz surtish yoki yuvmasdan quritish natijani buzadi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Jo'mrakni ochish", kind: "action" },
      { text: "Qo'lni ho'llash", kind: "action" },
      { text: "Sovun surtish", kind: "action" },
      { text: "20 soniya ishqalash", kind: "action" },
      { text: "Suv bilan chayish", kind: "action" },
      { text: "Sochiqda quritish", kind: "action" },
      { text: "Tugash", kind: "end" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  5–7 sinf — kompyuterdagi amallar, shartlar                         */
/* ------------------------------------------------------------------ */

const GRADE_5_7: AlgoTask[] = [
  {
    id: "fayl-saqlash",
    title: "Hujjatni saqlash",
    intro: "Word'da hujjat yozdingiz. Uni flesh xotiraga saqlash kerak.",
    level: "5-7",
    lesson:
      "Shart bloki — algoritmning yo'lini ikkiga ajratadi. Flesh ulanmagan bo'lsa, saqlash amalga oshmaydi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Fleshni USB portga ulash", kind: "action" },
      { text: "Flesh tanildimi?", kind: "condition" },
      { text: "«Fayl → Farqli saqlash» ni tanlash", kind: "action" },
      { text: "Flesh xotirani tanlash", kind: "action" },
      { text: "Fayl nomini kiritish", kind: "input" },
      { text: "«Saqlash» ni bosish", kind: "output" },
      { text: "Fleshni xavfsiz chiqarish", kind: "action" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "dastur",
    title: "Dastur o'rnatish",
    intro: "Internetdan dastur yuklab, kompyuterga o'rnatmoqchisiz.",
    level: "5-7",
    lesson:
      "Xavfsizlik qadami ham algoritmning bir qismi. Tekshirmasdan o'rnatish — kompyuterni virusga ochib qo'yish.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Rasmiy saytni ochish", kind: "action" },
      { text: "Dasturni yuklab olish", kind: "action" },
      { text: "Antivirus bilan tekshirish", kind: "action" },
      { text: "Fayl xavfsizmi?", kind: "condition" },
      { text: "O'rnatish faylini ishga tushirish", kind: "action" },
      { text: "Shartlarga rozilik berish", kind: "input" },
      { text: "O'rnatish tugashini kutish", kind: "action" },
      { text: "Dasturni ochish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "email",
    title: "Elektron xat yuborish",
    intro: "O'qituvchingizga uy vazifasini xat orqali yuborasiz.",
    level: "5-7",
    lesson:
      "Ilova biriktirmasdan «Yuborish» bosilsa, xat bo'sh ketadi. Tekshirish qadami har doim yuborishdan oldin turadi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Pochta xizmatiga kirish", kind: "action" },
      { text: "«Yangi xat» ni bosish", kind: "action" },
      { text: "Qabul qiluvchi manzilini yozish", kind: "input" },
      { text: "Mavzuni yozish", kind: "input" },
      { text: "Faylni biriktirish", kind: "action" },
      { text: "Hammasi to'g'rimi?", kind: "condition" },
      { text: "«Yuborish» ni bosish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "parol",
    title: "Kuchli parol yaratish",
    intro: "Yangi hisob ochyapsiz — parol o'ylab topish kerak.",
    level: "5-7",
    lesson:
      "Parolni tekshirish sikli: talabga javob bermasa, qaytadan o'ylanadi. Bu — takrorlanishning oddiy ko'rinishi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Kamida 8 belgili so'z o'ylash", kind: "action" },
      { text: "Katta va kichik harf qo'shish", kind: "action" },
      { text: "Raqam va belgi qo'shish", kind: "action" },
      { text: "Parol yetarlicha kuchlimi?", kind: "condition" },
      { text: "Kuchsiz bo'lsa — qaytadan o'ylash", kind: "loop" },
      { text: "Parolni saqlash", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  8–9 sinf — sonlar, takrorlanish                                    */
/* ------------------------------------------------------------------ */

const GRADE_8_9: AlgoTask[] = [
  {
    id: "eng-katta",
    title: "Eng katta sonni topish",
    intro: "Uchta son berilgan. Ular ichidan eng kattasini topish algoritmi.",
    level: "8-9",
    lesson:
      "Bu klassik usul: birinchi sonni «eng katta» deb qabul qilamiz, keyin qolganlari bilan solishtiramiz. Har bir shartda qiymat yangilanishi mumkin.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "a, b, c sonlarini kiritish", kind: "input" },
      { text: "max = a deb qabul qilish", kind: "action" },
      { text: "b > max mi?", kind: "condition" },
      { text: "Ha bo'lsa: max = b", kind: "action" },
      { text: "c > max mi?", kind: "condition" },
      { text: "Ha bo'lsa: max = c", kind: "action" },
      { text: "max qiymatini chiqarish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "ortacha",
    title: "O'rta arifmetik",
    intro: "N ta sonning o'rta arifmetigini hisoblash.",
    level: "8-9",
    lesson:
      "Takrorlanish (sikl) — bir xil amalni ko'p marta bajarish. Yig'indi siklda to'planadi, bo'lish esa sikldan keyin bir marta bajariladi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "N sonini kiritish", kind: "input" },
      { text: "yigindi = 0 qilish", kind: "action" },
      { text: "N marta takrorlash", kind: "loop" },
      { text: "Navbatdagi sonni kiritish", kind: "input" },
      { text: "yigindi = yigindi + son", kind: "action" },
      { text: "Sikl tugagach: ortacha = yigindi / N", kind: "action" },
      { text: "Natijani chiqarish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "juft",
    title: "Juft sonlarni sanash",
    intro: "1 dan N gacha bo'lgan sonlar ichida nechta juft son borligini toping.",
    level: "8-9",
    lesson:
      "Hisoblagich (counter) — shart bajarilganda bittaga oshadigan o'zgaruvchi. Qoldiqli bo'lish (mod) juftlikni aniqlashning eng oddiy usuli.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "N sonini kiritish", kind: "input" },
      { text: "hisob = 0 qilish", kind: "action" },
      { text: "i ni 1 dan N gacha yurgizish", kind: "loop" },
      { text: "i 2 ga bo'linadimi?", kind: "condition" },
      { text: "Ha bo'lsa: hisob = hisob + 1", kind: "action" },
      { text: "Sikl tugagach hisobni chiqarish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  10–11 sinf — klassik algoritmlar                                   */
/* ------------------------------------------------------------------ */

const GRADE_10_11: AlgoTask[] = [
  {
    id: "ekub",
    title: "EKUB — Evklid algoritmi",
    intro: "Ikki sonning eng katta umumiy bo'luvchisini topishning eng qadimiy algoritmi.",
    level: "10-11",
    lesson:
      "Evklid algoritmi 2300 yildan beri ishlatiladi. Sirri oddiy: katta sonni kichigiga bo'lib, qoldiq bilan davom etiladi. Qoldiq nolga aylanganda javob topiladi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "a va b sonlarini kiritish", kind: "input" },
      { text: "b ≠ 0 ekan, takrorlash", kind: "loop" },
      { text: "qoldiq = a mod b", kind: "action" },
      { text: "a = b qilish", kind: "action" },
      { text: "b = qoldiq qilish", kind: "action" },
      { text: "Sikl tugagach: javob = a", kind: "action" },
      { text: "Javobni chiqarish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "saralash",
    title: "Pufakcha saralash",
    intro: "Sonlar ro'yxatini o'sish tartibida saralash.",
    level: "10-11",
    lesson:
      "Pufakcha saralashda katta sonlar ro'yxat oxiriga «suzib» chiqadi. Ikkita ichma-ich sikl kerak: tashqisi o'tishlar, ichkisi qo'shnilarni solishtiradi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Ro'yxatni kiritish", kind: "input" },
      { text: "Tashqi sikl: n-1 marta", kind: "loop" },
      { text: "Ichki sikl: qo'shnilarni ko'rish", kind: "loop" },
      { text: "Chapdagi o'ngdagidan kattami?", kind: "condition" },
      { text: "Ha bo'lsa: joylarini almashtirish", kind: "action" },
      { text: "Sikllar tugagach ro'yxat saralangan", kind: "action" },
      { text: "Ro'yxatni chiqarish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
  {
    id: "binary",
    title: "Ikkilik qidiruv",
    intro: "Saralangan ro'yxatdan kerakli sonni tez topish.",
    level: "10-11",
    lesson:
      "Ikkilik qidiruv har qadamda qidiruv maydonini ikki barobar qisqartiradi. 1000 ta elementdan sonni topish uchun 10 ta qadam yetadi — oddiy qidiruvda 1000 ta kerak bo'lardi.",
    steps: [
      { text: "Boshlash", kind: "start" },
      { text: "Saralangan ro'yxat va qidiruv sonini kiritish", kind: "input" },
      { text: "chap = 0, ong = n-1 qilish", kind: "action" },
      { text: "chap ≤ ong ekan, takrorlash", kind: "loop" },
      { text: "orta = (chap + ong) / 2", kind: "action" },
      { text: "O'rtadagi son qidirilayotganimi?", kind: "condition" },
      { text: "Kichik bo'lsa: chap = orta + 1", kind: "action" },
      { text: "Katta bo'lsa: ong = orta - 1", kind: "action" },
      { text: "Natijani chiqarish", kind: "output" },
      { text: "Tugash", kind: "end" },
    ],
  },
];

export const ALGO_TASKS: AlgoTask[] = [...GRADE_2_4, ...GRADE_5_7, ...GRADE_8_9, ...GRADE_10_11];

export const tasksByLevel = (level: AlgoLevel) => ALGO_TASKS.filter((t) => t.level === level);
