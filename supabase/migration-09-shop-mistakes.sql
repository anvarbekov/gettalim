-- ============================================================================
--  GETTALIM — migratsiya 09: «Mening xatolarim» va XP do'koni
--
--  1. Xatolar ustida ishlash uchun javob bilan birga **to'g'ri javob** ham
--     saqlanadi. Ilgari faqat o'quvchi bergan javob yozilardi, shuning uchun
--     keyinchalik "nima to'g'ri edi?" degan savolga javob yo'q edi.
--
--  2. XP shunchaki raqam bo'lib qolmasligi uchun do'kon qo'shiladi:
--     o'quvchi to'plagan ballga avatar va o'yin ko'rinishlarini oladi.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Javoblarga to'g'ri javob ustuni
-- ---------------------------------------------------------------------------

alter table public.answers add column if not exists correct_answer text;

create or replace function public.submit_answer(
  p_participant uuid,
  p_question    text,
  p_answer      text,
  p_correct     boolean,
  p_ms          integer default null,
  p_right       text default null
)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_session uuid;
  v_gained  integer;
  v_score   integer;
begin
  select p.session_id into v_session from public.participants p where p.id = p_participant;
  if v_session is null then
    raise exception 'PARTICIPANT_NOT_FOUND';
  end if;

  insert into public.answers (
    session_id, participant_id, question_text, given_answer, is_correct, ms_taken, correct_answer
  )
  values (
    v_session,
    p_participant,
    left(coalesce(p_question, ''), 500),
    left(coalesce(p_answer, ''), 200),
    p_correct,
    p_ms,
    left(coalesce(p_right, ''), 200)
  );

  -- To'g'ri javob: 100 ball + tezlik uchun 50 gacha. Xato javob: 25 jarima.
  v_gained := case
    when p_correct then 100 + greatest(0, 50 - coalesce(p_ms, 20000) / 400)
    else -25
  end;

  update public.participants p
  set score = greatest(0, p.score + v_gained)
  where p.id = p_participant
  returning p.score into v_score;

  return coalesce(v_score, 0);
end $$;

grant execute on function public.submit_answer(uuid, text, text, boolean, integer, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  2. «Mening xatolarim»
--
--  O'quvchi faqat **o'z** xatolarini ko'radi. Bir xil savol bir necha marta
--  xato bo'lsa, bitta satr qaytadi va necha marta xato qilingani yoziladi.
--  Keyinchalik to'g'ri javob berilgan savol ro'yxatdan chiqadi.
-- ---------------------------------------------------------------------------

create or replace function public.my_mistakes(p_limit integer default 40)
returns table (
  question_text  text,
  correct_answer text,
  last_answer    text,
  times_wrong    integer,
  last_at        timestamptz
)
language sql stable security definer set search_path = public as $$
  with mine as (
    select a.question_text, a.correct_answer, a.given_answer, a.is_correct, a.created_at
    from public.answers a
    join public.participants p on p.id = a.participant_id
    where p.student_id = auth.uid()
      and coalesce(a.question_text, '') <> ''
  ),
  grouped as (
    select
      m.question_text,
      max(m.correct_answer) filter (where coalesce(m.correct_answer, '') <> '') as correct_answer,
      count(*) filter (where not m.is_correct)                                  as wrong_count,
      count(*) filter (where m.is_correct)                                      as right_count,
      max(m.created_at)                                                         as last_at,
      (array_agg(m.given_answer order by m.created_at desc)
        filter (where not m.is_correct))[1]                                     as last_answer
    from mine m
    group by m.question_text
  )
  select
    g.question_text,
    g.correct_answer,
    g.last_answer,
    g.wrong_count::int,
    g.last_at
  from grouped g
  where g.wrong_count > 0 and g.right_count = 0
  order by g.wrong_count desc, g.last_at desc
  limit greatest(1, least(200, coalesce(p_limit, 40)));
$$;

grant execute on function public.my_mistakes(integer) to authenticated;

-- ---------------------------------------------------------------------------
--  3. XP do'koni
-- ---------------------------------------------------------------------------

create table if not exists public.shop_items (
  id       text primary key,
  kind     text not null,          -- avatar | racer | character | title
  title    text not null,
  emoji    text,
  price    integer not null,
  sort     integer not null default 0
);

alter table public.shop_items enable row level security;

drop policy if exists shop_items_read on public.shop_items;
create policy shop_items_read on public.shop_items for select using (true);

create table if not exists public.user_items (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  item_id    text not null references public.shop_items (id) on delete cascade,
  bought_at  timestamptz not null default now(),
  equipped   boolean not null default false,
  primary key (user_id, item_id)
);

alter table public.user_items enable row level security;

drop policy if exists user_items_own on public.user_items;
create policy user_items_own on public.user_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Do'kon mahsulotlari
insert into public.shop_items (id, kind, title, emoji, price, sort) values
  ('av-fox',      'avatar',    'Tulki',            '🦊', 200,  1),
  ('av-owl',      'avatar',    'Boyqush',          '🦉', 200,  2),
  ('av-cat',      'avatar',    'Mushuk',           '🐱', 200,  3),
  ('av-dragon',   'avatar',    'Ajdaho',           '🐲', 800,  4),
  ('av-astro',    'avatar',    'Kosmonavt',        '🧑‍🚀', 1200, 5),
  ('av-robot',    'avatar',    'Robot',            '🤖', 1500, 6),
  ('rc-car',      'racer',     'Sport mashina',    '🏎️', 500,  10),
  ('rc-rocket',   'racer',     'Raketa',           '🚀', 1000, 11),
  ('rc-ufo',      'racer',     'Uchar likopcha',   '🛸', 2000, 12),
  ('ti-zukko',    'title',     'Zukko',            '💡', 300,  20),
  ('ti-usta',     'title',     'Ustoz',            '🎓', 1000, 21),
  ('ti-chempion', 'title',     'Chempion',         '🏆', 2500, 22)
on conflict (id) do nothing;

/** Mahsulot sotib olish. XP kamayadi, mahsulot ro'yxatga qo'shiladi. */
create or replace function public.buy_item(p_item text)
returns table (ok boolean, message text, xp integer)
language plpgsql security definer set search_path = public as $$
declare
  v_price integer;
  v_xp    integer;
begin
  select s.price into v_price from public.shop_items s where s.id = p_item;
  if v_price is null then
    return query select false, 'Mahsulot topilmadi', 0;
    return;
  end if;

  if exists (select 1 from public.user_items u where u.user_id = auth.uid() and u.item_id = p_item) then
    return query select false, 'Bu allaqachon sizda bor', 0;
    return;
  end if;

  select pr.xp into v_xp from public.profiles pr where pr.id = auth.uid();
  if coalesce(v_xp, 0) < v_price then
    return query select false, 'XP yetarli emas', coalesce(v_xp, 0);
    return;
  end if;

  update public.profiles pr set xp = pr.xp - v_price where pr.id = auth.uid()
  returning pr.xp into v_xp;

  insert into public.user_items (user_id, item_id) values (auth.uid(), p_item)
  on conflict do nothing;

  return query select true, 'Sotib olindi', v_xp;
end $$;

grant execute on function public.buy_item(text) to authenticated;

/** Mahsulotni kiyish. Bir turdan faqat bittasi faol bo'ladi. */
create or replace function public.equip_item(p_item text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_kind text;
begin
  select s.kind into v_kind from public.shop_items s where s.id = p_item;
  if v_kind is null then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  if not exists (select 1 from public.user_items u where u.user_id = auth.uid() and u.item_id = p_item) then
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

/** Do'kon ro'yxati: narx, sotib olinganmi, kiyilganmi. */
create or replace function public.my_shop()
returns table (
  id       text,
  kind     text,
  title    text,
  emoji    text,
  price    integer,
  owned    boolean,
  equipped boolean
)
language sql stable security definer set search_path = public as $$
  select
    s.id, s.kind, s.title, s.emoji, s.price,
    (u.item_id is not null)        as owned,
    coalesce(u.equipped, false)    as equipped
  from public.shop_items s
  left join public.user_items u on u.item_id = s.id and u.user_id = auth.uid()
  order by s.kind, s.sort;
$$;

grant execute on function public.my_shop() to authenticated;
