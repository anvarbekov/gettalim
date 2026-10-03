-- ============================================================================
--  GETTALIM — migratsiya 10: XP do'koni v2
--
--  Nima o'zgardi:
--
--  1. NARXLAR ARZONLASHDI. Eski narxlar (200–2500 XP) bitta darsda to'planadigan
--     XP (taxminan 60–120) bilan solishtirganda juda baland edi: bola oyiga bir
--     marta xarid qila olardi. Endi eng arzon narsa 40 XP — ya'ni birinchi
--     darsdayoq nimadir olish mumkin, eng qimmati esa 900 XP.
--
--  2. YANGI TURLAR. Ilgari faqat avatar, poyga ko'rinishi va unvon bor edi va
--     ularning hech biri o'yinda ko'rinmasdi. Endi:
--       • frame  — avatar atrofidagi ramka (kabinet va reytingda ko'rinadi)
--       • effect — to'g'ri javob bergandagi effekt
--       • theme  — kabinet mavzusi (fon ranglari)
--       • boost  — KUCHAYTIRGICH: o'yin paytida ishlatiladigan sarflanuvchi
--                  narsa (50/50, qalqon, ikki barobar ball, ikkinchi imkon).
--                  Kuchaytirgich HOST kompyuterida hisoblanadi — brauzerdagi
--                  raqamni o'zgartirib qo'shimcha olib bo'lmaydi.
--
--  3. SARFLANUVCHI MAHSULOT. `consumable` ustuni: kuchaytirgichni bir necha
--     marta sotib olish mumkin, soni `user_items.qty` da yuriydi.
--
--  4. DARAJA TALABI. `min_level` — eng kuchli narsalar XP bilangina emas,
--     o'sish bilan ham ochiladi. Bu XP ni "yig'ib qo'yish" o'rniga o'ynashga
--     undaydi.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
--  Migratsiya 09 dan keyin ishlatiladi.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Jadvallarni kengaytirish
-- ---------------------------------------------------------------------------

alter table public.shop_items add column if not exists description text;
alter table public.shop_items add column if not exists value       text;
alter table public.shop_items add column if not exists consumable  boolean not null default false;
alter table public.shop_items add column if not exists min_level   integer not null default 1;

alter table public.user_items add column if not exists qty integer not null default 1;

-- ---------------------------------------------------------------------------
--  2. Mahsulotlar
--
--  `on conflict do update` — eski narsalarning narxi ham arzonlashadi, ya'ni
--  migratsiyani ikkinchi marta ishga tushirish ham xavfsiz.
-- ---------------------------------------------------------------------------

insert into public.shop_items (id, kind, title, emoji, description, value, price, min_level, consumable, sort) values
  -- ---- Avatarlar: 60 dan boshlanadi, birinchi darsdan keyin ham olsa bo'ladi
  ('av-fox',     'avatar', 'Tulki',        '🦊', 'Ayyor va tez',                     null,  60, 1, false,  1),
  ('av-owl',     'avatar', 'Boyqush',      '🦉', 'Donolik ramzi',                    null,  60, 1, false,  2),
  ('av-cat',     'avatar', 'Mushuk',       '🐱', 'Sokin, lekin sezgir',              null,  60, 1, false,  3),
  ('av-panda',   'avatar', 'Panda',        '🐼', 'Xotirjam o''ylaydi',               null,  80, 1, false,  4),
  ('av-tiger',   'avatar', 'Yo''lbars',    '🐯', 'Hujumkor o''yin uchun',            null, 120, 2, false,  5),
  ('av-wolf',    'avatar', 'Bo''ri',       '🐺', 'Jamoada kuchli',                   null, 120, 2, false,  6),
  ('av-dragon',  'avatar', 'Ajdaho',       '🐲', 'Afsonaviy',                        null, 220, 3, false,  7),
  ('av-ninja',   'avatar', 'Ninja',        '🥷', 'Tez javob beradiganlar uchun',     null, 260, 3, false,  8),
  ('av-robot',   'avatar', 'Robot',        '🤖', 'Xatosiz hisoblaydi',               null, 320, 4, false,  9),
  ('av-astro',   'avatar', 'Kosmonavt',    '🧑‍🚀', 'Yuqoriga intiladi',              null, 380, 4, false, 10),
  ('av-wizard',  'avatar', 'Sehrgar',      '🧙', 'Bilim — sehr',                     null, 450, 5, false, 11),
  ('av-alien',   'avatar', 'Kelgindi',     '👽', 'Boshqacha fikrlaydi',              null, 500, 6, false, 12),

  -- ---- Ramkalar: avatar atrofida ko'rinadi
  ('fr-mint',    'frame',  'Yashil ramka', '🟢', 'Yumshoq yashil halqa',             'mint',    100, 1, false, 20),
  ('fr-ocean',   'frame',  'Okean',        '🔵', 'Ko''k to''lqin',                   'ocean',   100, 1, false, 21),
  ('fr-gold',    'frame',  'Oltin',        '🟡', 'G''oliblar ramkasi',               'gold',    280, 3, false, 22),
  ('fr-fire',    'frame',  'Alanga',       '🔥', 'Harakatlanuvchi olov',             'fire',    380, 4, false, 23),
  ('fr-neon',    'frame',  'Neon',         '💜', 'Qorong''ida yonadi',               'neon',    420, 5, false, 24),
  ('fr-rainbow', 'frame',  'Kamalak',      '🌈', 'Aylanuvchi kamalak',               'rainbow', 600, 6, false, 25),

  -- ---- To'g'ri javob effektlari
  ('ef-confetti','effect', 'Konfetti',     '🎊', 'To''g''ri javobda konfetti yog''adi', 'confetti',  150, 1, false, 30),
  ('ef-stars',   'effect', 'Yulduzlar',    '✨', 'Yulduzlar sochiladi',                'stars',     150, 1, false, 31),
  ('ef-fire',    'effect', 'Uchqun',       '🔥', 'Olov uchqunlari',                    'fire',      280, 3, false, 32),
  ('ef-bolt',    'effect', 'Chaqmoq',      '⚡', 'Ekran bo''ylab chaqmoq',             'bolt',      380, 4, false, 33),
  ('ef-galaxy',  'effect', 'Galaktika',    '🌌', 'Kosmik portlash',                    'galaxy',    520, 5, false, 34),

  -- ---- Kabinet mavzulari
  ('th-sunset',  'theme',  'Shom',         '🌇', 'Issiq to''q sariq fon',            'sunset', 200, 2, false, 40),
  ('th-ocean',   'theme',  'Dengiz',       '🌊', 'Salqin ko''k fon',                 'ocean',  200, 2, false, 41),
  ('th-forest',  'theme',  'O''rmon',      '🌲', 'Yashil, ko''zni charchatmaydi',    'forest', 200, 2, false, 42),
  ('th-space',   'theme',  'Kosmos',       '🪐', 'Yulduzli qorong''i fon',           'space',  420, 4, false, 43),
  ('th-candy',   'theme',  'Shirinlik',    '🍬', 'Pushti-binafsha',                  'candy',  420, 4, false, 44),

  -- ---- Poyga ko'rinishlari (poyga o'yinida ishlatiladi)
  ('rc-car',     'racer',  'Sport mashina','🏎️', 'Poygada tezroq ko''rinadi',       'car',    160, 1, false, 50),
  ('rc-bike',    'racer',  'Mototsikl',    '🏍️', 'Yengil va chaqqon',               'bike',   160, 1, false, 51),
  ('rc-rocket',  'racer',  'Raketa',       '🚀', 'Yuqoriga uchadi',                 'rocket', 320, 3, false, 52),
  ('rc-plane',   'racer',  'Samolyot',     '✈️', 'Baland parvoz',                   'plane',  380, 4, false, 53),
  ('rc-ufo',     'racer',  'Uchar likopcha','🛸','Sirli va tez',                     'ufo',    550, 5, false, 54),
  ('rc-dragon',  'racer',  'Ajdaho',       '🐉', 'Eng kuchli ko''rinish',           'dragon', 750, 7, false, 55),

  -- ---- Unvonlar (ism ostida chiqadi)
  ('ti-yangi',   'title',  'Izlanuvchi',   '🔎', 'Yangi boshlaganlar uchun',         null,  80, 1, false, 60),
  ('ti-zukko',   'title',  'Zukko',        '💡', 'Tez fahmlaydi',                    null, 140, 2, false, 61),
  ('ti-tezkor',  'title',  'Tezkor',       '⚡', 'Vaqtni yutadi',                    null, 220, 3, false, 62),
  ('ti-aniq',    'title',  'Aniq',         '🎯', 'Kam xato qiladi',                  null, 300, 4, false, 63),
  ('ti-usta',    'title',  'Ustoz',        '🎓', 'Boshqalarga o''rgatadi',           null, 420, 5, false, 64),
  ('ti-algo',    'title',  'Algoritmchi',  '🧩', 'Algoritm yig''ish ustasi',         null, 500, 6, false, 65),
  ('ti-chempion','title',  'Chempion',     '🏆', 'Sinf birinchisi',                  null, 700, 8, false, 66),
  ('ti-afsona',  'title',  'Afsona',       '👑', 'Eng yuqori unvon',                 null, 900, 10, false, 67),

  -- ---- Kuchaytirgichlar: sarflanuvchi, o'yin paytida ishlatiladi
  ('bo-fifty',   'boost',  '50/50',        '✂️', 'Ikkita noto''g''ri variantni o''chiradi', 'fifty',  40, 1, true, 70),
  ('bo-shield',  'boost',  'Qalqon',       '🛡️', 'Bitta xato javob jarimasiz o''tadi',      'shield', 60, 1, true, 71),
  ('bo-double',  'boost',  'Ikki barobar', '✖️', 'Keyingi to''g''ri javob ikki barobar ball','double', 80, 2, true, 72),
  ('bo-retry',   'boost',  'Ikkinchi imkon','🔁','Xato javob hisobga olinmaydi, qayta tanlaysiz','retry', 90, 3, true, 73)
on conflict (id) do update set
  kind        = excluded.kind,
  title       = excluded.title,
  emoji       = excluded.emoji,
  description = excluded.description,
  value       = excluded.value,
  price       = excluded.price,
  min_level   = excluded.min_level,
  consumable  = excluded.consumable,
  sort        = excluded.sort;

-- ---------------------------------------------------------------------------
--  3. Sotib olish — sarflanuvchi mahsulot va daraja talabi bilan
-- ---------------------------------------------------------------------------

create or replace function public.buy_item(p_item text)
returns table (ok boolean, message text, xp integer)
language plpgsql security definer set search_path = public as $$
declare
  v_item   public.shop_items;
  v_xp     integer;
  v_level  integer;
begin
  select s.* into v_item from public.shop_items s where s.id = p_item;
  if v_item.id is null then
    return query select false, 'Mahsulot topilmadi', 0;
    return;
  end if;

  -- Daraja profilda saqlanadi va xarid qilinganda pasaymaydi — shuning uchun
  -- joriy XP dan emas, aynan profildagi darajadan foydalanamiz.
  select coalesce(pr.xp, 0), greatest(coalesce(pr.level, 1), public.level_of(coalesce(pr.xp, 0)))
  into v_xp, v_level
  from public.profiles pr where pr.id = auth.uid();

  v_xp := coalesce(v_xp, 0);

  if coalesce(v_level, 1) < v_item.min_level then
    return query select false, format('%s-darajadan keyin ochiladi', v_item.min_level), v_xp;
    return;
  end if;

  if not v_item.consumable
     and exists (select 1 from public.user_items u
                 where u.user_id = auth.uid() and u.item_id = p_item) then
    return query select false, 'Bu allaqachon sizda bor', v_xp;
    return;
  end if;

  if v_xp < v_item.price then
    return query select false, format('%s XP yetishmayapti', v_item.price - v_xp), v_xp;
    return;
  end if;

  update public.profiles pr set xp = pr.xp - v_item.price where pr.id = auth.uid()
  returning pr.xp into v_xp;

  insert into public.user_items (user_id, item_id, qty) values (auth.uid(), p_item, 1)
  on conflict (user_id, item_id) do update set qty = user_items.qty + 1;

  return query select true,
    case when v_item.consumable then 'Qo''shildi' else 'Sotib olindi' end,
    v_xp;
end $$;

grant execute on function public.buy_item(text) to authenticated;

-- ---------------------------------------------------------------------------
--  4. Kuchaytirgichni ishlatish
--
--  O'yin paytida chaqiriladi. Soni kamayadi, tugasa ro'yxatdan chiqadi.
--  Qaytadigan qiymat — qolgan soni (yoki -1: mahsulot yo'q).
-- ---------------------------------------------------------------------------

create or replace function public.use_boost(p_item text)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_qty integer;
begin
  if not exists (select 1 from public.shop_items s where s.id = p_item and s.consumable) then
    return -1;
  end if;

  update public.user_items u
  set qty = u.qty - 1
  where u.user_id = auth.uid() and u.item_id = p_item and u.qty > 0
  returning u.qty into v_qty;

  if v_qty is null then
    return -1;
  end if;

  delete from public.user_items u
  where u.user_id = auth.uid() and u.item_id = p_item and u.qty <= 0;

  return v_qty;
end $$;

grant execute on function public.use_boost(text) to authenticated;

-- ---------------------------------------------------------------------------
--  5. Kiyish — kuchaytirgich kiyilmaydi
-- ---------------------------------------------------------------------------

create or replace function public.equip_item(p_item text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_kind text;
begin
  select s.kind into v_kind from public.shop_items s
  where s.id = p_item and not s.consumable;
  if v_kind is null then
    raise exception 'ITEM_NOT_EQUIPPABLE';
  end if;

  if not exists (select 1 from public.user_items u
                 where u.user_id = auth.uid() and u.item_id = p_item) then
    raise exception 'NOT_OWNED';
  end if;

  update public.user_items u
  set equipped = false
  where u.user_id = auth.uid()
    and u.item_id in (select s.id from public.shop_items s where s.kind = v_kind);

  update public.user_items u set equipped = true
  where u.user_id = auth.uid() and u.item_id = p_item;
end $$;

grant execute on function public.equip_item(text) to authenticated;

-- ---------------------------------------------------------------------------
--  6. Do'kon ro'yxati
-- ---------------------------------------------------------------------------

drop function if exists public.my_shop();

create or replace function public.my_shop()
returns table (
  id          text,
  kind        text,
  title       text,
  emoji       text,
  description text,
  value       text,
  price       integer,
  min_level   integer,
  consumable  boolean,
  owned       boolean,
  qty         integer,
  equipped    boolean
)
language sql stable security definer set search_path = public as $$
  select
    s.id, s.kind, s.title, s.emoji, s.description, s.value,
    s.price, s.min_level, s.consumable,
    (u.item_id is not null)     as owned,
    coalesce(u.qty, 0)          as qty,
    coalesce(u.equipped, false) as equipped
  from public.shop_items s
  left join public.user_items u on u.item_id = s.id and u.user_id = auth.uid()
  order by s.sort, s.price;
$$;

grant execute on function public.my_shop() to authenticated;

-- ---------------------------------------------------------------------------
--  7. Kiyilgan narsalar — ilova ularni ko'rsatishi uchun
--
--  Bitta qatorda barcha kiyilganlar: avatar, ramka, unvon, effekt, mavzu.
-- ---------------------------------------------------------------------------

create or replace function public.my_loadout()
returns table (
  kind  text,
  id    text,
  title text,
  emoji text,
  value text
)
language sql stable security definer set search_path = public as $$
  select s.kind, s.id, s.title, s.emoji, s.value
  from public.user_items u
  join public.shop_items s on s.id = u.item_id
  where u.user_id = auth.uid() and u.equipped and not s.consumable;
$$;

grant execute on function public.my_loadout() to authenticated;

-- ---------------------------------------------------------------------------
--  8. Qo'lda ishlatiladigan kuchaytirgichlar ro'yxati
-- ---------------------------------------------------------------------------

create or replace function public.my_boosts()
returns table (
  id    text,
  title text,
  emoji text,
  value text,
  qty   integer
)
language sql stable security definer set search_path = public as $$
  select s.id, s.title, s.emoji, s.value, u.qty
  from public.user_items u
  join public.shop_items s on s.id = u.item_id
  where u.user_id = auth.uid() and s.consumable and u.qty > 0
  order by s.sort;
$$;

grant execute on function public.my_boosts() to authenticated;
