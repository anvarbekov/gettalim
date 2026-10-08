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
  {
    id: "p13",
    prompt: "SSD va HDD orasidagi asosiy farq nima?",
    options: [
      "SSD da harakatlanuvchi qism yo'q, shuning uchun ancha tez",
      "SSD ko'proq ma'lumot sig'diradi",
      "HDD elektr sarflamaydi",
      "SSD faqat noutbuklarda ishlatiladi",
    ],
    answer: "SSD da harakatlanuvchi qism yo'q, shuning uchun ancha tez",
    level: 2,
    media: { kind: "device", emoji: "💾", caption: "Ikki xil doimiy xotira qurilmasi" },
    explanation:
      "HDD ichida aylanadigan disk va harakatlanuvchi kalla bor — shuning uchun sekinroq va zarbadan qo'rqadi. SSD esa xotira mikrosxemalaridan iborat: tezroq, jimroq, lekin bir xil hajm uchun qimmatroq.",
  },
  {
    id: "p14",
    prompt: "Quvvat manbai (Power Supply) nima qiladi?",
    options: [
      "Rozetkadagi o'zgaruvchan tokni qurilmalar uchun o'zgarmas tokka aylantiradi",
      "Kompyuterni sovutadi",
      "Ma'lumotlarni saqlaydi",
      "Internetga ulaydi",
    ],
    answer: "Rozetkadagi o'zgaruvchan tokni qurilmalar uchun o'zgarmas tokka aylantiradi",
    level: 2,
    media: { kind: "device", emoji: "🔌", caption: "220V dan 12V, 5V va 3.3V ga" },
    explanation:
      "Rozetkada 220V o'zgaruvchan tok bor, kompyuter qismlari esa past kuchlanishli o'zgarmas tokda ishlaydi. Quvvat manbai shu o'zgartirishni bajaradi va quvvati yetmasa kompyuter og'ir ishda o'chib qoladi.",
  },
  {
    id: "p15",
    prompt: "Sovutgich (kuler) bo'lmasa nima bo'ladi?",
    options: [
      "Protsessor qizib, tezligini pasaytiradi yoki kompyuter o'chib qoladi",
      "Hech narsa bo'lmaydi",
      "Ovoz yo'qoladi",
      "Internet sekinlashadi",
    ],
    answer: "Protsessor qizib, tezligini pasaytiradi yoki kompyuter o'chib qoladi",
    level: 2,
    media: { kind: "device", emoji: "🌀", caption: "Issiqlikni tashqariga chiqaradi" },
    explanation:
      "Protsessor ishlaganda issiqlik chiqaradi. Issiqlik chiqmasa, himoya tizimi avval tezlikni pasaytiradi (throttling), keyin esa kompyuterni butunlay o'chiradi — bu qurilmani kuyishdan saqlaydi.",
  },
  {
    id: "p16",
    prompt: "Kiritish qurilmasi qaysi?",
    options: ["Skaner", "Printer", "Monitor", "Karnay"],
    answer: "Skaner",
    level: 1,
    explanation:
      "Kiritish qurilmasi ma'lumotni kompyuterga **kiritadi**: klaviatura, sichqoncha, skaner, mikrofon, veb-kamera. Printer, monitor va karnay esa chiqarish qurilmalari.",
  },
  {
    id: "p17",
    prompt: "8 GB RAM va 16 GB RAM orasidagi farq amalda nimada seziladi?",
    options: [
      "Bir vaqtda ko'proq dastur ochiq turganda kompyuter sekinlashmaydi",
      "Fayllar ko'proq sig'adi",
      "Internet tezlashadi",
      "Ekran kattaroq bo'ladi",
    ],
    answer: "Bir vaqtda ko'proq dastur ochiq turganda kompyuter sekinlashmaydi",
    level: 3,
    explanation:
      "RAM — ish stoli kabi: qanchalik keng bo'lsa, bir vaqtda shuncha ko'p ish yoyib qo'yiladi. Joy yetmasa tizim diskdan foydalanishga o'tadi va bu ancha sekin.",
  },
  {
    id: "p18",
    prompt: "Monitorni tizimli blokka ulash uchun qaysi port ishlatiladi?",
    options: ["HDMI yoki DisplayPort", "USB-A", "Ethernet (RJ-45)", "Audio 3.5 mm"],
    answer: "HDMI yoki DisplayPort",
    level: 2,
    media: { kind: "device", emoji: "🖥️", caption: "Tasvirni uzatuvchi port" },
    explanation:
      "HDMI va DisplayPort tasvir va ovozni raqamli uzatadi. USB — qurilmalar uchun, Ethernet — tarmoq uchun, 3.5 mm — quloqchin uchun.",
  },
  {
    id: "p19",
    prompt: "BIOS/UEFI nima vazifani bajaradi?",
    options: [
      "Kompyuter yoqilganda qurilmalarni tekshiradi va operatsion tizimni ishga tushiradi",
      "Fayllarni saqlaydi",
      "Internetga ulaydi",
      "Viruslarni o'chiradi",
    ],
    answer: "Kompyuter yoqilganda qurilmalarni tekshiradi va operatsion tizimni ishga tushiradi",
    level: 3,
    explanation:
      "BIOS/UEFI — anakartdagi kichik dastur. Tugma bosilishi bilan u qurilmalarni tekshiradi (POST), keyin diskdagi operatsion tizimga navbatni beradi.",
  },
  {
    id: "p20",
    prompt: "Noutbukda qaysi qismni odatda almashtirib bo'lmaydi?",
    options: ["Protsessor (ko'pincha lehimlangan)", "Operativ xotira", "SSD", "Batareya"],
    answer: "Protsessor (ko'pincha lehimlangan)",
    level: 3,
    explanation:
      "Zamonaviy noutbuklarda protsessor anakartga lehimlangan bo'ladi. RAM, SSD va batareyani esa ko'p modellarda almashtirsa bo'ladi — shuning uchun sotib olishda protsessorni to'g'ri tanlash muhim.",
  },
  {
    id: "p21",
    prompt: "Tashqi xotira qurilmasi qaysi?",
    options: ["Flesh xotira (USB)", "Operativ xotira", "Protsessor keshi", "Videokarta"],
    answer: "Flesh xotira (USB)",
    level: 1,
    media: { kind: "device", emoji: "🔑", caption: "Cho'ntakda yuriydigan xotira" },
    explanation:
      "Tashqi xotira kompyuterdan ajralib, boshqasiga ulanadi: USB flesh, tashqi disk, xotira kartasi. RAM va kesh esa kompyuter ichidagi ishchi xotira.",
  },
  {
    id: "p22",
    prompt: "Tarmoq kartasi (Network card) nima qiladi?",
    options: [
      "Kompyuterni boshqa kompyuterlar va internetga ulaydi",
      "Tasvirni chizadi",
      "Ovozni kuchaytiradi",
      "Fayllarni arxivlaydi",
    ],
    answer: "Kompyuterni boshqa kompyuterlar va internetga ulaydi",
    level: 1,
    media: { kind: "device", emoji: "🌐", caption: "Simli (Ethernet) yoki simsiz (Wi-Fi)" },
    explanation:
      "Tarmoq kartasi ma'lumotni tarmoq signaliga aylantiradi. Simli variant — Ethernet kabeli bilan, simsizi — Wi-Fi orqali.",
  },
  {
    id: "p23",
    prompt: "Kompyuter yoqilmayapti va hech qanday ovoz yo'q. Avval nimani tekshirish kerak?",
    options: [
      "Elektr kabeli va quvvat manbai tugmasini",
      "Videokartani almashtirishni",
      "Operatsion tizimni qayta o'rnatishni",
      "Antivirusni",
    ],
    answer: "Elektr kabeli va quvvat manbai tugmasini",
    level: 2,
    explanation:
      "Nosozlikni doim eng oddiy sababdan qidirish kerak: kabel, rozetka, quvvat manbaidagi tugma. Murakkab yechimlarga faqat oddiylari tekshirilgandan keyin o'tiladi.",
  },
  {
    id: "p24",
    prompt: "Protsessor tezligi qaysi birlikda o'lchanadi?",
    options: ["Gigagerts (GHz)", "Gigabayt (GB)", "Megapiksel (MP)", "Vatt (W)"],
    answer: "Gigagerts (GHz)",
    level: 2,
    explanation:
      "GHz — chastota, ya'ni protsessor bir soniyada necha milliard takt bajarishi. GB — hajm, W — quvvat. Faqat GHz bilan tezlikni baholab bo'lmaydi: yadrolar soni va avlodi ham muhim.",
  },
  {
    id: "p25",
    prompt: "Bitta bayt nechta bitdan iborat?",
    options: ["8", "10", "16", "1024"],
    answer: "8",
    level: 1,
    explanation:
      "1 bayt = 8 bit. Bit — 0 yoki 1. 1 KB ≈ 1024 bayt, 1 MB ≈ 1024 KB. Shuning uchun xotira hajmlari 2 ning darajalari bo'yicha yuradi.",
  },
  {
    id: "p26",
    prompt: "Operatsion tizim nima?",
    options: [
      "Kompyuter resurslarini boshqaradigan va dasturlarni ishlatadigan asosiy dastur",
      "Kompyuterning temir qismi",
      "Internet brauzeri",
      "Xotira turi",
    ],
    answer: "Kompyuter resurslarini boshqaradigan va dasturlarni ishlatadigan asosiy dastur",
    level: 2,
    media: { kind: "device", emoji: "🪟", caption: "Windows, macOS, Linux, Android" },
    explanation:
      "Operatsion tizim temir bilan dasturlar orasida turadi: xotirani taqsimlaydi, fayllarni boshqaradi, qurilmalar bilan gaplashadi. Usiz dasturlar ishlay olmaydi.",
  },
  {
    id: "p27",
    prompt: "Sensorli ekran qanday qurilma hisoblanadi?",
    options: [
      "Ham kiritish, ham chiqarish qurilmasi",
      "Faqat kiritish qurilmasi",
      "Faqat chiqarish qurilmasi",
      "Xotira qurilmasi",
    ],
    answer: "Ham kiritish, ham chiqarish qurilmasi",
    level: 3,
    explanation:
      "Sensorli ekran tasvirni ko'rsatadi (chiqarish) va barmoq bosilishini qabul qiladi (kiritish). Shunday ikki vazifali qurilmalar kam: masalan, modem ham ikki tomonlama ishlaydi.",
  },
  {
    id: "p28",
    prompt: "Kompyuter juda sekin ishlayapti. Qaysi holat eng ko'p sabab bo'ladi?",
    options: [
      "Disk to'lib ketgan va RAM yetishmayapti",
      "Sichqoncha eski",
      "Monitor kichik",
      "Klaviaturada chang bor",
    ],
    answer: "Disk to'lib ketgan va RAM yetishmayapti",
    level: 3,
    explanation:
      "Disk to'la bo'lsa tizim vaqtinchalik fayllar uchun joy topa olmaydi, RAM yetishmasa esa doim diskka murojaat qiladi. Ikkalasi birga kompyuterni sezilarli sekinlashtiradi.",
  },
];
