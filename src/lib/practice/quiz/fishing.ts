import type { PracticeItem } from "@/lib/practice/quiz/types";

/**
 * "Firibgar xatni topish" mashqi.
 *
 * Har bir topshiriqda haqiqiy xabar yoki firibgarlik ko'rsatiladi.
 * Maqsad — bolaga **belgilarni** o'rgatish: manzil qanday yozilgan,
 * havola qayerga olib boradi, shoshiltirilyaptimi, nima so'ralyapti.
 */
export const FISHING_ITEMS: PracticeItem[] = [
  {
    id: "f1",
    prompt: "Bu xabar haqiqiymi yoki firibgarlikmi?",
    options: ["Firibgarlik", "Haqiqiy xabar"],
    answer: "Firibgarlik",
    level: 1,
    media: {
      kind: "email",
      from: "telegram-suppport@mail-tg.info",
      subject: "Hisobingiz bloklanadi!",
      body: "Hurmatli foydalanuvchi! Hisobingiz 24 soatdan keyin bloklanadi. Tiklash uchun parolingizni quyidagi havolada tasdiqlang.",
      link: "http://tg-verify-account.ru/login",
    },
    explanation:
      "Uchta belgi bir vaqtda: manzilda «suppport» xato yozilgan va u Telegram'ga tegishli emas; havola boshqa saytga olib boradi; shoshiltirish uchun «24 soat» deyilgan. Haqiqiy xizmatlar hech qachon paroldan havola orqali so'ramaydi.",
  },
  {
    id: "f2",
    prompt: "Bu xabar haqiqiymi yoki firibgarlikmi?",
    options: ["Firibgarlik", "Haqiqiy xabar"],
    answer: "Haqiqiy xabar",
    level: 1,
    media: {
      kind: "email",
      from: "no-reply@github.com",
      subject: "New sign-in to your account",
      body: "Hisobingizga yangi qurilmadan kirildi. Agar bu siz bo'lsangiz, hech narsa qilish shart emas. Aks holda parolni o'zgartiring.",
    },
    explanation:
      "Manzil rasmiy domenda (github.com), havola talab qilinmayapti, shoshiltirish yo'q va hech qanday maxfiy ma'lumot so'ralmayapti. Bu — oddiy xabarnoma.",
  },
  {
    id: "f3",
    prompt: "Bu xabarda eng shubhali belgi qaysi?",
    options: [
      "Havola manzili saytga mos emas",
      "Xat ertalab kelgan",
      "Xatda emoji ishlatilgan",
      "Mavzu qatori qisqa",
    ],
    answer: "Havola manzili saytga mos emas",
    level: 1,
    media: {
      kind: "email",
      from: "billing@uzcard-uz.com",
      subject: "To'lovingiz qaytarildi 💳",
      body: "Kartangizga 250 000 so'm qaytariladi. Qabul qilish uchun karta raqamingizni kiriting.",
      link: "http://uzcard-refund.top/claim",
    },
    explanation:
      "Havola butunlay boshqa domenga (.top) olib boradi. Vaqt, emoji yoki mavzu uzunligi hech narsani anglatmaydi — asosiy belgi manzil va havola.",
  },
  {
    id: "f4",
    prompt: "Do'stingizdan shunday xabar keldi. Nima qilasiz?",
    options: [
      "Do'stimga qo'ng'iroq qilib tekshiraman",
      "Darhol pul yuboraman",
      "Karta raqamimni yuboraman",
      "Havolani bosib ko'raman",
    ],
    answer: "Do'stimga qo'ng'iroq qilib tekshiraman",
    level: 2,
    media: {
      kind: "note",
      text: "«Salom! Telefonim ishlamayapti, shu raqamdan yozyapman. Zudlik bilan 300 000 so'm kerak, ertaga qaytaraman.»",
    },
    explanation:
      "Bu — eng keng tarqalgan firibgarlik. Do'stning hisobi o'g'irlangan bo'lishi mumkin. Boshqa aloqa yo'li bilan (qo'ng'iroq, jonli uchrashuv) tekshirish — yagona to'g'ri yo'l.",
  },
  {
    id: "f5",
    prompt: "Qaysi parol eng xavfsiz?",
    options: ["K7#mzq_2Lp", "parol123", "Alisher2010", "12345678"],
    answer: "K7#mzq_2Lp",
    level: 1,
    explanation:
      "Kuchli parolda katta va kichik harflar, raqamlar va belgilar aralashadi hamda u ma'noli so'z emas. Ism va tug'ilgan yil — firibgar birinchi navbatda sinab ko'radigan narsa.",
  },
  {
    id: "f6",
    prompt: "Sayt manzilida qaysi belgi uni xavfsiz qiladi?",
    options: [
      "Boshida https:// turishi",
      "Manzilning uzunligi",
      "Saytda ko'p rasm borligi",
      "Sayt tez ochilishi",
    ],
    answer: "Boshida https:// turishi",
    level: 2,
    explanation:
      "https ma'lumot shifrlanganini bildiradi. Lekin buning o'zi yetarli emas: firibgar saytlar ham https ishlatishi mumkin. Shuning uchun domen nomini ham tekshirish kerak.",
  },
  {
    id: "f7",
    prompt: "Qaysi manzil haqiqiy Google'ga tegishli?",
    options: ["accounts.google.com", "google-account.verify.ru", "google.com.login.net", "goggle-mail.com"],
    answer: "accounts.google.com",
    level: 2,
    explanation:
      "Domenni o'ngdan chapga o'qish kerak: oxirgi ikki qism asosiy domen. «google.com.login.net» — bu aslida login.net sayti, Google emas. Bu firibgarlarning eng sevimli hiylasi.",
  },
  {
    id: "f8",
    prompt: "Ijtimoiy tarmoqda «bepul obuna» va'da qilingan havola keldi. To'g'ri qaror?",
    options: [
      "Ochmayman va o'chirib tashlayman",
      "Ochib, faqat ko'raman",
      "Do'stlarimga yuboraman",
      "Parolimni kiritib sinab ko'raman",
    ],
    answer: "Ochmayman va o'chirib tashlayman",
    level: 1,
    explanation:
      "Bepul narsa va'da qilingan kutilmagan havola — deyarli har doim tuzoq. «Faqat ko'rish» ham xavfli: sahifa qurilmangizga zararli dastur tushirishi mumkin.",
  },
  {
    id: "f9",
    prompt: "Bank xodimi deb qo'ng'iroq qilib, SMS kodni so'rashdi. Nima qilasiz?",
    options: [
      "Kodni aytmayman va qo'ng'iroqni tugataman",
      "Kodni aytaman, chunki bank so'radi",
      "Kodning yarmini aytaman",
      "Qayta qo'ng'iroq qilishlarini so'rayman",
    ],
    answer: "Kodni aytmayman va qo'ng'iroqni tugataman",
    level: 2,
    explanation:
      "Hech bir bank SMS kodni so'ramaydi — bu qoida istisnosiz. Kodni bilgan odam pulingizni o'tkazib yuborishi mumkin. Shubha bo'lsa, bankka o'zingiz rasmiy raqamdan qo'ng'iroq qiling.",
  },
  {
    id: "f10",
    prompt: "Umumiy Wi-Fi (kafe, avtobus) da nima qilish xavfli?",
    options: [
      "Bank ilovasiga kirish",
      "Video ko'rish",
      "Musiqa tinglash",
      "Xarita ochish",
    ],
    answer: "Bank ilovasiga kirish",
    level: 3,
    explanation:
      "Ochiq tarmoqda ma'lumot boshqalarga ko'rinishi mumkin. Video yoki xarita zarar keltirmaydi, lekin bank va parol talab qiladigan xizmatlarni mobil internetda ishlatgan ma'qul.",
  },
];
