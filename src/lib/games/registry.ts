/**
 * O'yinlar registri — platformadagi barcha o'yinlar va ular qo'llab-quvvatlaydigan
 * rejimlar shu yerda e'lon qilinadi. Bosh sahifa, sozlash ekrani va marshrutlar
 * shu ro'yxatdan oziqlanadi, shuning uchun yangi o'yin qo'shish uchun avval shu
 * faylga yozuv qo'shiladi.
 */

export type GameId = "arqon" | "poyga" | "yomgir" | "millioner" | "xazina" | "xotira" | "krossvord";

/**
 * Ishlash rejimlari:
 * - `local`    — doska rejimi: bitta kompyuter + proyektor, internetsiz ishlaydi;
 * - `live`     — ulangan rejim: o'quvchilar o'z qurilmasidan PIN bilan qo'shiladi;
 * - `homework` — mustaqil rejim: uy vazifasi, muddat bilan.
 */
export type GameMode = "local" | "live" | "homework";

/** O'yinning tayyorlik holati — hali yozilmagan o'yinlar bosh sahifada "tez orada" bo'lib turadi. */
export type GameStatus = "ready" | "planned";

export interface GameDef {
  id: GameId;
  /** Marshrut asosi: `/arqon`, `/arqon/play` */
  slug: string;
  nomi: Record<Lang, string>;
  shior: Record<Lang, string>;
  tavsif: Record<Lang, string>;
  ikonka: string;
  rang: string;
  modes: GameMode[];
  minTeams: number;
  maxTeams: number;
  supportsSolo: boolean;
  status: GameStatus;
}

type Lang = "uz" | "ru" | "en";

export const GAMES: GameDef[] = [
  {
    id: "arqon",
    slug: "arqon",
    nomi: { uz: "Arqon tortish", ru: "Перетягивание каната", en: "Tug of War" },
    shior: {
      uz: "Bilim arqonni tortadi",
      ru: "Знания тянут канат",
      en: "Knowledge pulls the rope",
    },
    tavsif: {
      uz: "Ikki jamoa yonma-yon javob beradi. Har bir to'g'ri javob arqonni o'z tomoniga bir qadam tortadi.",
      ru: "Две команды отвечают одновременно. Каждый верный ответ тянет канат на шаг к своей стороне.",
      en: "Two teams answer side by side. Every correct answer drags the rope one step their way.",
    },
    ikonka: "🪢",
    rang: "#1f6fd0",
    modes: ["local", "live"],
    minTeams: 2,
    maxTeams: 2,
    supportsSolo: false,
    status: "ready",
  },
  {
    id: "poyga",
    slug: "poyga",
    nomi: { uz: "Poyga", ru: "Гонка", en: "Race" },
    shior: {
      uz: "To'g'ri javob — oldinga bir qadam",
      ru: "Верный ответ — шаг вперёд",
      en: "A correct answer moves you forward",
    },
    tavsif: {
      uz: "2 dan 4 tagacha jamoa. Ot yoki mashina tanlang — marraga birinchi yetgan jamoa g'olib.",
      ru: "От 2 до 4 команд. Выберите лошадь или машину — побеждает тот, кто первым дойдёт до финиша.",
      en: "From 2 to 4 teams. Pick a horse or a car — first to the finish line wins.",
    },
    ikonka: "🏁",
    rang: "#e0a92e",
    modes: ["local", "live"],
    minTeams: 2,
    maxTeams: 4,
    supportsSolo: false,
    status: "ready",
  },
  {
    id: "yomgir",
    slug: "yomgir",
    nomi: { uz: "Savol yomg'iri", ru: "Дождь вопросов", en: "Question Rain" },
    shior: {
      uz: "Javobni yerga tushgunicha ilib ol",
      ru: "Поймай ответ, пока он не упал",
      en: "Catch the answer before it lands",
    },
    tavsif: {
      uz: "Javob variantlari tepadan tushadi. To'g'risini yerga tushishidan oldin bosing — bo'lmasa jon yo'qoladi.",
      ru: "Варианты ответов падают сверху. Нажмите верный, пока он не упал, иначе теряете жизнь.",
      en: "The answer options fall from the top. Tap the right one before it lands, or you lose a life.",
    },
    ikonka: "🌧️",
    rang: "#0f9b8e",
    modes: ["local", "live", "homework"],
    minTeams: 1,
    maxTeams: 2,
    supportsSolo: true,
    status: "ready",
  },
  {
    id: "millioner",
    slug: "millioner",
    nomi: { uz: "Kim millioner bo'ladi", ru: "Кто хочет стать миллионером", en: "Who Wants to Be a Millionaire" },
    shior: {
      uz: "15 savol, uchta yordam",
      ru: "15 вопросов, три подсказки",
      en: "15 questions, three lifelines",
    },
    tavsif: {
      uz: "Qiyinlik bosqichma-bosqich ortadi. 50/50, zaldan so'rash va qo'ng'iroq yordamga keladi.",
      ru: "Сложность растёт по шагам. Помогут 50/50, помощь зала и звонок другу.",
      en: "Difficulty rises step by step. 50/50, ask the audience and phone a friend can help.",
    },
    ikonka: "💰",
    rang: "#7a3fd0",
    modes: ["local", "live", "homework"],
    minTeams: 1,
    maxTeams: 4,
    supportsSolo: true,
    status: "ready",
  },
  {
    id: "xazina",
    slug: "xazina",
    nomi: { uz: "Xazina xaritasi", ru: "Карта сокровищ", en: "Treasure Map" },
    shior: {
      uz: "Bonus, tuzoq va xazina",
      ru: "Бонусы, ловушки и клад",
      en: "Bonuses, traps and treasure",
    },
    tavsif: {
      uz: "Yo'l bo'ylab qadam tashlang: bonus katagi oldinga uchiradi, tuzoq orqaga qaytaradi.",
      ru: "Шагайте по дорожке: бонус двигает вперёд, ловушка отбрасывает назад.",
      en: "Step along the path: a bonus jumps you forward, a trap drags you back.",
    },
    ikonka: "🗺️",
    rang: "#b07e1f",
    modes: ["local", "live"],
    minTeams: 2,
    maxTeams: 4,
    supportsSolo: false,
    status: "ready",
  },
  {
    id: "xotira",
    slug: "xotira",
    nomi: { uz: "Xotira jufti", ru: "Пары памяти", en: "Memory Pairs" },
    shior: {
      uz: "Atama va ta'rifini juftlang",
      ru: "Соедините термин и определение",
      en: "Match the term with its definition",
    },
    tavsif: {
      uz: "Kartochkalarni ochib, atama bilan ta'rifni juftlang. Lug'at o'rganish uchun eng qulay o'yin.",
      ru: "Открывайте карточки и соединяйте термин с определением. Идеально для запоминания.",
      en: "Flip the cards and match each term to its definition. Ideal for vocabulary.",
    },
    ikonka: "🧠",
    rang: "#d2402f",
    modes: ["local", "live", "homework"],
    minTeams: 1,
    maxTeams: 4,
    supportsSolo: true,
    status: "ready",
  },
  {
    id: "krossvord",
    slug: "krossvord",
    nomi: { uz: "Krossvord", ru: "Кроссворд", en: "Crossword" },
    shior: {
      uz: "Paketdan avtomatik krossvord",
      ru: "Кроссворд из пакета автоматически",
      en: "A crossword built from your pack",
    },
    tavsif: {
      uz: "Savollar paketidan avtomatik krossvord tuziladi. Chop etib, daftarga ham berish mumkin.",
      ru: "Кроссворд строится из пакета вопросов автоматически. Можно распечатать.",
      en: "A crossword is generated from the question pack. Printable too.",
    },
    ikonka: "🔡",
    rang: "#0e7fa8",
    modes: ["local", "homework"],
    minTeams: 1,
    maxTeams: 1,
    supportsSolo: true,
    status: "ready",
  },
];

export const getGameDef = (id: GameId) => GAMES.find((g) => g.id === id)!;

export const readyGames = () => GAMES.filter((g) => g.status === "ready");

/** Rejim nomlari va tavsiflari — sozlash ekranidagi uchta tugma uchun. */
export const MODE_INFO: Record<
  GameMode,
  { nomi: Record<Lang, string>; izoh: Record<Lang, string>; ikonka: string }
> = {
  local: {
    nomi: { uz: "Doskada o'ynash", ru: "Играть у доски", en: "Play on the board" },
    izoh: {
      uz: "Bitta kompyuter va proyektor. Internet kerak emas.",
      ru: "Один компьютер и проектор. Интернет не нужен.",
      en: "One computer and a projector. No internet needed.",
    },
    ikonka: "🖥️",
  },
  live: {
    nomi: { uz: "O'quvchilar qurilmasida", ru: "На устройствах учеников", en: "On students' devices" },
    izoh: {
      uz: "Ekranda PIN chiqadi, o'quvchilar o'z telefonidan qo'shiladi.",
      ru: "На экране появится PIN, ученики подключаются со своих телефонов.",
      en: "A PIN appears on screen and students join from their own phones.",
    },
    ikonka: "📱",
  },
  homework: {
    nomi: { uz: "Uy vazifasi qilib berish", ru: "Задать на дом", en: "Set as homework" },
    izoh: {
      uz: "Sinfga muddat bilan biriktiriladi, natija jurnalga tushadi.",
      ru: "Назначается классу со сроком, результат попадает в журнал.",
      en: "Assigned to a class with a deadline; results land in the register.",
    },
    ikonka: "📚",
  },
};
