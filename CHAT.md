# Chat — o'rnatish va ishlatish

## 1. Supabase migratsiyasi (bir marta)

Supabase → **SQL Editor** → **New query** → `supabase/migration-14-chat-boshqaruv.sql`
faylining butun matnini qo'ying → **Run**.

Oldin 12- va 13-migratsiyalar bajarilgan bo'lishi kerak (ular allaqachon
bajarilgan). Faylni qayta ishga tushirish xavfsiz.

Migratsiyasiz ham chat ishlayveradi, lekin yopish, o'chirish va stikerlar
ishlamaydi.

---

## 2. O'qituvchi nima qila oladi

### Chatni yopish / ochish

| Qayerda | Nima bo'ladi |
|---|---|
| Chap tomondagi **«O'quvchilar chati: ochiq/yopiq»** kaliti | Barcha o'quvchilaringiz uchun butun chat — sinf kanallari ham, shaxsiy yozishmalar ham |
| Suhbat tepasidagi **Yopish / Ochish** | Faqat shu suhbat |

Yopiq chatda o'quvchi xabarlarni **o'qiydi**, lekin yoza olmaydi — yozish
maydoni o'rnida «O'qituvchi chatni yopgan» yozuvi chiqadi. Siz esa yopiq
chatga ham yoza olasiz (masalan, e'lon uchun).

O'zgarish o'quvchilarga 15 soniya ichida yetadi.

### Xabarlarni o'chirish

| Qanday | Qayerda |
|---|---|
| Bitta xabar | Xabar ustiga sichqonchani olib boring (telefonda — bosing) → qizil 🗑 |
| Tanlanganlar | Suhbat tepasida **Tanlash** → xabarlarni bosib belgilang → **O'chirish** |
| Hammasi | Suhbat tepasida **Hammasini o'chirish** → tasdiqlang |

O'chirilgan xabar hamma ekrandan darhol yo'qoladi. Qaytarib bo'lmaydi.

O'quvchi faqat o'z xabarini o'chira oladi.

### O'quvchilar yozishmalari

Chap tomonda pastda **«O'quvchilar yozishmalari»** bo'limi bor — sizning
o'quvchilaringiz bir-biriga yozgan shaxsiy xabarlar. Ularni o'qiysiz va
kerak bo'lsa o'chirasiz. Maktab muhitida bu xavfsizlik uchun kerak.

---

## 3. Stikerlar (hamma uchun)

- **Xabarga stiker bosish.** Xabar yonidagi 😊 tugmasi → 12 ta belgidan birini
  tanlang. Ikkinchi marta bosilsa — olib tashlanadi. Kim bosgani soni bilan
  ko'rinadi.
- **Katta stiker yuborish.** Yozish maydonidagi 🙂 tugmasi → 20 ta stiker:
  «Barakalla!», «A'lo!», «Jimlik», «Diqqat!», «Uy vazifasi», «Vaqt tugadi»…

Yopiq chatda o'quvchi stiker ham bosa olmaydi.

---

## 4. Yangi suhbat

Chap tepada **Yangi** tugmasi:

- o'quvchi — sinfdoshlari va o'qituvchisini ko'radi;
- o'qituvchi — o'z sinflaridagi o'quvchilarni ko'radi.

Sinf kanallari: **Sinf kanallari** tugmasi har bir sinfingiz uchun bitta
umumiy kanal ochadi.

Ochiq kanal: **Ochiq kanal** tugmasi havola beradi — ro'yxatdan o'tmagan
odam ham ism yozib kiradi. Bu kanalni ham yopish va tozalash mumkin.

---

## 5. Fayllar (Cloudinary)

Rasm, video, hujjat va ovozli xabar yuborish uchun `.env.local` da uchta
qiymat bo'lishi kerak:

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

[cloudinary.com](https://cloudinary.com) → bepul hisob → Dashboard. Bepul
tarif — oyiga 25 GB. Vercel'da ham shu uchta qiymatni
**Settings → Environment Variables** ga qo'shing.
