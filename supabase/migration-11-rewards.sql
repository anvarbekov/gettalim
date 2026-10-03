-- ============================================================================
--  GETTALIM — migratsiya 11: haqiqiy sovg'alar (sinf imtiyozlari)
--
--  Muammo: XP ga faqat raqamli bezak sotib olinardi. Bola uchun ekrandagi
--  ramka qiziq, lekin **haqiqiy** sovg'a — masalan partani tanlash huquqi yoki
--  darsda musiqa qo'yish — ancha kuchliroq turtki beradi.
--
--  Yechim: «imtiyoz kuponlari». Bola XP ga kupon sotib oladi, kupon
--  o'qituvchi panelida «kutilmoqda» bo'lib turadi. O'qituvchi tasdiqlaydi
--  (bola imtiyozdan foydalanadi) yoki rad etadi — rad etilsa XP qaytariladi.
--
--  Shu tariqa oxirgi qaror doim o'qituvchida qoladi: sinfga to'g'ri kelmagan
--  imtiyoz berilmaydi, bola esa puli behuda ketmasligini biladi.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
--  Migratsiya 10 dan keyin ishlatiladi.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Kuponlar jadvali
-- ---------------------------------------------------------------------------

create table if not exists public.reward_claims (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles (id) on delete cascade,
  item_id     text not null references public.shop_items (id) on delete cascade,
  -- pending: o'qituvchi hali ko'rmagan | approved: berildi | refunded: XP qaytarildi
  status      text not null default 'pending',
  note        text,
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references public.profiles (id) on delete set null
);

create index if not exists reward_claims_student on public.reward_claims (student_id, created_at desc);
create index if not exists reward_claims_status  on public.reward_claims (status, created_at);

alter table public.reward_claims enable row level security;

-- O'quvchi faqat o'z kuponlarini ko'radi
drop policy if exists reward_claims_own on public.reward_claims;
create policy reward_claims_own on public.reward_claims
  for select using (student_id = auth.uid());

-- O'qituvchi o'z sinflaridagi o'quvchilarning kuponlarini ko'radi
drop policy if exists reward_claims_teacher on public.reward_claims;
create policy reward_claims_teacher on public.reward_claims
  for select using (
    exists (
      select 1
      from public.class_students cs
      join public.classes c on c.id = cs.class_id
      where cs.student_id = public.reward_claims.student_id
        and c.teacher_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
--  2. Sovg'alar
--
--  Narxlar ataylab bezaklardan qimmatroq: haqiqiy imtiyoz ko'proq mehnatga
--  arzishi kerak. Lekin baribir bir-ikki haftalik ishga yetadi.
-- ---------------------------------------------------------------------------

insert into public.shop_items (id, kind, title, emoji, description, value, price, min_level, consumable, sort) values
  ('rw-music',   'reward', 'Darsda musiqa',        '🎵', 'Dars oxiridagi ishga musiqani siz tanlaysiz',        'music',  180, 2, true, 80),
  ('rw-desk',    'reward', 'Partani tanlash',      '🪑', 'Bir hafta xohlagan partangizda o''tirasiz',          'desk',   240, 2, true, 81),
  ('rw-partner', 'reward', 'Jamoadoshni tanlash',  '🤝', 'Keyingi guruh ishida juftingizni o''zingiz tanlaysiz','partner',260, 3, true, 82),
  ('rw-free5',   'reward', '5 daqiqa erkin ish',   '⏱️', 'Dars oxirida 5 daqiqa o''zingiz xohlagan mashq',     'free5',  300, 3, true, 83),
  ('rw-wall',    'reward', 'Ishing sinf devorida', '🖼️', 'Bajargan ishingiz sinf devoriga osiladi',            'wall',   340, 4, true, 84),
  ('rw-helper',  'reward', 'Ustoz yordamchisi',    '🧑‍🏫', 'Bir dars davomida o''qituvchiga yordamchi bo''lasiz','helper', 420, 5, true, 85),
  ('rw-skip',    'reward', 'Bitta savolni o''tkazish','⏭️','Nazorat ishida bitta savolni o''tkazib yuborasiz',  'skip',   520, 6, true, 86),
  ('rw-hw',      'reward', 'Uy vazifasidan ozod',  '🎟️', 'Bir marotaba uy vazifasi bajarilmagan deb hisoblanmaydi','hw', 650, 7, true, 87)
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
--  3. Sotib olish — sovg'a bo'lsa kupon ochiladi
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

  select coalesce(pr.xp, 0), greatest(coalesce(pr.level, 1), public.level_of(coalesce(pr.xp, 0)))
  into v_xp, v_level
  from public.profiles pr where pr.id = auth.uid();

  v_xp := coalesce(v_xp, 0);

  if coalesce(v_level, 1) < v_item.min_level then
    return query select false, format('%s-darajadan keyin ochiladi', v_item.min_level), v_xp;
    return;
  end if;

  -- Bir vaqtda faqat bitta tasdiqlanmagan kupon bo'lsin: navbat yig'ilib
  -- ketmasin va bola XP ni bir joyga to'kib yubormasin.
  if v_item.kind = 'reward'
     and exists (select 1 from public.reward_claims rc
                 where rc.student_id = auth.uid() and rc.status = 'pending') then
    return query select false, 'Avvalgi kuponingiz hali tasdiqlanmagan', v_xp;
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

  if v_item.kind = 'reward' then
    insert into public.reward_claims (student_id, item_id) values (auth.uid(), p_item);
    return query select true, 'Kupon o''qituvchiga yuborildi', v_xp;
    return;
  end if;

  insert into public.user_items (user_id, item_id, qty) values (auth.uid(), p_item, 1)
  on conflict (user_id, item_id) do update set qty = user_items.qty + 1;

  return query select true,
    case when v_item.consumable then 'Qo''shildi' else 'Sotib olindi' end,
    v_xp;
end $$;

grant execute on function public.buy_item(text) to authenticated;

-- ---------------------------------------------------------------------------
--  4. O'quvchi: mening kuponlarim
-- ---------------------------------------------------------------------------

create or replace function public.my_claims()
returns table (
  id         uuid,
  item_id    text,
  title      text,
  emoji      text,
  status     text,
  created_at timestamptz,
  decided_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select rc.id, rc.item_id, s.title, s.emoji, rc.status, rc.created_at, rc.decided_at
  from public.reward_claims rc
  join public.shop_items s on s.id = rc.item_id
  where rc.student_id = auth.uid()
  order by rc.created_at desc
  limit 50;
$$;

grant execute on function public.my_claims() to authenticated;

-- ---------------------------------------------------------------------------
--  5. O'qituvchi: kuponlar navbati
-- ---------------------------------------------------------------------------

create or replace function public.teacher_claims(p_status text default 'pending')
returns table (
  id         uuid,
  student_id uuid,
  full_name  text,
  class_name text,
  item_id    text,
  title      text,
  emoji      text,
  price      integer,
  status     text,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  -- `distinct on` kerak: o'quvchi bitta o'qituvchining bir nechta sinfida
  -- bo'lsa, join kuponni bir necha marta qaytarardi va navbatda takror
  -- ko'rinardi.
  select * from (
    select distinct on (rc.id)
      rc.id, rc.student_id, pr.full_name, c.name as class_name,
      rc.item_id, s.title, s.emoji, s.price, rc.status, rc.created_at
    from public.reward_claims rc
    join public.profiles pr       on pr.id = rc.student_id
    join public.shop_items s      on s.id = rc.item_id
    join public.class_students cs on cs.student_id = rc.student_id
    join public.classes c         on c.id = cs.class_id
    where c.teacher_id = auth.uid()
      and (p_status is null or rc.status = p_status)
    order by rc.id, c.name
  ) q
  order by q.created_at;
$$;

grant execute on function public.teacher_claims(text) to authenticated;

-- ---------------------------------------------------------------------------
--  6. O'qituvchi qarori
--
--  `approved` — imtiyoz berildi. `refunded` — berilmadi, XP qaytariladi.
-- ---------------------------------------------------------------------------

create or replace function public.decide_claim(p_claim uuid, p_status text, p_note text default null)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_claim  public.reward_claims;
  v_price  integer;
  v_allowed boolean;
begin
  if p_status not in ('approved', 'refunded') then
    raise exception 'BAD_STATUS';
  end if;

  select rc.* into v_claim from public.reward_claims rc where rc.id = p_claim;
  if v_claim.id is null or v_claim.status <> 'pending' then
    return false;
  end if;

  -- Faqat shu o'quvchining o'qituvchisi qaror qila oladi
  select exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    where cs.student_id = v_claim.student_id and c.teacher_id = auth.uid()
  ) into v_allowed;

  if not v_allowed then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.reward_claims rc
  set status = p_status, note = p_note, decided_at = now(), decided_by = auth.uid()
  where rc.id = p_claim;

  if p_status = 'refunded' then
    select s.price into v_price from public.shop_items s where s.id = v_claim.item_id;
    update public.profiles pr set xp = pr.xp + coalesce(v_price, 0) where pr.id = v_claim.student_id;
  end if;

  return true;
end $$;

grant execute on function public.decide_claim(uuid, text, text) to authenticated;
