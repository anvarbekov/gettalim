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
  {
    id: "f11",
    prompt: "Bu xabar haqiqiymi yoki firibgarlikmi?",
    options: ["Firibgarlik", "Haqiqiy xabar"],
    answer: "Firibgarlik",
    level: 2,
    media: {
      kind: "email",
      from: "no-reply@click-uz.pay-secure.com",
      subject: "Sizga 500 000 so'm o'tkazma keldi",
      body: "Pulni olish uchun karta raqamingiz va SMS kodni kiriting. Aks holda o'tkazma 30 daqiqada bekor qilinadi.",
      link: "http://click-uz.pay-secure.com/olish",
    },
    explanation:
      "Pul **olish** uchun hech qachon SMS kod so'ralmaydi — kod faqat pul yechishda kerak. Bundan tashqari haqiqiy domen click.uz, bu yerdagi esa pay-secure.com ning bo'limi.",
  },
  {
    id: "f12",
    prompt: "Bu xabar haqiqiymi yoki firibgarlikmi?",
    options: ["Haqiqiy xabar", "Firibgarlik"],
    answer: "Haqiqiy xabar",
    level: 2,
    media: {
      kind: "email",
      from: "noreply@github.com",
      subject: "Yangi qurilmadan kirish",
      body: "Hisobingizga Chrome (Windows) orqali kirildi. Bu siz bo'lsangiz, hech narsa qilish shart emas. Siz bo'lmasangiz, parolni o'zgartiring.",
    },
    explanation:
      "Manzil haqiqiy domenda, havola yo'q, hech narsa so'ralmayapti va «agar siz bo'lsangiz — hech narsa qilmang» deyilgan. Ogohlantirish xabarlari aynan shunday yoziladi.",
  },
  {
    id: "f13",
    prompt: "Havolani bosishdan oldin nimani tekshirish kerak?",
    options: [
      "Domen nomini — eng oxirgi nuqtagacha bo'lgan qismni",
      "Havola uzunligini",
      "Havola rangini",
      "Xat qachon kelganini",
    ],
    answer: "Domen nomini — eng oxirgi nuqtagacha bo'lgan qismni",
    level: 3,
    media: {
      kind: "note",
      text: "http://telegram.org.verify-login.ru/auth — bu havola qaysi saytga olib boradi?",
    },
    explanation:
      "Haqiqiy domen oxirgi ikki qismdan iborat: bu yerda verify-login.ru. telegram.org esa shunchaki oldiga yozilgan aldov. Doim o'ngdan chapga o'qing.",
  },
  {
    id: "f14",
    prompt: "Bu xabar haqiqiymi yoki firibgarlikmi?",
    options: ["Firibgarlik", "Haqiqiy xabar"],
    answer: "Firibgarlik",
    level: 1,
    media: {
      kind: "email",
      from: "director@samo-school.uz",
      subject: "Shoshilinch! Telefon raqamingizni yuboring",
      body: "Men direktorman, telefonim ishlamayapti. Menga zudlik bilan hisobingizdagi kodni yuboring, keyin tushuntiraman. Hech kimga aytmang.",
    },
    explanation:
      "Manzil to'g'ri ko'rinishi mumkin, lekin uchta belgi firibgarlikni ochadi: shoshiltirish, sirni saqlashni so'rash va kodni so'rash. Hech bir rahbar kod so'ramaydi — bunday holatda to'g'ridan-to'g'ri qo'ng'iroq qilib tekshiring.",
  },
  {
    id: "f15",
    prompt: "Parolni qayerda saqlash xavfsiz?",
    options: [
      "Parol menejerida",
      "Brauzer yorlig'ida ochiq matn bilan",
      "Telefondagi «Eslatmalar» ilovasida",
      "Daftarda partaning ustida",
    ],
    answer: "Parol menejerida",
    level: 2,
    explanation:
      "Parol menejeri parollarni shifrlab saqlaydi va har sayt uchun boshqacha parol yasaydi. Ochiq matnda saqlangan parol qurilma qo'lga o'tsa darrov o'qiladi.",
  },
  {
    id: "f16",
    prompt: "Ikki bosqichli tasdiqlash (2FA) nima beradi?",
    options: [
      "Parol o'g'irlansa ham hisobga kirib bo'lmaydi",
      "Parolni eslab qolishga yordam beradi",
      "Internetni tezlashtiradi",
      "Viruslarni o'chiradi",
    ],
    answer: "Parol o'g'irlansa ham hisobga kirib bo'lmaydi",
    level: 2,
    explanation:
      "2FA da paroldan tashqari ikkinchi dalil kerak: telefondagi kod yoki ilova tasdig'i. Shuning uchun faqat parolni bilgan odam kira olmaydi.",
  },
  {
    id: "f17",
    prompt: "Bu xabar haqiqiymi yoki firibgarlikmi?",
    options: ["Firibgarlik", "Haqiqiy xabar"],
    answer: "Firibgarlik",
    level: 3,
    media: {
      kind: "email",
      from: "info@instagrarn.com",
      subject: "Sizning akkauntingiz mukofotga sazovor bo'ldi",
      body: "Tabriklaymiz! Siz oyning eng faol foydalanuvchisisiz. Sovg'ani olish uchun akkauntingizga kiring va profilni tasdiqlang.",
      link: "https://instagrarn.com/verify",
    },
    explanation:
      "Diqqat bilan qarang: instagram emas, «instagra**rn**» — m o'rniga r va n yozilgan. Bunday harf almashtirish eng ko'p uchraydigan usul. Sabab ham shubhali: hech kim sababsiz mukofot bermaydi.",
  },
  {
    id: "f18",
    prompt: "Do'stingizdan «menga pul qarz ber» degan xabar keldi. Nima qilish kerak?",
    options: [
      "Unga qo'ng'iroq qilib, ovozidan tasdiqlash",
      "Darrov pul yuborish",
      "Xabarni o'chirish",
      "Karta raqamini so'rab olish",
    ],
    answer: "Unga qo'ng'iroq qilib, ovozidan tasdiqlash",
    level: 2,
    explanation:
      "O'g'irlangan akkauntdan do'stlarga pul so'rab yozish keng tarqalgan usul. Bir daqiqalik qo'ng'iroq masalani hal qiladi — yozishmaga ishonmang.",
  },
  {
    id: "f19",
    prompt: "Ommaviy Wi-Fi da nima qilmaslik kerak?",
    options: [
      "Bank ilovasiga kirib pul o'tkazish",
      "Yangiliklar o'qish",
      "Xarita ochish",
      "Musiqa tinglash",
    ],
    answer: "Bank ilovasiga kirib pul o'tkazish",
    level: 3,
    explanation:
      "Ochiq tarmoqda trafikni tutib olish mumkin. Muhim amallarni mobil internet orqali yoki ishonchli tarmoqdan bajarish kerak.",
  },
  {
    id: "f20",
    prompt: "Saytning manzil satrida qulf belgisi (HTTPS) bo'lsa, sayt ishonchli demakmi?",
    options: [
      "Yo'q — u faqat aloqa shifrlanganini bildiradi",
      "Ha, to'liq ishonch mumkin",
      "Ha, agar rang yashil bo'lsa",
      "Yo'q, u faqat tezlikni bildiradi",
    ],
    answer: "Yo'q — u faqat aloqa shifrlanganini bildiradi",
    level: 3,
    explanation:
      "HTTPS ma'lumot yo'lda o'qilmasligini kafolatlaydi, lekin saytning halolligini emas. Firibgar saytlar ham HTTPS ishlatadi — shuning uchun domen nomini tekshirish baribir kerak.",
  },
  {
    id: "f21",
    prompt: "Bu xabar haqiqiymi yoki firibgarlikmi?",
    options: ["Haqiqiy xabar", "Firibgarlik"],
    answer: "Haqiqiy xabar",
    level: 1,
    media: {
      kind: "email",
      from: "maktab@samoschool.uz",
      subject: "Ertangi dars jadvalida o'zgarish",
      body: "Hurmatli o'quvchilar, ertaga informatika darsi 3-parada bo'ladi. Savollar bo'lsa sinf rahbariga murojaat qiling.",
    },
    explanation:
      "Hech narsa so'ralmayapti, havola yo'q, shoshiltirish yo'q va mazmun kutilgan mavzuga mos. Xavfsiz xabarning belgilari aynan shu — «hech narsa qilishing shart emas».",
  },
  {
    id: "f22",
    prompt: "Telefoningizga notanish ilova o'rnatishni taklif qilishdi. Eng xavfli belgi qaysi?",
    options: [
      "Ilova rasmiy do'kondan emas, havola orqali o'rnatilmoqda",
      "Ilova bepul",
      "Ilova hajmi katta",
      "Ilova ingliz tilida",
    ],
    answer: "Ilova rasmiy do'kondan emas, havola orqali o'rnatilmoqda",
    level: 2,
    explanation:
      "Rasmiy do'konlar (Play Store, App Store) ilovalarni tekshiradi. Havoladan yuklangan APK esa hech qanday tekshiruvdan o'tmagan bo'ladi — zararli dasturlar asosan shu yo'l bilan tarqaladi.",
  },
];
