# Gettalim — interaktiv dars o'yinlari

Sinfni jamoalarga bo'lib o'ynaladigan savol-javob o'yinlari platformasi. Barcha o'yinlar
**bitta savollar bazasidan** foydalanadi: o'qituvchi savollarni bir marta yuklaydi va
istalgan o'yinda ishlatadi.

| O'yin | Jamoalar | Qoida |
|---|---|---|
| **Arqon tortish** | 2 | Har bir to'g'ri javob arqonni o'z tomoniga bir qadam tortadi |
| **Poyga** | 2–4 | Har bir to'g'ri javob otni yoki mashinani marraga bir qadam yaqinlashtiradi |
| **Savol yomg'iri** | 1–2 | Javob variantlari tepadan tushadi — to'g'risini yerga tushgunicha ilib olish kerak |

Ikkala o'yinda ham savollar **test ko'rinishida** chiqadi, xato javob esa raqibga hech narsa
bermaydi — shunchaki darhol yangi savol chiqadi.

**Istalgan fan uchun ishlaydi:** savollar oddiy JSON fayl sifatida yuklanadi yoki
dastur ichidagi tahrirlagichda yaratiladi.

---

## Nimalar bor

| Imkoniyat | Tavsif |
|---|---|
| Ikki o'yin, bitta baza | Arqon tortish (2 jamoa) va Poyga (2–4 jamoa) — savollar umumiy |
| Har jamoaga o'z paneli | Har bir jamoaning alohida savoli va variantlari |
| **Hamma savol — test** | Raqamli va matnli savollarga ham chalg'ituvchi variantlar avtomatik yaratiladi |
| **Xatodan keyin avtomatik o'tish** | Xato javobda hech kim ball olmaydi, darhol yangi savol chiqadi |
| **Oldingi savolga qaytish** | Javob berilgan savolni to'g'ri javobi bilan qayta ko'rish mumkin |
| **Personaj tanlash** | Arqonda: o'g'il bolalar / qizlar. Poygada: otlar / mashinalar |
| **O'z personajingiz** | Istalgan PNG'ni yuklab, arqon balandligini sozlab, doimiy model sifatida saqlash |
| **Fon musiqasi** | Ikki kuy + ovoz balandligi; tanlov keyingi o'yinlarda saqlanadi |
| JSON import/eksport | Fayl yuklash yoki matnni qo'yish; xatolar aniq ko'rsatiladi |
| Vizual tahrirlagich | Savollarni forma orqali yaratish, JSON ko'rinishini nusxalash |
| Cheksiz misollar | Matematika paketlari generator asosida ishlaydi — savollar tugamaydi |
| 8 ta tayyor paket | Matematika, Informatika, Ona tili, Ingliz tili, Biologiya, Tarix, Geografiya, Fizika |
| Sozlanadigan qoidalar | G'alaba uchun qadamlar, o'yin vaqti, xato jarimasi, aralashtirish |
| Klaviatura bilan o'ynash | 1-jamoa — yuqori qatordagi raqamlar, 2-jamoa — NumPad |
| 3 til | O'zbekcha, ruscha, inglizcha |
| Natijalar tarixi | Har bir o'yin hisobi, statistikasi va vaqti saqlanadi |
| Supabase (ixtiyoriy) | Paketlar va natijalarni bulutda saqlash, maktab bo'ylab ulashish |
| Proyektor rejimi | Masshtab (60–150%) va to'liq ekran tugmalari |

## Texnologiyalar

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **daisyUI** temasi + shadcn uslubidagi UI primitivlari (`class-variance-authority`, `tailwind-merge`)
- **GSAP** — arqon tortilishi, silkinish, elastik qaytish
- **three.js** — bosh sahifadagi zarrachali fon
- **vanilla-tilt** — fan kartalarining 3D egilishi
- **canvas-confetti** — g'alaba effekti
- **Supabase** — ixtiyoriy bulut bazasi (`question_packs`, `matches`)
- **Web Audio API** — ovoz effektlari (audio fayllarsiz sintez qilinadi)

---

## Ishga tushirish

```bash
npm install
npm run dev       # http://localhost:3000
```

Ishlab chiqarish uchun:

```bash
npm run build
npm start
```

Node.js 18.17+ talab qilinadi.

### Supabase (ixtiyoriy)

Supabasesiz ham dastur to'liq ishlaydi — barcha paketlar va natijalar brauzerning
`localStorage` xotirasida saqlanadi. Bulutni yoqish uchun:

1. [supabase.com](https://supabase.com) da loyiha oching.
2. **SQL Editor** da `supabase/schema.sql` faylini to'liq ishga tushiring.
3. `.env.example` dan nusxa oling:

```bash
cp .env.example .env.local
```

4. `NEXT_PUBLIC_SUPABASE_URL` va `NEXT_PUBLIC_SUPABASE_ANON_KEY` qiymatlarini
   loyiha sozlamalaridan (Project Settings → API) ko'chiring.

Shundan keyin "Savollar bazasi" sahifasida har bir paket yonida ☁️ tugmasi paydo
bo'ladi va o'yin natijalari avtomatik bulutga yoziladi.

> Sxemadagi RLS siyosatlari maktab ichida ochiq foydalanish uchun mo'ljallangan
> (hamma o'qiy va yoza oladi). Faqat o'qish kerak bo'lsa, `insert/update/delete`
> siyosatlarini olib tashlang.

---

## Savollarni JSON orqali qo'shish

**Savollar bazasi → JSON yuklash** bo'limiga o'ting, faylni tanlang yoki matnni qo'ying.

```json
{
  "title": "Kimyo: formulalar",
  "subject": "Kimyo",
  "icon": "⚗️",
  "color": "#0f9b8e",
  "grade": "7-sinf",
  "description": "Oddiy moddalar formulalari",
  "questions": [
    { "type": "number", "prompt": "1 bayt necha bit?", "answer": "8" },
    { "type": "text", "prompt": "Suvning formulasi", "answer": "H2O" },
    {
      "type": "choice",
      "prompt": "Osh tuzining formulasi",
      "options": ["NaCl", "KCl", "CaCO3", "H2SO4"],
      "answer": "NaCl"
    }
  ]
}
```

### Maydonlar

| Maydon | Majburiy | Izoh |
|---|---|---|
| `title` | ✔ | Paket nomi |
| `subject` | ✔ | Fan nomi (bosh sahifada ko'rinadi) |
| `questions[].prompt` | ✔ | Savol matni |
| `questions[].answer` | ✔ | To'g'ri javob. `choice` uchun variant matni yoki uning indeksi (0, 1, 2…) |
| `questions[].type` | — | `number` / `text` / `choice`. Ko'rsatilmasa avtomatik aniqlanadi |
| `questions[].options` | `choice` uchun ✔ | Kamida 2 ta variant; o'yinda har safar aralashtiriladi |
| `questions[].alt` | — | Qo'shimcha qabul qilinadigan javoblar (sinonimlar) |
| `questions[].hint` | — | Savol ostida chiqadigan izoh |
| `icon`, `color`, `grade`, `description`, `author` | — | Kartochka ko'rinishi uchun |

Sodda variant ham qabul qilinadi — faqat savollar massivi:

```json
[
  { "prompt": "2 + 2 = ?", "answer": "4" },
  { "prompt": "Poytaxt?", "options": ["Toshkent", "Buxoro"], "answer": 0 }
]
```

### Barcha savollar test ko'rinishida

O'yinda har bir savol 4 ta variantli test bo'lib chiqadi:

- `choice` — siz bergan variantlar ishlatiladi (har safar aralashtiriladi);
- `number` — to'g'ri javobga yaqin sonlar avtomatik yaratiladi (`24` uchun `23`, `25`, `42` kabi);
- `text` — chalg'ituvchi javoblar shu paketdagi boshqa savollarning javoblaridan tanlanadi
  (yozuv turi va so'z uzunligi hisobga olinadi).

Sifatli chalg'ituvchilar kerak bo'lsa, savolga o'zingiz `options` bering — bu har doim ustun turadi.

### Javoblarni solishtirish qoidalari

- Katta-kichik harf farqlanmaydi.
- Apostroflar bir xil deb hisoblanadi: `o'qituvchi` = `oʻqituvchi` = `o‘qituvchi`.
- Raqamlarda `07` = `7`, `2,5` = `2.5`.
- `alt` ro'yxatidagi barcha variantlar to'g'ri deb qabul qilinadi.

Namuna fayl: `public/packs/namuna-kimyo.json`.

---

## Klaviatura boshqaruvi

| Amal | 1-jamoa | 2-jamoa |
|---|---|---|
| Variantni tanlash (A, B, C, D) | Yuqori qatordagi `1`–`4` | NumPad `1`–`4` |
| Oldingi savolga qaytish | `Q` | NumPad `7` yoki `−` |
| Joriy savolga qaytish | `E` | NumPad `9` yoki `+` |
| Pauza / davom etish | `Space` | `Space` |

Klaviaturani "O'yin sozlamalari" bo'limidan o'chirib qo'yish mumkin.

---

## Loyiha tuzilishi

```
src/
├── app/
│   ├── page.tsx              # Bosh sahifa: o'yinlar ro'yxati va fanlar
│   ├── arqon/page.tsx        # Arqon tortish — sozlamalar
│   ├── arqon/play/page.tsx   # Arqon tortish — o'yin ekrani
│   ├── poyga/page.tsx        # Poyga — sozlamalar
│   ├── poyga/play/page.tsx   # Poyga — o'yin ekrani
│   ├── yomgir/page.tsx       # Savol yomg'iri — sozlamalar
│   ├── yomgir/play/page.tsx  # Savol yomg'iri — o'yin ekrani
│   ├── packs/page.tsx        # Savollar bazasi
│   ├── packs/editor/page.tsx # Paket tahrirlagichi
│   ├── leaderboard/page.tsx  # Natijalar tarixi
│   ├── icon.png              # Favicon (Gettalim belgisi)
│   └── apple-icon.png        # iOS uchun ikonka
├── components/
│   ├── Arena.tsx             # Arqon, personajlar, GSAP animatsiyalari
│   ├── TeamPanel.tsx         # Jamoa paneli
│   ├── Rope.tsx              # Arqon: osilish, taranglik, silkinish (SVG)
│   ├── RaceTrack.tsx         # Poyga treki: yo'lakchalar, start va marra
│   ├── RacePanel.tsx         # Poygadagi jamoa paneli
│   ├── RainField.tsx         # Savol yomg'iri maydoni (tushayotgan variantlar)
│   ├── MusicPanel.tsx        # Fon musiqasi sozlamalari
│   ├── CharacterPicker.tsx   # Personaj tanlash va rasm yuklash
│   ├── WinnerOverlay.tsx     # G'olib oynasi + konfetti
│   ├── ThreeBackground.tsx   # three.js fon
│   ├── SubjectCard.tsx       # vanilla-tilt kartalar
│   ├── JsonImport.tsx        # JSON import oynasi
│   └── ui/                   # Button, Card, Input, Toggle…
├── hooks/useMatch.ts         # Arqon holati (reducer): hisob, taymer, tarix
├── hooks/useRace.ts          # Poyga holati (reducer): 2–4 jamoa, qadamlar, o'rinlar
├── hooks/useRain.ts          # Savol yomg'iri holati: jonlar, darajalar, ballar
├── lib/
│   ├── types.ts  generator.ts  packIO.ts  storage.ts
│   ├── quiz.ts               # Savolni test shakliga o'tkazish, chalg'ituvchilar
│   ├── characters.ts         # Arqon personajlari registri
│   ├── racers.ts             # Poyga modellari (otlar va mashinalar)
│   ├── music.ts              # Fon musiqasi (WebAudio sintezi)
│   ├── supabase.ts  sound.ts  i18n.ts  utils.ts
├── data/packs.ts             # 8 ta tayyor paket
└── data/games.ts             # O'yinlar registri (bosh sahifadagi ro'yxat)
public/img/                   # Personaj rasmlari (chap va o'ng tomon)
supabase/schema.sql           # Bulut bazasi sxemasi
```

### Personajlar

Ikkita tayyor model bor — **o'g'il bolalar** va **qizlar**, ikkalasi ham milliy kiyimda.
Har bir jamoa "O'yin sozlamalari → Personajlar" bo'limidan o'z modelini tanlaydi, ya'ni
bir tomonda qizlar, ikkinchi tomonda yigitlar bo'lishi mumkin. Kiyim ranglari jamoa rangiga
(ko'k / qizil) avtomatik moslashtirilgan; teri, soch va oltin naqsh asl holida qoladi.

**Arqon ikki qismdan iborat:**

1. **Rasmdagi qism** — personajning qo'lidagi va orqasiga osilib turgan arqon. Bu asl rasmning
   bir qismi, tegilmagan.
2. **Chizilgan qism** — ikki jamoaning oldingi mushtlari orasidagi ip (`src/components/Rope.tsx`).

Har bir jamoada ikkita personaj bor va ular ikki xil rasmdan foydalanadi:

- **orqadagi** — asl rasm (`*-back.png`), arqon dumi bilan; dum jamoaning orqasida ko'rinadi;
- **oldingi** — dumi olib tashlangan rasm (`*.png`); shuning uchun ikkita ip ustma-ust tushmaydi.

Orqadagi personajning qo'lidagi arqon oldingi personaj tanasi ortida qoladi, natijada butun
maydonda **bitta uzluksiz ip** ko'rinadi.

Arqon fizikasi va ko'rinishi:

- egri chiziq og'irlik ta'sirida osiladi; taranglik oshgani sari (bir jamoa uzoqlashsa) to'g'rilanadi;
- doimiy yengil tebranib turadi, to'g'ri javobda keskin tortilib, elastik ravishda tinchiydi;
- shakl **to'ldirilgan kontur** sifatida chiziladi — shuning uchun ikki uchidagi qalinlik har xil
  bo'lishi va yo'l bo'ylab silliq o'zgarishi mumkin (bola va qiz modellarining arqoni bir xil emas);
- tolalarning qiya burilishi, silindrsimon yorug'lik-soya va yerdagi soya alohida qatlamlar bilan
  chiziladi;
- arqonning uchi mushtning **ichiga kiritiladi** (`TUCK` = 7.5%), shuning uchun ip qo'l ortidan
  chiqib kelayotgandek ko'rinadi va hech qanday chok sezilmaydi;
- markazdagi qizil popuk egri chiziqning o'rtasiga osilib, u bilan birga harakatlanadi.

**Yangi personaj qo'shishning ikki yo'li:**

1. **Dastur ichidan** (kod tegmasdan) — "Rasm yuklash" tugmasi. Shaffof fonli PNG tanlanadi,
   "Arqon balandligi" sozlagichi bilan qo'l arqonni ushlagan joyga to'g'rilanadi, saqlanadi.
   Rasm brauzerda saqlanadi va keyingi o'yinlarda ham chiqaveradi. Personaj **o'ngga qarab**
   tortayotgan bo'lsin — ikkinchi tomon uchun avtomatik aylantiriladi.

2. **Kod orqali** — PNG'ni `public/img/` ga qo'ying va `src/lib/characters.ts` dagi
   `BUILTIN_CHARACTERS` ro'yxatiga yozuv qo'shing:

```ts
{
  id: "qiz",
  name: "Qizlar",
  leftSrc: "/img/girl-left.png",
  rightSrc: "/img/girl-right.png",   // bo'lmasa leftSrc aylantiriladi
  ropeRatio: 0.425,                   // arqon balandligi (rasm balandligiga nisbatan)
  builtin: true,
}
```

Maydonlar:

- `ropeRatio` — chap rasmda musht arqonni ushlagan **balandlik** (rasm balandligiga nisbatan);
- `ropeRatioRight` — o'ng rasmda o'sha balandlik (berilmasa `ropeRatio` ishlatiladi);
- `gripX` — chap rasmda musht qayerda turgani (rasm **kengligiga** nisbatan);
- `gripXRight` — o'ng rasmdagi musht joyi (berilmasa `1 - gripX`);
- `ropeThickness` — arqon qalinligi (rasm balandligiga nisbatan).

Hozirgi modellarda:

| Model | ropeRatio (chap / o'ng) | gripX (chap / o'ng) | qalinlik |
|---|---|---|---|
| O'g'il bolalar | 0.459 / 0.470 | 0.773 / 0.225 | 0.025 |
| Qizlar | 0.412 / 0.440 | 0.794 / 0.234 | 0.027 |

Rasm tayyorlashda muhim shart: **musht chetidan nariga chiqqan arqon rasmdan o'chirilgan
bo'lsin** (shaffof qilib), aks holda dastur chizgan arqon bilan ustma-ust tushib, uzuq
ko'rinadi. Rasmning o'zini kesish shart emas — kesilsa personajning oldinga cho'zilgan
oyog'i ham yo'qoladi. Faqat arqon yo'lagini o'chirish kifoya; musht joyini `gripX` bilan
ko'rsatasiz.

Rasmlar bitta katta renderdan (ikki bola bir arqonni tortayotgan holat) o'rtasidan ajratib
tayyorlangan; ikkala tomon alohida PNG qilib, jamoa rangiga bo'yalgan.

## Deploy

Loyihani Vercel'ga to'g'ridan-to'g'ri yuklash mumkin:

```bash
npx vercel
```

Supabase ishlatilsa, Vercel'da `NEXT_PUBLIC_SUPABASE_URL` va
`NEXT_PUBLIC_SUPABASE_ANON_KEY` muhit o'zgaruvchilarini qo'shing.

---

## Poyga

2 dan 4 tagacha jamoa qatnashadi. Har bir jamoa o'z yo'lakchasida chopadi; to'g'ri javob
bergan jamoa marraga bir qadam yaqinlashadi. Marraga birinchi yetgan jamoa g'olib bo'ladi.
Vaqt tugasa — eng uzoq ketgan jamoa yutadi.

Sozlamalar: savollar paketi, jamoalar soni va nomlari, **otlar yoki mashinalar**,
marragacha qadamlar soni (6–20), o'yin vaqti.

Klaviatura bilan (4 jamoa bir vaqtda o'ynay oladi):

| Jamoa | Variantlarni tanlash |
|---|---|
| 1-jamoa | `1` `2` `3` `4` |
| 2-jamoa | `Q` `W` `E` `R` |
| 3-jamoa | `A` `S` `D` `F` |
| 4-jamoa | NumPad `1` `2` `3` `4` |

Modellar `public/img/horse-1..4.png` (otlar) va `supercar-1..4.png` (superkarlar) fayllarida —
hammasi o'ngga, marra tomonga qaragan. Yangisini qo'shish uchun shaffof fonli PNG'ni shu
papkaga soling va `src/lib/racers.ts` dagi `RACER_SETS` ro'yxatiga yozuv qo'shing:

- `aspect` — rasmning eng/bo'y nisbati (joyni to'g'ri hisoblash uchun);
- `scale` — to'plam uchun umumiy o'lcham (mashinalar uzun bo'lgani uchun 0.72, otlar 0.94).

Muhim: barcha modellar **bir tomonga** qaragan bo'lsin, aks holda ba'zi jamoalar orqaga
chopayotgandek ko'rinadi.

## Savol yomg'iri

Javob variantlari maydonning tepasidan pastga tushadi. To'g'ri variantni yerga tushishidan
oldin bosish kerak. Xato variantni bosish yoki to'g'risini o'tkazib yuborish — bitta jonni oladi.
Jonlar tugaganda o'yin yakunlanadi; g'olib — ballari ko'p bo'lgan jamoa.

**Tezlik o'zi oshib boradi:** har 5 ta to'g'ri javobdan keyin daraja ko'tariladi va pufakchalar
tezroq tushadi. Boshlang'ich tezlik sozlamalardan tanlanadi (sekin / o'rtacha / tez).

Rejimlar: **yakka o'yin** (butun sinf bitta maydonda) yoki **2 jamoa** yonma-yon.
Jonlar soni 1, 3 yoki 5 qilib belgilanadi.

Klaviatura: 1-jamoa `1` `2` `3` `4`, 2-jamoa NumPad `1` `2` `3` `4`.
Raqam pufakchadagi harfga mos keladi (1 → A, 2 → B, …).

## Eslatma: rasm keshi

Brauzer rasmlarni fayl nomi bo'yicha keshlaydi, shuning uchun rasm manzillariga versiya
qo'shilgan: `/img/supercar-1.png?v=3`. Versiya raqami ikki joyda turadi —
`src/lib/racers.ts` va `src/lib/characters.ts` dagi `ASSET_VERSION`.

**`public/img/` dagi biror rasmni almashtirsangiz, `ASSET_VERSION` ni oshiring** — shunda
barcha brauzerlar yangi nusxani yuklaydi. Aks holda eski rasm ko'rinishda davom etadi.

## Fon musiqasi

O'yin ekranining pastki chap burchagidagi ♪ tugmasi musiqa panelini ochadi. Ikki kuy bor:

- **Standart kuy** — sokin, darsga xalaqit bermaydigan fon;
- **Energiya kuy** — musobaqa kayfiyati uchun jonliroq variant.

Ovoz balandligi sozlanadi, tanlov brauzerda saqlanadi va keyingi o'yinlarda avtomatik
qo'llanadi. Kuylar Web Audio API orqali real vaqtda sintez qilinadi — audio fayl ham,
internet ham talab qilinmaydi (mualliflik huquqi masalasi ham chiqmaydi). Yangi kuy qo'shish
uchun `src/lib/music.ts` dagi `TRACKS` va nota massivlariga yozuv qo'shing.

## Darsda qanday ishlatiladi

1. Ekranni proyektorga yoki interaktiv doskaga uzating, pastdagi masshtab tugmalari
   bilan o'lchamni moslang.
2. Sinfni ikkiga bo'ling; har bir jamoadan bir o'quvchi navbat bilan javob kiritadi.
3. Vaqt va g'alaba qadamlarini dars uzunligiga qarab sozlang
   (masalan: 3 daqiqa, 6 qadam — o'rtacha 4–5 daqiqalik o'yin).
   «Xato javob raqibga qadam beradi» yoqilgan bo'lsa o'yin tezroq va keskinroq kechadi;
   o'chirsangiz, xato faqat vaqt yo'qotadi.
4. O'yin oxirida statistika (to'g'ri/xato javoblar, eng uzun ketma-ketlik) chiqadi —
   mavzudagi bo'shliqlarni shu yerdan ko'rish qulay.

---

Ishlab chiquvchi: **@Gettalim**

---

## Yo'l xaritasi (v5)

Platforma uch xil ishlash rejimiga o'tmoqda. Har bir o'yin qaysi rejimlarni
qo'llab-quvvatlashi `src/lib/games/registry.ts` da e'lon qilinadi.

| Rejim | Tavsif | Holati |
|---|---|---|
| **Doska** (`local`) | Bitta kompyuter + proyektor, internetsiz | ✅ ishlayapti |
| **Ulangan** (`live`) | O'quvchilar PIN bilan o'z qurilmasidan qo'shiladi | Sprint 3 |
| **Mustaqil** (`homework`) | Uy vazifasi, muddat va jurnal bilan | Sprint 6 |

O'yinlar: Arqon tortish, Poyga, Savol yomg'iri (tayyor); Kim millioner, Xazina xaritasi,
Xotira jufti, Krossvord (Sprint 4–5).

### Sprint 1 — bajarildi

1. **`src/lib/games/registry.ts`** — barcha 7 o'yin, ular qo'llab-quvvatlaydigan rejimlar,
   jamoalar soni va tayyorlik holati (`ready` / `planned`) bitta joyda.
2. **Umumiy engine:**
   - `src/lib/games/feed.ts` — savol oqimi: navbatlar, aralashtirish, generator, ikki jamoaga
     bir xil savol tushmasligi. Uchala o'yin ham shundan foydalanadi.
   - `src/hooks/useQuizFlow.ts` — sanoq, taymer, pauza, yakun va javobdan keyin avtomatik
     o'tish (`useAutoAdvance`).
   - `useMatch` / `useRace` / `useRain` endi faqat **o'yinga xos** mantiqni saqlaydi
     (arqon qadamlari, poyga o'rinlari, yomg'ir jonlari). Takroriy kod ~40% qisqardi.
3. **Rejim tanlash ekrani** — har bir o'yin sozlamalarida uchta tugma. Hozircha faqat
   "Doskada o'ynash" faol; qolganlari qulf belgisi va "Tez orada" yozuvi bilan ko'rinadi,
   shunda o'qituvchi platforma qayoqqa ketayotganini biladi.
4. **Bosh sahifa** registrdan quriladi: 7 o'yin kartochkasi, har birida rejim belgilari;
   hali yozilmaganlarida "Tez orada".

Muhim: doska rejimi hech qanday serverga bog'lanmaydi — Supabase kalitlarisiz ham
uchala o'yin to'liq ishlaydi.


### Sprint 2 — bajarildi

#### Baza

`supabase/schema.sql` — 12 jadval, barchasida RLS yoqilgan:
`profiles`, `classes`, `class_students`, `packs`, `questions`, `sessions`,
`participants`, `answers`, `assignments`, `submissions`, `achievements`,
`user_achievements`.

RLS siyosatlari `security definer` yordamchi funksiyalar orqali yozilgan
(`my_role`, `is_class_teacher`, `is_class_member`, `can_read_pack`,
`is_session_host`, `is_session_participant`) — shunda siyosatlar bir-birini
chaqirib rekursiyaga tushmaydi. Yangi foydalanuvchi uchun profil trigger bilan
avtomatik yaratiladi.

#### Ishga tushirish

1. [supabase.com](https://supabase.com) da loyiha oching.
2. **SQL Editor** → `supabase/schema.sql` ni to'liq nusxalab **Run**.
3. **Authentication → Providers → Email** → **"Confirm email" ni o'chiring.**
   Bu shart: o'quvchilarda haqiqiy pochta yo'q, ular sintetik manzil bilan kiradi.
4. `.env.example` dan nusxa oling:

   ```bash
   cp .env.example .env.local
   ```

   va **Project Settings → API** dan `Project URL` hamda `anon key` ni qo'ying.
5. `npm run dev` — sarlavhada "Kirish" havolasi paydo bo'ladi.

#### Kirish tizimi

| Kim | Qanday kiradi |
|---|---|
| **O'qituvchi** | Elektron pochta + parol (`/royxat` da ro'yxatdan o'tadi) |
| **O'quvchi** | **Sinf kodi + ism-familiya + 4 xonali PIN** — pochta ham, ro'yxatdan o'tish ham kerak emas |

O'quvchi hisobini o'qituvchi yaratadi. Kirish ma'lumotlari sinf kodi va ismdan
**hisoblab topiladi** (`src/lib/auth/studentIdentity.ts`), shuning uchun tizim
kirishdan oldin bazadan hech narsa o'qimaydi — o'quvchilar ro'yxati tashqariga
ochilmaydi. Ism kirill yoki apostrofli bo'lsa ham to'g'ri ishlaydi.

O'qituvchi o'quvchi hisobini yaratganda **vaqtinchalik mijoz** ishlatiladi
(`createEphemeralClient`) — aks holda `signUp` o'qituvchini o'z hisobidan
chiqarib yuborardi.

#### Yangi sahifalar

| Sahifa | Vazifasi |
|---|---|
| `/kirish` | Kirish — o'qituvchi va o'quvchi uchun ikki bo'lim |
| `/royxat` | O'qituvchi ro'yxatdan o'tishi |
| `/dashboard` | O'qituvchi paneli: sinflar va o'quvchilar soni |
| `/dashboard/classes` | Sinf yaratish, o'quvchi qo'shish, PIN kodlari, chop etish |
| `/talaba` | O'quvchi kabineti: XP, daraja, streak |

`src/middleware.ts` sessiyani yangilaydi va `/dashboard` hamda `/talaba` ni
himoyalaydi. Supabase kalitlari qo'yilmagan bo'lsa middleware umuman
aralashmaydi — **doska rejimi avvalgidek ishlayveradi**, auth sahifalari esa
"bulut sozlanmagan" ekranini ko'rsatadi va o'yinga qaytishni taklif qiladi.


### Sprint 3 — bajarildi (ulangan rejim)

O'qituvchi doskada sessiya ochadi, o'quvchilar o'z telefonidan PIN bilan qo'shiladi.

#### Qanday ishlaydi

1. `/yomgir` → **"O'quvchilar qurilmasida"** → **Sessiyani ochish**.
2. Doskada `/host/[sessionId]` ochiladi: katta PIN kod va `/join` manzili.
3. O'quvchilar `/join` ga kirib PIN va ismini yozadi → `/play/[pin]`.
4. O'qituvchi **Boshlash** bosadi; har savolga 20 soniya. Hamma javob bersa
   taymer kutmaydi. Javob ochilganda TOP-5 chiqadi.

#### Hisob shart emas

O'quvchi hisobsiz ham qo'shila oladi — shunchaki ismini yozadi. Hisobi bo'lsa
(sinf kodi + PIN bilan kirgan bo'lsa) ismi o'zi to'ladi va natija uning
profiliga bog'lanadi. Shu bilan ikkala ehtiyoj qoplanadi: darsda tez boshlash
va jurnalga yozish.

#### Texnik qarorlar

- **Holat broadcast orqali tarqaladi**, o'quvchi qurilmasi bazaga umuman
  murojaat qilmaydi. Shuning uchun 30 ta o'quvchi ulansa ham baza yuklanmaydi
  va jadvallar anon foydalanuvchiga ochilmaydi.
- Qo'shilish faqat ikkita `security definer` funksiya orqali: `join_session`
  va `peek_session`. Qayta ulangan o'quvchiga yangi qatnashuvchi yaratilmaydi.
- **To'g'ri javobni o'quvchi qurilmasi bilmaydi** — u faqat tanlovini yuboradi,
  tekshirishni o'qituvchi ekrani bajaradi. Shunday qilib brauzer konsolidan
  javobni ko'rib bo'lmaydi.
- Ball tezlikka bog'liq: to'g'ri javob 100, tez javob uchun 50 gacha qo'shimcha.
- Javoblar jurnalga sessiya egasi nomidan yoziladi (`answers` jadvali), shuning
  uchun mehmon o'quvchilar uchun ham natija saqlanadi.

#### Hozircha qamrov

Ulangan rejim **Savol yomg'irida** yozildi. Arqon va Poyga uchun jamoaviy
ulangan rejim keyingi bosqichda — ular uchun jamoaga bo'lish oynasi ham kerak.
Sozlash ekranida bu holat ochiq ko'rsatilgan.


### Sprint 3 — bajarildi (ulangan rejim)

O'quvchilar o'z telefoni yoki kompyuteridan qo'shilib o'ynaydigan rejim ishga tushdi.
Hozircha **Savol yomg'iri**da; Arqon va Poyga keyingi bosqichda shu tayyor qatlamga ulanadi.

#### Qanday ishlaydi

1. O'qituvchi `/yomgir` da **"O'quvchilar qurilmasida"** ni tanlab, "Sessiyani ochish" tugmasini bosadi.
2. Ekranda **6 xonali PIN** va `.../join` manzili chiqadi — proyektorga chiqarish uchun katta qilib.
3. O'quvchilar `/join` ga kirib PIN, ismini va jamoa raqamini yozadi. **Hisob kerak emas.**
4. O'qituvchi "Boshlash" ni bosadi; har savol uchun taymer ketadi, javob berganlar soni jonli ko'rinadi.
5. "Javobni ko'rsatish" → to'g'ri variant yashil bo'ladi, o'quvchilarda "To'g'ri!/Xato" chiqadi.
6. Yakunda TOP ro'yxati ikkala ekranda ham ko'rinadi.

#### Arxitektura qarorlari

**Holat broadcast orqali tarqatiladi, bazaga yozilmaydi.** O'yin holati (savol, bosqich,
taymer) Supabase Realtime broadcast kanali `gettalim:{PIN}` orqali yuboriladi. Shuning
uchun 30 ta o'quvchi bir vaqtda javob berganda ham baza navbatga tushmaydi. Bazaga faqat
**natija** yoziladi — jurnal to'liq saqlanadi.

**To'g'riligini HOST hisoblaydi.** O'quvchi qurilmasiga to'g'ri javob **hech qachon
yuborilmaydi** — faqat savol va variantlar boradi. O'quvchi tanlovini yuboradi, o'qituvchi
kompyuteri baholaydi va `submit_answer` RPC orqali bazaga yozadi. Ya'ni sahifa kodini
ochib javobni topib bo'lmaydi.

**Hisobsiz qo'shilish.** `join_session` va `submit_answer` — `security definer` funksiyalar,
shuning uchun mehmon o'quvchi RLS'ni ochmasdan o'ynay oladi. Hisobi bor o'quvchi kirgan
bo'lsa, ismi avtomatik to'ldiriladi va natija uning profiliga bog'lanadi.

**Savollar o'qituvchi kompyuteridan.** Paketlar `localStorage` da qolaveradi — sessiya
ochilganda ular bazaga ko'chirilmaydi, savollar broadcast bilan yuboriladi. Shuning uchun
mavjud paket kutubxonangiz o'zgarishsiz ishlaydi.

#### Yangi fayllar

| Fayl | Vazifasi |
|---|---|
| `src/lib/live/protocol.ts` | Kanal nomi, xabar turlari, o'quvchi seansini saqlash |
| `src/lib/live/api.ts` | Sessiya ochish, qo'shilish, javob yuborish |
| `src/hooks/useHostSession.ts` | HOST: savollar, taymer, javoblarni yig'ish va baholash |
| `src/hooks/usePlayerSession.ts` | O'quvchi: holatni olish, javob yuborish |
| `src/app/join/page.tsx` | PIN kiritish |
| `src/app/play/[pin]/page.tsx` | O'quvchi ekrani (mobil-birinchi, katta rangli tugmalar) |
| `src/app/host/[sessionId]/page.tsx` | O'qituvchi ekrani (proyektor uchun) |

`supabase/schema.sql` ga uchta RPC qo'shildi: `join_session`, `submit_answer`,
`session_state`. **Sxemani qayta ishga tushiring** — fayl idempotent, ma'lumot yo'qolmaydi.

#### Sinov haqida ochiq gap

Bu bosqich jonli Supabase loyihasida sinalmadi — kalitlar sizda. Kod, sxema va oqim
to'liq yozilgan, barcha sahifalar qurilgan va renderlanadi. Kalitlarni qo'ygach birinchi
tekshiruv: bitta sessiya oching, ikkinchi brauzer oynasidan `/join` ga kiring — ism
o'qituvchi ekranida darhol paydo bo'lishi kerak.


### Sinf musobaqasi — butun sinf o'z qurilmasidan

Ulangan rejim endi **uchala o'yinda** ham ishlaydi: Arqon tortish, Poyga va Savol yomg'iri.
20–30 o'quvchi bir vaqtda o'z kompyuteri yoki telefonidan qatnashadi.

#### Dars qanday kechadi

1. O'qituvchi o'yin sozlamalarida **"O'quvchilar qurilmasida"** ni tanlab, "Sessiyani ochish" bosadi.
2. Proyektorda **QR kod**, manzil va **6 xonali PIN** chiqadi. O'quvchilar QR ni skanerlaydi yoki
   manzilni yozadi — hisob kerak emas, faqat ism.
3. Hamma qo'shilgach, **"Jamoalarga bo'lish"** tugmasi sinfni teng ikkiga (yoki to'rtga) bo'ladi.
   Kerak bo'lsa o'quvchi ismini bosib, uni boshqa jamoaga o'tkazish mumkin.
4. "Boshlash" — har savolga taymer ketadi, javob berganlar soni jonli ko'rinadi.
5. Har bir **to'g'ri javob jamoaga bir ochko** beradi. Arqon shu farq bo'yicha tortiladi,
   poygada mashinalar shu ochkolar bo'yicha oldinga siljiydi — ya'ni doskadagi o'yin
   ko'rinishi butun sinfning javoblari bilan boshqariladi.
6. Yakunda g'olib jamoa va eng yaxshi o'nlik ko'rsatiladi.

#### O'quvchi ekranida

Yuqorida jamoalar hisobi (o'zining jamoasi rangli, yetakchida 👑), pastda katta rangli
A/B/C/D tugmalari. Javobdan keyin "To'g'ri!/Xato", o'z bali va jamoasining hisobi.
Telefon uchun moslangan — matn yozish yo'q, faqat bosish.

#### Nega bunday qurilgan

- **Har bir o'quvchi hisobga olinadi.** Faqat eng tez javob bergan emas, hammaning javobi
  jamoa hisobiga qo'shiladi — shunda sinfning orqa qatoridagi bola ham o'ynaydi.
- **Jamoa hisobi = to'g'ri javoblar soni**, shaxsiy ball esa tezlikni ham hisobga oladi.
  Shu tufayli jamoa musobaqasi adolatli, shaxsiy reyting esa qiziqarli bo'ladi.
- **Jamoalar teng bo'linadi** (aralashtirib, navbatma-navbat), lekin o'qituvchi qo'lda
  o'zgartira oladi.


### Sinf testi — butun sinf o'z qurilmasidan (yangilangan ulangan rejim)

Ulangan rejim "sinf testi" modeliga o'tkazildi. O'quvchi qurilmasida o'yin
ko'rinishi (arqon, poyga) emas — **sof test interfeysi**: savol va katta rangli
javob tugmalari. Barcha o'yinlar shu bir xil oqimdan foydalanadi.

#### Dars tartibi

1. O'qituvchi o'yin sozlamalarida **"O'quvchilar qurilmasida"** ni tanlaydi.
   Shu yerda **savollar soni** (10–60) va **test vaqti** (3–20 daqiqa) belgilanadi.
2. "Sessiyani ochish" → proyektorda **QR kod**, manzil va **PIN** chiqadi.
3. O'quvchilar QR ni skanerlaydi yoki `/join` da PIN kiritadi. Hisobi bor
   o'quvchi kabinetidagi maydonga ham PIN yozib kirishi mumkin.
4. Hamma qo'shilgach o'qituvchi **"Testni boshlash"** ni bosadi.
5. Vaqt tugaguncha **har bir o'quvchi o'z tezligida** yechadi — kim tez va to'g'ri
   javob bersa, o'sha tepaga chiqadi.
6. Vaqt tugagach natijalar avtomatik yakunlanadi: sovrindorlar va to'liq reyting.

#### Nega har kim o'z tezligida

Kahoot uslubidagi "hamma bitta savolda" oqimida sinf eng sekin o'quvchi tezligida
yuradi va kuchli bolalar zerikadi. Bu yerda savollar banki bir marta tarqatiladi,
keyin har kim o'z yo'lidan yuradi — 25 kishilik sinfda bu ancha jonli chiqadi.

**Ko'chirishga qarshi:** har bir o'quvchi bankning **boshqa nuqtasidan** boshlaydi
(ismidan hisoblangan siljish), shuning uchun yonidagi partadagi bolada ayni damda
boshqa savol turadi. To'g'ri javob esa o'quvchi qurilmasiga **hech qachon
yuborilmaydi** — faqat o'qituvchi kompyuterida qoladi va u baholaydi.

#### Sinf monitori uchun reyting

`src/components/live/LeaderBoard.tsx` — barcha o'quvchilarning kartochkasi:
o'rin, ism qisqartmasi, ball, to'g'ri/xato soni va ketma-ket to'g'ri javoblar
(🔥 3 tadan boshlab). Kartochkalar ball bo'yicha tartiblanadi va **o'rin
o'zgarganda FLIP animatsiyasi bilan siljib o'tadi** — sinf monitorida eng
ko'zga tashlanadigan narsa shu.

O'lchamlar o'quvchilar soniga qarab o'zi moslashadi: 10 tagacha — juda katta
kartochkalar, 30 tagacha — o'rtacha, undan ko'p bo'lsa 5 ustun. 25 kishilik sinf
1920×1080 monitorga to'liq sig'adi.

Reyting har **0.7 soniyada** yangilanadi — 25 ta qurilma bir vaqtda javob berganda
ham tarmoq bo'sh qoladi.

#### Ball hisobi

To'g'ri javob **100 ball**, tez javob uchun **50 ballgacha** qo'shimcha
(har 0.4 soniyaga 1 ball kamayadi). Jamoalar yoqilgan bo'lsa, jamoa hisobi
faqat **to'g'ri javoblar soni** bo'yicha yuritiladi — sekinroq o'quvchi ham
jamoasiga foyda keltiradi.

#### Rol bilan bog'liq tuzatish

Agar hisobingiz o'quvchi sifatida ochilib qolgan bo'lsa (sessiya ochmoqchi
bo'lganda "faqat o'qituvchi ocha oladi" yozuvi chiqsa), `/dashboard` da
**"O'qituvchi rejimiga o'tish"** tugmasi paydo bo'ladi.

Xavfsizlik uchun `supabase/migration-02-roles.sql` ni ham ishga tushiring:
u o'quvchilarga (sintetik pochtali hisoblarga) rolni o'zgartirishni taqiqlaydi,
haqiqiy pochtali o'qituvchiga esa ruxsat beradi.


### Sprint 4 — Kim millioner va Xotira jufti

Platformaga ikkita yangi o'yin qo'shildi. Ikkalasi ham doska rejimida ishlaydi.

#### 💰 Kim millioner bo'ladi (`/millioner`)

15 bosqichli narvon: 1 000 so'mdan 5 000 000 so'mgacha. **5- va 10-bosqich
kafolatlangan** — undan keyin yiqilsangiz ham o'sha summa qoladi.

Savollar qiyinligi bo'yicha tartiblanadi: paketdagi `level` maydoni (1–3) hisobga
olinadi, birinchi beshtasi oson, oxirgisi qiyin. Paketda `level` bo'lmasa savollar
aralashtiriladi.

**Uchta yordam, har biri bir martadan:**

| Yordam | Nima qiladi |
|---|---|
| 50 : 50 | Ikkita xato variantni o'chiradi |
| Zaldan so'rash | Ustunli diagramma. To'g'ri javob ustunligi bosqich oshgani sari kamayadi |
| Do'stga qo'ng'iroq | Matnli taxmin. Qiyin savolda ishonchsizroq javob beradi |

O'yinchi istalgan bosqichda **to'xtab, yig'ilgan summani olishi** mumkin.
Jamoalar (1–4) navbat bilan o'ynaydi: biri yiqilgach yoki to'xtagach, keyingisi
o'z narvonini boshlaydi. Oxirida jamoalar summasi bo'yicha jadval chiqadi.

Klaviatura: `A` `B` `C` `D` yoki `1` `2` `3` `4`.

#### 🧠 Xotira jufti (`/xotira`)

Kartochkalarda **atama va uning ta'rifi** juftlanadi: savol matni bir tomonda,
javob ikkinchisida. Juft topilganda ikkalasi birga ko'rsatiladi — o'quv qiymati
aynan shu yerda.

To'r o'lchamlari: 4×4 (8 juft), 4×5 (10 juft), 6×6 (18 juft). Sozlash ekrani
paketda nechta noyob javob borligini hisoblab, qaysi to'r sig'ishini o'zi
aytadi.

1–4 jamoa navbat bilan o'ynaydi: **juft topgan jamoa yana o'ynaydi**, topolmasa
navbat keyingisiga o'tadi. Yakka rejimda vaqt va urinishlar soni sanaladi.

Muhim: javobi bir xil savollar tashlab ketiladi — aks holda bitta atamaga ikkita
ta'rif to'g'ri kelib qolardi. Arifmetika generatorlari bu o'yinda ishlamaydi,
chunki juftlik uchun matnli atama kerak.

#### Yangi fayllar

| Fayl | Vazifasi |
|---|---|
| `src/lib/games/millioner/engine.ts` | Narvon, yordamlar, savol tartibi — sof funksiyalar |
| `src/hooks/useMillioner.ts` | O'yin holati (reducer) |
| `src/app/millioner/` | Sozlash va o'yin ekrani |
| `src/lib/games/xotira/engine.ts` | Juftliklar to'plamini yasash |
| `src/hooks/useXotira.ts` | To'r holati, navbat, hisob |
| `src/app/xotira/` | Sozlash va o'yin ekrani |

Qolgan ikki o'yin — **Xazina xaritasi** va **Krossvord** — Sprint 5 da.


### Tuzatish: "column reference status is ambiguous"

Ulangan rejimda o'quvchi PIN kiritganda shu xato chiqsa — `join_session`
funksiyasining eski nusxasi bazada turgan bo'ladi. Sabab: funksiya qaytaradigan
ustunlar (`status`, `session_id`) jadval ustunlari bilan bir xil nomlangan edi
va PostgreSQL `where` ichida qaysi birini nazarda tutganini ajrata olmagan.

**Yechim:** Supabase → SQL Editor da `supabase/migration-03-join-fix.sql` ni
ishga tushiring. Funksiyalar qayta yaratiladi, ma'lumot yo'qolmaydi.

Yangi o'rnatishlarda `supabase/schema.sql` allaqachon tuzatilgan.


### Ulangan rejim: qotib qolishga qarshi himoya

Test paytida o'quvchi ekranida "Tekshirilmoqda…" yozuvi qotib qolishi mumkin edi —
javob yuborilgan, lekin o'qituvchi kompyuteridan tasdiq qaytmagan. Uch qatlamli
himoya qo'shildi:

1. **O'quvchida zaxira taymer.** Tasdiq 4 soniyada kelmasa, holat qayta so'raladi
   va savol o'tkazib yuboriladi ("Aloqa sekinlashdi" yozuvi bilan). O'yin
   hech qachon to'xtab qolmaydi.
2. **Qo'lda o'tish tugmasi.** Kutish paytida "Keyingi savolga o'tish" tugmasi
   chiqadi — o'quvchi o'zi ham davom ettira oladi.
3. **HOST sahifasi tiklanadi.** Savollar banki va tugash vaqti brauzerda
   saqlanadi, shuning uchun o'qituvchi sahifani tasodifan yangilab yuborsa ham
   test davom etadi. Ilgari bunda bank yo'qolib, hech kimga javob qaytmasdi.

Bundan tashqari ball hisobi React qayta chizishini kutmaydigan qilib yozildi —
tasdiqda har doim to'g'ri ball va o'rin qaytadi (ilgari ba'zan 0 ketardi).


### Sprint 5 — Xazina xaritasi va Krossvord

Yo'l xaritasidagi oxirgi ikki o'yin qo'shildi. Endi platformada **ettita** o'yin bor.

#### 🗺️ Xazina xaritasi (`/xazina`)

2–4 jamoa navbat bilan javob beradi. **To'g'ri javob — bir katak oldinga**, xato
javobda joyida qoladi. Katakka tushgach uning ta'siri ishlaydi:

| Katak | Ta'siri |
|---|---|
| ⭐ Bonus | 2–3 katak oldinga uchiradi |
| 🕳️ Tuzoq | 1–3 katak orqaga qaytaradi |
| 🎲 Omad | Tasodifiy: ±1…3 katak |
| 💎 Xazina | Marra — birinchi yetgan jamoa g'olib |

**Kataklar har o'yinda qaytadan tasodifiy joylashadi**, shuning uchun o'qituvchi
tayyorgarlik ko'rmaydi va bir sinfga ikki marta bir xil xarita tushmaydi.
Voqealar 3-katakdan boshlanadi — birinchi qadamdayoq orqaga tushib qolish
qiziq emas. Xohlasangiz bonus va tuzoqlarni butunlay o'chirib qo'yish mumkin.

Navbat har javobdan keyin keyingi jamoaga o'tadi — to'g'ri javob bergan jamoa ham
navbatni ushlab qolmaydi, shunda hamma teng o'ynaydi.

#### 🔡 Krossvord (`/krossvord`)

Savollar paketidan **avtomatik krossvord** quriladi: javob — so'z, savol — ta'rif.
So'zlar kesishgan harflar orqali ulanadi.

Generator so'zlarni uzunligi bo'yicha tartiblab joylashtiradi va **14 marta
qaytadan urinib**, eng ko'p so'z sig'gan variantni tanlaydi. Kesisha olmagan
so'zlar tashlab ketiladi — ularning soni ekranda ko'rsatiladi.

Krossvordga faqat **bitta so'zli, 3–12 harfli** javoblar tushadi. O'zbekcha tutuq
belgilari (o', g') olib tashlanadi, chunki har katakda bitta harf turishi kerak.
Sozlash ekrani paketda nechta yaroqli so'z borligini oldindan ko'rsatadi.

To'ldirish qulay: strelkalar bilan yurish, `Probel` — yo'nalishni almashtirish,
`Backspace` — orqaga. Savolni bosish kursorni o'sha so'zga olib boradi.
"Tekshirish" to'g'ri harflarni yashil, xatolarini qizil qiladi.

**Chop etish** tugmasi qog'ozga tayyorlaydi — sozlashda "Savollar ko'rinsin" ni
o'chirsangiz, faqat to'r chiqadi.

#### Endi barcha yettita o'yin tayyor

| O'yin | Jamoalar | Doska | Ulangan |
|---|---|---|---|
| Arqon tortish | 2 | ✅ | ✅ |
| Poyga | 2–4 | ✅ | ✅ |
| Savol yomg'iri | 1–2 | ✅ | ✅ |
| Kim millioner | 1–4 | ✅ | — |
| Xotira jufti | 1–4 | ✅ | — |
| Xazina xaritasi | 2–4 | ✅ | — |
| Krossvord | 1 | ✅ | — |


### Sprint 6 — Uy vazifasi rejimi

O'qituvchi sinfga muddat bilan topshiriq beradi, o'quvchi uyda o'z kabinetidan
ochib yechadi, natija esa jurnalga o'zi tushadi.

#### Qaysi o'yinlar

Uy vazifasiga **yolg'iz o'ynaladigan** to'rt o'yin beriladi:
Savol yomg'iri, Kim millioner, Xotira jufti, Krossvord.
Arqon tortish, Poyga va Xazina jamoaviy — ular sinfda o'ynaladi.

#### O'qituvchi tomoni — `/dashboard/assignments`

Sinf, o'yin, savollar paketi, muddat va urinishlar sonini tanlab "Topshiriq berish".
Ro'yxatdagi topshiriqni bosish **jurnalni** ochadi: sinfdagi har bir o'quvchi,
urinishlar soni, eng yaxshi natija va topshirilgan vaqt.

#### O'quvchi tomoni — `/talaba`

Topshiriqlar ro'yxati muddati bo'yicha tartiblangan holda ko'rinadi. Har birida
o'yin nomi, muddat, sarflangan urinishlar va eng yaxshi natija. "Boshlash" tugmasi
o'yinni `?vazifa=<id>` bilan ochadi — o'yin yolg'iz rejimga o'tadi va tugagach
natijani jurnalga yozadi.

#### Muhim arxitektura qarori: savollar bulutga ko'chiriladi

Doska rejimida savollar o'qituvchi kompyuterining `localStorage` ida qoladi —
bu ataylab shunday, chunki internetsiz ham ishlashi kerak. Lekin uy vazifasida
o'quvchi boshqa qurilmada, shuning uchun **topshiriq berilayotganda paket bazaga
ko'chiriladi** (`src/lib/homework/packs.ts`).

Har bir topshiriq o'z paket nusxasini oladi. Bu ataylab: o'qituvchi keyin
paketni o'zgartirsa, allaqachon berilgan topshiriq o'zgarmaydi — o'quvchilar
hammasi bir xil savollarni ko'radi.

RLS qoidasi: o'quvchi faqat **o'ziga berilgan** topshiriqning paketini o'qiy oladi
(`pack_assigned_to_me`), boshqa paketlar ko'rinmaydi.

#### Ishga tushirish

Supabase → SQL Editor → `supabase/migration-04-homework.sql` ni ishga tushiring.
U ruxsat qoidalarini va jurnal uchun `assignment_stats` funksiyasini qo'shadi.

#### Yangi fayllar

| Fayl | Vazifasi |
|---|---|
| `src/lib/homework/packs.ts` | Paketni bulutga chiqarish va qaytarib olish |
| `src/lib/homework/api.ts` | Topshiriqlar, natijalar, jurnal |
| `src/hooks/useHomework.ts` | O'yin sahifasini uy vazifasi rejimiga ulaydi |
| `src/app/dashboard/assignments/` | O'qituvchi: topshiriq berish va jurnal |
| `src/components/HomeworkHint.tsx` | Sozlash ekranidagi yo'riqnoma |


### Sprint 7 — Gamifikatsiya (yakuniy bosqich)

O'quvchining mehnati ko'rinadigan bo'ldi: XP, daraja, kunlik streak va nishonlar.

#### XP va daraja

XP ikki joydan yig'iladi:

| Manba | XP |
|---|---|
| Uy vazifasi | 20 + natijaga qarab 80 gacha |
| Ulangan rejim (sinf testi) | ballga qarab 120 gacha + sovrindorlik bonusi |

Daraja XP ning kvadrat ildiziga bog'liq — boshida tez ko'tariladi, keyin
sekinlashadi (250 XP — 2-daraja, 1000 — 3-daraja, 2250 — 4-daraja). Har bir
darajaning nomi bor: *Yangi boshlovchi → Izlanuvchi → Bilimdon → Zukko →
Ustoz → Bilim chempioni*.

**Barcha hisob-kitob bazada bajariladi** (`award_xp` funksiyasi). Bu ataylab
shunday: aks holda o'quvchi brauzer konsolidan o'ziga XP qo'shib qo'yardi.

#### Kunlik streak

Har kuni o'ynasa streak oshadi, bir kun tashlab ketsa 1 dan boshlanadi.
Kecha o'ynagan bo'lsa — davom etadi, bugun ikkinchi marta o'ynasa — takror
hisoblanmaydi. 10 kunga yetganda nishon avtomatik beriladi.

#### Nishonlar

| Nishon | Qanday olinadi |
|---|---|
| 🏆 Birinchi g'alaba | Sinf testida 1-o'rin |
| 🔥 10 kun ketma-ket | 10 kunlik streak |
| 💎 Xatosiz o'yin | Topshiriqni to'liq ballga yechish |
| ⚡ Chaqmoq javob | 10+ to'g'ri javob, bitta ham xatosiz |
| 🔡 Krossvord ustasi | Krossvord topshirig'ini to'liq to'ldirish |

#### Sinf reytingi

O'quvchi kabinetida sinfdoshlarining XP reytingi ko'rinadi — o'zi ajratib
ko'rsatiladi. RLS qoidasi bo'yicha faqat **o'z sinfi** ko'rinadi, boshqa
sinflar yopiq.

#### Ishga tushirish

Supabase → SQL Editor → `supabase/migration-05-gamification.sql`.

#### Yangi fayllar

| Fayl | Vazifasi |
|---|---|
| `supabase/migration-05-gamification.sql` | XP, daraja, streak, nishonlar, reyting |
| `src/lib/gamification/api.ts` | XP hisoblash qoidalari va RPC chaqiruvlari |
| `src/components/gamification/ProgressPanel.tsx` | Daraja chizig'i va nishonlar |

---

## Yo'l xaritasi yakunlandi

Yettita sprint ham bajarildi. Platformada:

- **7 o'yin**: Arqon tortish, Poyga, Savol yomg'iri, Kim millioner, Xotira jufti,
  Xazina xaritasi, Krossvord;
- **3 rejim**: doska (internetsiz), ulangan (butun sinf o'z qurilmasidan),
  uy vazifasi (muddat va jurnal bilan);
- **o'qituvchi paneli**: sinflar, o'quvchilar, topshiriqlar, jurnal;
- **gamifikatsiya**: XP, daraja, streak, nishonlar, sinf reytingi.

Doska rejimi hamon Supabase'siz to'liq ishlaydi — dars payti internet uzilsa ham
o'yinlar to'xtamaydi.


### Interfeys yangilanishi

Uchta ekran qayta ishlandi.

#### 1. Poyga: model tanlash

Otlar va mashinalar kichik kataklarda kesilib turardi. Endi ular **trek uslubidagi
lentada** to'liq ko'rinadi: yo'lakcha chizig'i, soya, tanlangan variantda "Tanlandi"
belgisi. Rasm hech qayerda kesilmaydi.

#### 2. O'quvchi ekrani (ulangan rejim)

Tekis rangli to'rtburchaklar o'rniga:

- to'q fon va jamoa rangidagi yumshoq yorug'lik;
- yuqorida o'rin, ism, jamoa, taymer, ulanish nuqtasi va ball;
- savol oq kartochkada, yonida to'g'ri/xato hisobi va ketma-ket to'g'ri javob belgisi;
- variantlar gradientli kartochkalar — har biri o'z rangida, katta shaffof harf bilan,
  bosilganda cho'kadi, navbat bilan chiqadi;
- javob berilgach yashil/qizil tasdiq animatsiya bilan chiqadi;
- yakunda kubok, ball, o'rin, aniqlik foizi va olingan XP.

#### 3. Savol yomg'iri

Endi haqiqiy yomg'irga o'xshaydi:

- osmon gradienti, sekin suzuvchi bulutlar va fon yomg'iri;
- variantlar **tebranib, biroz qiyshayib** tushadi — to'g'ri chiziq bo'ylab emas;
- har bir tomchi orqasida iz qoldiradi;
- yerga tushganda **suv sachraydi** va ko'lmakda to'lqin tarqaladi;
- pastda ko'lmak chizig'i.

Yo'lakchalar chetdan kamida 25% uzoqlikda joylashadi — shuning uchun uzun javob
matni ekrandan chiqib ketmaydi (ilgari "Operativ (vaqtinchalik) xot…" bo'lib
kesilardi). Matn ikki qatorgacha sig'adi.


### Kirish ma'lumotlarini bir bosishda tarqatish

O'quvchilar sinf kodi va PIN kodini tez-tez unutadi. Endi o'qituvchi bir marta
bosadi — **ayni damda tizimda turgan barcha o'quvchilar o'z qurilmasida** o'z
ism-familiyasi, sinf kodi va PIN kodini ko'radi.

#### Qanday ishlatiladi

`/dashboard/classes` yoki `/dashboard/kartochkalar` sahifasida sinfni tanlang.
Tugma yonida **nechta o'quvchi ayni damda tizimda** ekani ko'rinib turadi
(ustiga sichqonchani olib borsangiz ismlari chiqadi). **"Hammaga ko'rsatish"**
bosilganda har bir qurilmada oyna ochiladi. **"Yopish"** — barcha qurilmalarda
bir vaqtda yopadi.

#### Xavfsizlik

**PIN kanal orqali yuborilmaydi.** Signal kelganda har bir qurilma o'z
ma'lumotini bazadan o'zi oladi, RLS esa o'quvchiga faqat **o'z satrini** ko'rish
huquqini beradi. Ya'ni bir o'quvchining PIN kodi hech qachon boshqa qurilmaga
tushmaydi — kanalda faqat "ko'rsat" degan signal yuradi.

#### Qo'shimcha: kartochkalar sahifasi

`/dashboard/kartochkalar` — o'quvchilar ro'yxati kartochka ko'rinishida:

- **Yirik ko'rinish** — proyektorga chiqarish uchun;
- **PIN'ni yashirish** — ekran ochiq qolganda maxfiylik uchun;
- **Chop etish** — qirqib tarqatish uchun tayyor, punktir chegarali kartochkalar;
- ism bo'yicha qidiruv — bitta o'quvchining kodini tez topish uchun.

#### Yangi fayllar

| Fayl | Vazifasi |
|---|---|
| `src/lib/live/classChannel.ts` | Sinf kanali nomi va hodisalari |
| `src/components/auth/StudentCredentials.tsx` | O'quvchi qurilmasidagi tinglovchi va oyna |
| `src/components/dashboard/BroadcastCredentials.tsx` | O'qituvchi tugmasi va onlayn hisoblagich |
| `src/app/dashboard/kartochkalar/` | Kartochkalar sahifasi |


### Kodini unutgan o'quvchi uchun: `/kod` sahifasi

Ilgari kirish ma'lumotini faqat **allaqachon tizimda turgan** o'quvchi ko'ra olardi —
kodini unutgan bola esa kira olmagani uchun ko'rolmasdi ham. Endi bu yopildi.

#### O'qituvchi tomoni — bitta bosish

`/dashboard/classes` yoki `/dashboard/kartochkalar` da **"Ma'lumotlarni ko'rsatish
(15 daq)"** tugmasi. Bosilganda:

1. sinf ro'yxati **15 daqiqaga ochiladi** — bu vaqtda kim sinf kodini bilsa,
   `/kod` sahifasida o'z ismini topib PIN kodini ko'radi;
2. tizimda turganlarning ekranida ma'lumot oynasi darhol ochiladi.

Tugma yonida qolgan vaqt sanog'i va manzil (`.../kod`) turadi — uni doskaga yozib
qo'ysangiz kifoya. "Yopish" bosilsa ro'yxat darhol yopiladi.

#### O'quvchi tomoni

`/kirish` → «O'quvchi» → **"Ma'lumotimni topish"**. Sinf kodini kiritadi,
ro'yxatdan o'z ismini bosadi va sinf kodi bilan PIN kodini ko'radi.
"Tizimga kirish" tugmasi kirish formasini oldindan to'ldirib beradi.

#### Nega vaqt bilan cheklangan

Bu sahifa hisobsiz ochiladi — ya'ni havolani bilgan har kim kira oladi. Agar
ro'yxat doim ochiq tursa, o'quvchilarning ism-familiyasi va kirish kodlari
internetda ochiq qolib, izlash tizimlariga tushardi. Shuning uchun:

- ro'yxat faqat o'qituvchi ochgan **15 daqiqa** ichida ishlaydi (eng ko'pi 2 soat);
- ochish uchun **sinf kodi** kerak — u faqat sinfda aytiladi;
- ro'yxatda avval **faqat ismlar** keladi, PIN esa siz o'z ismingizni bosgandan
  keyin alohida so'raladi. Ya'ni butun sinfning kodlari bitta so'rovda tashqariga
  chiqmaydi.

#### Ishga tushirish

Supabase → SQL Editor → `supabase/migration-06-roster.sql`.


### Test ekrani — yakuniy dizayn

O'quvchi qurilmasidagi ekran to'liq qayta ishlandi. Endi u shunchaki tugmalar
emas, jonli o'yin ekrani.

| Element | Nima qiladi |
|---|---|
| **Fon** | Uch qatlamli yumshoq yorug'lik sekin harakatlanadi (jamoa rangida) |
| **Taymer** | Halqa bo'ylab kamayadi, oxirgi 30 soniyada qizaradi |
| **Ball** | Birdan sakramaydi, silliq o'sadi; ustidan «+130» uchib chiqadi |
| **O'rin** | Ko'tarilsa yashil, tushsa qizil belgi chiqadi, halqa pulsatsiya qiladi |
| **Savol** | Har savolda yuqoridan sirg'alib chiqadi |
| **Variantlar** | Navbat bilan chiqadi, bosilganda cho'kadi va yorishadi |
| **To'g'ri javob** | Yashil halqa bilan yorishadi, ekran bo'ylab yashil chaqnash |
| **Xato javob** | Kartochka silkinadi, qizil chaqnash |
| **Ketma-ket** | 3 tadan boshlab olov belgisi va sanoq |
| **Yakun** | Sovrindorlarga konfetti, kubok animatsiya bilan chiqadi |
| **Tebranish** | Telefonda javob berilganda qisqa vibratsiya |

Animatsiyalar CSS orqali ishlaydi, protsessorga yuk bermaydi.

Fayllar: `src/components/live/PlayEffects.tsx` (taymer halqasi, konfetti, fon,
ball sanog'i), `src/app/play/[pin]/page.tsx`, `tailwind.config.ts` (yangi
animatsiyalar).


## Mashqlar bo'limi

O'yinlar bilgan narsani tekshiradi, mashqlar esa **yangi narsa o'rgatadi**.
Har biri 10–15 daqiqalik bo'lak — 90 daqiqalik darsning istalgan joyiga sig'adi.

Manzil: `/mashq`

### 🧩 Algoritm yig'ish (2–11 sinf)

Aralashtirilgan qadamlardan to'g'ri algoritm yig'iladi. Qadamni bosib
joylashtiriladi, keyin strelkalar bilan tartibi to'g'rilanadi — sudrab tashish
yo'q, shuning uchun telefonda ham qulay.

Qiyinlik to'rt bosqichda:

| Bosqich | Nima o'rganiladi | Topshiriqlar |
|---|---|---|
| 2–4 sinf | Ketma-ketlik tushunchasi | Choy damlash, maktabga tayyorgarlik, Paint'da rasm, qo'lni yuvish |
| 5–7 sinf | Shart bloki paydo bo'ladi | Hujjatni saqlash, dastur o'rnatish, xat yuborish, kuchli parol |
| 8–9 sinf | Takrorlanish, hisoblagich | Eng katta son, o'rta arifmetik, juft sonlarni sanash |
| 10–11 sinf | Klassik algoritmlar | Evklid algoritmi, pufakcha saralash, ikkilik qidiruv |

Har bir qadam turi rangi bilan ajratilgan: boshlanish, amal, kiritish, chiqarish,
shart, takrorlash, tugash — ya'ni bola blok-sxema tilini ham o'rganadi.

Yechilgandan keyin **asosiy o'quv fikri** chiqadi. Masalan Evklid algoritmida:
«Bu algoritm 2300 yildan beri ishlatiladi. Sirri oddiy: katta sonni kichigiga
bo'lib, qoldiq bilan davom etiladi».

Ikki marta xato qilinsa maslahat tugmasi paydo bo'ladi.

### 🔢 Sanoq sistemalari (5–11 sinf)

Uch bo'limdan iborat.

**Nazariya** — oltita bo'lim: sanoq sistemasi nima, nega kompyuter ikkilikdan
foydalanadi, ikkilikdan o'nlikka o'tish, o'nlikdan ikkilikka, o'n oltilik nima
uchun kerak, bu bilim qayerda ishlatiladi. Har birida jadval ko'rinishidagi misol.

**Lampochkalar** — asosiy topilma. Sakkizta lampochka, har biri bir bit.
Bosilganda yonadi va tagidagi razryad qiymati (128, 64, 32…) yig'indiga qo'shiladi.
Pastda uchala sistemadagi natija bir vaqtda ko'rinadi va hisob-kitob yozilib turadi:
`128 + 32 + 16 + 4 + 1 = 181`. Tayyor sonlarni ko'rsatuvchi tugmalar ham bor.

**Mashq** — besh rejim: 2→10, 10→2, 16→10, 10→16, 2→16. Xato qilinsa
«Qanday yechiladi?» tugmasi bosqichma-bosqich yechimni chiqaradi — ikkilikdan
o'nlikka o'tishda razryadlar yig'indisi, teskarisida esa 2 ga bo'lish jadvali.
Ketma-ket to'g'ri javoblar sanaladi va rekord saqlanadi.

### Rejadagi mashqlar

Firibgar xatni topish, Kompyuter qismlari, Excel formulalari, Klaviatura
trenajyori — ro'yxatda «Tez orada» belgisi bilan turadi.


### Xato javob uchun jarima

Ilgari reyting faqat to'plangan ball bo'yicha tuzilardi va xato javob 0 ball
berardi. Natijada tez-tez javob berib ko'p xato qilgan o'quvchi ehtiyotkorlik
bilan ishlagandan yuqorida turib qolardi.

Endi ball qoidasi shunday:

| Javob | Ball |
|---|---|
| To'g'ri | +100, tezlik uchun 50 gacha qo'shimcha |
| Xato | -25 |

Ball noldan pastga tushmaydi, bola o'yindan butunlay tushib qolmasligi uchun.

Teng ball bo'lganda tartib: avval to'g'ri javoblar soni, so'ng kam xato qilgan
yuqorida turadi.

Kartochkada endi aniqlik foizi ham ko'rinadi, o'qituvchi kim tavakkal
qilayotganini bir qarashda ko'radi.

Jamoa hisobi ham shu qoidaga o'tdi: to'g'ri javoblardan xatolar ayiriladi.
Jamoalar teng bo'lmasa taqqoslash noto'g'ri chiqadi, shuning uchun panelda
har bir jamoaning o'quvchi boshiga o'rtacha natijasi ham ko'rsatiladi.

Ishga tushirish: Supabase SQL Editor -> `supabase/migration-07-penalty.sql`.
Bu bajarilmasa, jurnaldagi ball ekrandagidan farq qiladi.

## Yangi mashqlar va musobaqa rejimi

### Uchta yangi mashq

| Mashq | Nima o'rgatadi | Savollar |
|---|---|---|
| Firibgar xatni topish | Manzil, havola, shoshiltirish belgilari; parol va SMS kod qoidalari | 10 |
| Kompyuter qurilmalari | Qurilmani tanish va vazifasini bilish | 12 |
| Excel formulalari | SUM, AVERAGE, IF, COUNTIF, xatolar, $A$1 | 12 |

Uchalasi bir xil tuzilishda: vaziyat ko'rsatiladi (xat, jadval yoki qurilma),
javob beriladi, so'ng tushuntirish chiqadi. Tushuntirish savolning o'zidan
muhimroq, chunki bola nega xato qilganini bilmasa, mashqning ma'nosi yo'q.

Firibgar xatlar mashqida haqiqiy pochta ko'rinishi chiziladi: kimdan, mavzu,
matn va havola. Excel mashqida kichik jadval chiziladi va formula natijasi
so'raladi, ya'ni bola javobni yodlamaydi, hisoblab topadi.

### Mashqlar endi musobaqa sifatida ham o'ynaladi

Eng muhim o'zgarish: mashq mavzulari savol paketiga aylantirildi.

`src/lib/practice/packs.ts` mashq savollarini o'yin savollariga o'giradi va
ular `getAllPacks()` ro'yxatiga qo'shiladi. To'rtta yangi paket paydo bo'ldi:
Firibgar xatlar, Kompyuter qurilmalari, Excel formulalari va Sanoq sistemalari
(oxirgisida savollar avtomatik yaratiladi, har safar yangi).

Bu paketlar hamma joyda ishlaydi: arqon tortishda, poygada, savol yomg'irida,
Kim millionerda, sinf musobaqasida va uy vazifasida. Yangi protokol yozilmadi,
chunki o'yin dvigateli savol paketini kutadi, biz unga mashq savollarini beramiz.

Har bir mashq sahifasida "Musobaqa ochish" tugmasi bor: bosilganda o'sha mavzu
bilan sinf musobaqasi sozlamalari ochiladi.

Istisno: Algoritm yig'ish musobaqa rejimida ishlamaydi, chunki qadamlarni
tartibga solish variantli savolga sig'maydi. Sahifada shu haqda izoh turadi.

## Musobaqada haqiqiy o'yin ko'rinishi

Ilgari musobaqa rejimida o'quvchi qurilmasida faqat variantli test chiqardi.
Endi qaysi o'yin tanlangan bo'lsa, o'quvchi ekranida o'sha o'yinning sahnasi
chiziladi.

| O'yin | O'quvchi ekranida |
|---|---|
| Savol yomg'iri | Yomg'ir tushayotgan osmon, to'g'ri/xato hisobi va o'rin |
| Poyga | O'z mashinasi marra tomon yuradi, yetakchi soya bo'lib ko'rinadi |
| Arqon tortish | Ikki jamoa orasidagi arqon jamoa ballari bo'yicha tortiladi |
| Kim millioner | 15 bosqichli narvon va joriy summa |
| Xazina xaritasi | Kataklar bo'ylab yurish, oxirida xazina |

Javob berish mantiqi o'zgarmadi: savol, variantlar, tekshirish va reyting bir
xil ishlaydi. O'zgaradigan narsa faqat ko'rinish va his, shuning uchun mexanika
ishonchli qoladi.

Sahna o'quvchining o'z natijasini va sinfdagi o'rnini ko'rsatadi, ya'ni bola
sinfdoshlaridan qanchalik oldinda yoki orqada ekanini bilib turadi.

Musobaqa rejimi endi beshta o'yinda ochiq: Savol yomg'iri, Arqon tortish,
Poyga, Kim millioner, Xazina xaritasi.

## O'quvchilar nimani ko'radi

O'qituvchi qaysi savol paketlari o'quvchilarga ko'rinishini o'zi belgilaydi.
Bu boshqa fanlar informatika darsida ko'rinib qolmasligi uchun kerak.

Manzil: `/dashboard/korinish`

Ikki rejim bor. "Hammasi ochiq" - o'quvchi barcha paketlarni ko'radi.
"Faqat tanlanganlar" - belgilangan paketlargina ko'rinadi. Paketlar fan
bo'yicha guruhlangan, butun fanni bir bosishda ochish yoki yopish mumkin.

Ro'yxat sinfga biriktiriladi, chunki turli sinflarda turli mavzular o'tiladi.

Cheklov faqat o'quvchi hisobiga tegishli. O'qituvchi va doska rejimi hamma
paketni ko'raveradi, aks holda darsga tayyorgarlik qiyin bo'lardi.

Bundan tashqari o'quvchi hisobida "Savollar bazasi" bo'limi umuman
ko'rinmaydi va sahifaga to'g'ridan-to'g'ri kirsa ham ochilmaydi, chunki u
yerda to'g'ri javoblar turadi.

Ishga tushirish: Supabase SQL Editor -> `supabase/migration-08-visibility.sql`.

## Bosqich 3: klaviatura, xatolar va XP do'koni

### Klaviatura trenajyori

Manzil: `/mashq/klaviatura`. Besh bosqich, har biri o'z matnlari bilan:
asosiy qator (2-4 sinf), oddiy so'zlar (3-5), jumlalar (5-7), informatika
atamalari (6-9), belgilar va raqamlar (8-11).

Matn ekranda turadi, to'g'ri yozilgan harflar yashil, xatolari qizil bo'ladi.
So'z/daqiqa va aniqlik jonli hisoblanadi.

Rekord faqat aniqlik 85% dan yuqori bo'lganda yoziladi, aks holda xato bosib
o'tish rekord bo'lib qolardi. Har bosqichning o'z rekordi bor.

### Mening xatolarim

Manzil: `/talaba/xatolar`. Musobaqalarda xato qilingan savollar to'planadi:
savol, to'g'ri javob va bola yozgan javob. Javob darhol ochilmaydi, avval
o'ylab ko'rish uchun tugma bosiladi.

Savolga keyinchalik to'g'ri javob berilsa, u ro'yxatdan chiqadi. Ro'yxatning
qisqarishi bolaga o'z o'sishini ko'rsatadi.

Buning uchun javob bilan birga to'g'ri javob ham saqlanadigan bo'ldi
(`answers.correct_answer`). Migratsiyadan oldingi javoblarda bu maydon bo'sh.

### XP do'koni

Manzil: `/talaba/dokon`. Avatarlar, poyga ko'rinishlari va unvonlar,
narxlari 200 dan 2500 XP gacha. Sotib olingan narsa doim qoladi, kiyish esa
bir turdan faqat bittasini faol qiladi.

Xarid bazada bajariladi (`buy_item`), ya'ni brauzerdan bepul olish mumkin emas.

Ishga tushirish: Supabase SQL Editor -> `supabase/migration-09-shop-mistakes.sql`.
