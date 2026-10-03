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
  {
    id: "e13",
    prompt: "=MAX(B2:B5) formulasi qaysi natijani beradi?",
    options: ["95", "62", "4", "312"],
    answer: "95",
    level: 1,
    media: {
      kind: "sheet",
      headers: ["A — O'quvchi", "B — Ball"],
      rows: [
        ["Aziza", "78"],
        ["Bekzod", "95"],
        ["Dilnoza", "62"],
        ["Eldor", "77"],
      ],
    },
    explanation: "MAX belgilangan oraliqdagi eng katta sonni topadi. Eng kichigi uchun MIN ishlatiladi.",
  },
  {
    id: "e14",
    prompt: "Nechta o'quvchi ro'yxatda borligini qaysi formula aytadi?",
    options: ["=COUNT(B2:B5)", "=SUM(B2:B5)", "=AVERAGE(B2:B5)", "=MAX(B2:B5)"],
    answer: "=COUNT(B2:B5)",
    level: 1,
    media: {
      kind: "sheet",
      headers: ["A — O'quvchi", "B — Ball"],
      rows: [
        ["Aziza", "78"],
        ["Bekzod", "95"],
        ["Dilnoza", "62"],
        ["Eldor", "77"],
      ],
    },
    explanation:
      "COUNT oraliqdagi **sonli** katakchalarni sanaydi. Matn ham sanalishi kerak bo'lsa COUNTA ishlatiladi.",
  },
  {
    id: "e15",
    prompt: "=IF(B2>=60;\"o'tdi\";\"o'tmadi\") formulasi B2=78 bo'lganda nima yozadi?",
    options: ["o'tdi", "o'tmadi", "78", "TRUE"],
    answer: "o'tdi",
    level: 2,
    media: {
      kind: "sheet",
      headers: ["A — O'quvchi", "B — Ball"],
      rows: [["Aziza", "78"]],
      formula: '=IF(B2>=60;"o\'tdi";"o\'tmadi")',
    },
    explanation:
      "IF uch qismdan iborat: shart; shart rost bo'lsa nima; yolg'on bo'lsa nima. 78 ≥ 60 rost, shuning uchun birinchi qiymat chiqadi.",
  },
  {
    id: "e16",
    prompt: "Katakchada ##### belgilari chiqdi. Bu nimani bildiradi?",
    options: [
      "Ustun tor — son sig'mayapti",
      "Formulada xato bor",
      "Fayl buzilgan",
      "Katakcha himoyalangan",
    ],
    answer: "Ustun tor — son sig'mayapti",
    level: 2,
    explanation:
      "##### xato emas: Excel sonni ko'rsatishga joy topa olmaganini bildiradi. Ustun chegarasini kengaytirsangiz son qaytadan ko'rinadi.",
  },
  {
    id: "e17",
    prompt: "#DIV/0! xatosi qachon chiqadi?",
    options: [
      "Nolga bo'lishga urinilganda",
      "Matnni qo'shishga urinilganda",
      "Fayl saqlanmaganda",
      "Formula juda uzun bo'lganda",
    ],
    answer: "Nolga bo'lishga urinilganda",
    level: 2,
    explanation:
      "Matematikada nolga bo'lib bo'lmaydi. Bo'luvchi bo'sh katakcha bo'lsa ham shu xato chiqadi — uni =IFERROR(...;0) bilan yashirish mumkin.",
  },
  {
    id: "e18",
    prompt: "A1 katakchasini formulada nusxalaganda ham o'zgarmas qoldirish uchun qanday yoziladi?",
    options: ["$A$1", "A1", "A$1$", "«A1»"],
    answer: "$A$1",
    level: 3,
    explanation:
      "Dollar belgisi manzilni «qotiradi». $A$1 — to'liq mutlaq manzil. A$1 faqat qatorni, $A1 faqat ustunni qotiradi. Bu bir xil koeffitsientga ko'paytirishda juda kerak.",
  },
  {
    id: "e19",
    prompt: "=SUM(B2:B4)/3 va =AVERAGE(B2:B4) natijasi bir xilmi?",
    options: [
      "Ha, lekin AVERAGE bo'sh katakchalarni hisobga olmaydi",
      "Yo'q, umuman boshqacha",
      "Ha, har doim bir xil",
      "Yo'q, SUM matn qaytaradi",
    ],
    answer: "Ha, lekin AVERAGE bo'sh katakchalarni hisobga olmaydi",
    level: 3,
    explanation:
      "Uchala katakcha to'la bo'lsa natija bir xil. Ammo bittasi bo'sh bo'lsa, SUM/3 noto'g'ri o'rtacha beradi — AVERAGE esa faqat to'ldirilgan katakchalarni hisoblaydi.",
  },
  {
    id: "e20",
    prompt: "60 dan past ballarni sanash uchun qaysi formula to'g'ri?",
    options: [
      "=COUNTIF(B2:B5;\"<60\")",
      "=COUNT(B2:B5)",
      "=SUMIF(B2:B5;\"<60\")",
      "=IF(B2:B5<60)",
    ],
    answer: "=COUNTIF(B2:B5;\"<60\")",
    level: 3,
    media: {
      kind: "sheet",
      headers: ["A — O'quvchi", "B — Ball"],
      rows: [
        ["Aziza", "78"],
        ["Bekzod", "95"],
        ["Dilnoza", "62"],
        ["Eldor", "45"],
      ],
    },
    explanation:
      "COUNTIF shartga mos katakchalarni sanaydi. SUMIF esa ularni qo'shadi — savol «nechta?» bo'lgani uchun COUNTIF kerak.",
  },
  {
    id: "e21",
    prompt: "Formula har doim qaysi belgi bilan boshlanadi?",
    options: ["=", "+", "#", "@"],
    answer: "=",
    level: 1,
    explanation:
      "Teng belgisi Excel'ga «bu matn emas, hisobla» deydi. Tenglik qo'yilmasa SUM(B2:B4) oddiy matn bo'lib qoladi.",
  },
  {
    id: "e22",
    prompt: "B2 dagi formulani B3 ga nusxalasangiz =A2*2 nimaga aylanadi?",
    options: ["=A3*2", "=A2*2", "=B3*2", "=A2*3"],
    answer: "=A3*2",
    level: 2,
    explanation:
      "Oddiy (nisbiy) manzil nusxalanganda siljiydi: bir qator pastga ko'chirilsa, manzil ham bir qator pastga tushadi. Shuning uchun bitta formulani butun ustunga cho'zish mumkin.",
  },
  {
    id: "e23",
    prompt: "Jadvalni ball bo'yicha kattadan kichikka tartiblash nima deyiladi?",
    options: ["Saralash (Sort)", "Filtr (Filter)", "Formatlash", "Birlashtirish"],
    answer: "Saralash (Sort)",
    level: 1,
    explanation:
      "Sort — satrlarni tartibga soladi. Filter esa kerakli satrlarnigina ko'rsatadi, qolganini vaqtincha yashiradi. Ikkalasi ko'pincha birga ishlatiladi.",
  },
  {
    id: "e24",
    prompt: "=A1&\" \"&B1 formulasi A1=\"Ali\", B1=\"Valiyev\" bo'lsa nima beradi?",
    options: ["Ali Valiyev", "AliValiyev", "Ali+Valiyev", "Xato"],
    answer: "Ali Valiyev",
    level: 3,
    explanation:
      "& belgisi matnlarni ulaydi. Orada qo'shtirnoq ichidagi bo'sh joy bo'lmasa, ism va familiya yopishib qolardi. Xuddi shu ishni CONCAT ham bajaradi.",
  },
  {
    id: "e25",
    prompt: "Sonni foizga aylantirish uchun nima qilinadi?",
    options: [
      "Katakcha formatini «Foiz» ga o'zgartiriladi",
      "Formulaga 100 qo'shiladi",
      "Sonni qo'shtirnoqqa olinadi",
      "Ustun kengaytiriladi",
    ],
    answer: "Katakcha formatini «Foiz» ga o'zgartiriladi",
    level: 2,
    explanation:
      "Format sonning ko'rinishini o'zgartiradi, qiymatini emas: 0,25 foiz formatida 25% bo'lib ko'rinadi, lekin hisoblarda baribir 0,25 bo'lib qatnashadi.",
  },
  {
    id: "e26",
    prompt: "Diagramma qurish uchun avval nima qilinadi?",
    options: [
      "Kerakli ma'lumot oralig'i belgilanadi",
      "Fayl saqlanadi",
      "Formula yoziladi",
      "Ustun kengaytiriladi",
    ],
    answer: "Kerakli ma'lumot oralig'i belgilanadi",
    level: 1,
    explanation:
      "Diagramma belgilangan katakchalardan quriladi. Sarlavhalar bilan birga belgilansa, o'qlar nomi avtomatik to'g'ri chiqadi.",
  },
  {
    id: "e27",
    prompt: "Ustun kengligini o'zgartirish katakchadagi **qiymatni** o'zgartiradimi?",
    options: ["Yo'q, faqat ko'rinishini", "Ha, sonni yaxlitlaydi", "Ha, formulani buzadi", "Faqat matnni"],
    answer: "Yo'q, faqat ko'rinishini",
    level: 2,
    explanation:
      "Kenglik va format — ko'rinish masalasi. Ichidagi qiymat va formula o'zgarmaydi, shuning uchun hisoblar ham o'zgarmaydi.",
  },
  {
    id: "e28",
    prompt: "Bir nechta varaq (sheet) nima uchun kerak?",
    options: [
      "Bitta faylda bog'liq ma'lumotni bo'limlarga ajratish uchun",
      "Faylni kichraytirish uchun",
      "Formulalarni tezlashtirish uchun",
      "Chop etishni osonlashtirish uchun",
    ],
    answer: "Bitta faylda bog'liq ma'lumotni bo'limlarga ajratish uchun",
    level: 2,
    explanation:
      "Masalan, har chorak alohida varaqda turadi, yakuniy varaqda esa ularga murojaat qilib jami hisoblanadi: =Chorak1!B2 + Chorak2!B2.",
  },
];
