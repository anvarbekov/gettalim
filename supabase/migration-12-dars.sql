-- ============================================================================
--  GETTALIM — migratsiya 12: Dars (jonli dars xonasi)
--
--  Dars — bu o'qituvchi ochadigan xona. O'quvchi 6 xonali PIN bilan kiradi,
--  o'qituvchining ekranini ko'radi va ovozini eshitadi.
--
--  Bu jadval **media**ni saqlamaydi — ovoz va ekran LiveKit serveri orqali
--  to'g'ridan-to'g'ri uzatiladi. Bu yerda faqat «qaysi PIN qaysi o'qituvchiga
--  tegishli va dars hali davom etyaptimi» degan ma'lumot turadi. Token
--  beruvchi API aynan shuni tekshiradi.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles (id) on delete cascade,
  class_id    uuid references public.classes (id) on delete set null,
  pin         text not null unique,
  title       text not null default 'Dars',
  -- live: davom etyapti | ended: tugagan
  status      text not null default 'live',
  -- Mehmonlar (ro'yxatdan o'tmaganlar) kira oladimi
  allow_guests boolean not null default true,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);

create index if not exists lessons_teacher on public.lessons (teacher_id, started_at desc);
create index if not exists lessons_live    on public.lessons (status) where status = 'live';

alter table public.lessons enable row level security;

-- Dars ma'lumotini hamma o'qiy oladi: PIN bilan kirish shunga asoslanadi.
-- Bu yerda maxfiy narsa yo'q — faqat sarlavha va holat.
drop policy if exists lessons_read on public.lessons;
create policy lessons_read on public.lessons for select using (true);

drop policy if exists lessons_own on public.lessons;
create policy lessons_own on public.lessons
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
--  Dars ochish
--
--  PIN takrorlanmasligi kerak. Tasodifiy son tanlanadi va band bo'lsa qayta
--  uriniladi — o'yin sessiyalaridagi bilan bir xil yondashuv.
-- ---------------------------------------------------------------------------

create or replace function public.open_lesson(
  p_title text default 'Dars',
  p_class uuid default null,
  p_guests boolean default true
)
returns table (id uuid, pin text)
language plpgsql security definer set search_path = public as $$
declare
  v_pin text;
  v_id  uuid;
  i     integer := 0;
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  -- Ochiq turgan eski darslarni yopamiz: bitta o'qituvchida bir vaqtda
  -- bitta dars bo'lsin, aks holda o'quvchi qaysi PIN ekanini chalkashtiradi.
  update public.lessons l
  set status = 'ended', ended_at = now()
  where l.teacher_id = auth.uid() and l.status = 'live';

  loop
    i := i + 1;
    v_pin := lpad((100000 + floor(random() * 900000))::int::text, 6, '0');
    exit when not exists (select 1 from public.lessons l where l.pin = v_pin and l.status = 'live');
    if i > 30 then
      raise exception 'PIN_NOT_FOUND';
    end if;
  end loop;

  insert into public.lessons (teacher_id, class_id, pin, title, allow_guests)
  values (auth.uid(), p_class, v_pin, coalesce(nullif(trim(p_title), ''), 'Dars'), p_guests)
  returning lessons.id into v_id;

  return query select v_id, v_pin;
end $$;

grant execute on function public.open_lesson(text, uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
--  Darsni yopish
-- ---------------------------------------------------------------------------

create or replace function public.close_lesson(p_lesson uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.lessons l
  set status = 'ended', ended_at = now()
  where l.id = p_lesson and l.teacher_id = auth.uid() and l.status = 'live';
  return found;
end $$;

grant execute on function public.close_lesson(uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  O'qituvchining joriy darsi
--
--  Sahifa yangilansa yoki boshqa qurilmadan kirilsa, o'qituvchi o'z darsini
--  qaytadan topa olishi kerak.
-- ---------------------------------------------------------------------------

create or replace function public.my_live_lesson()
returns table (id uuid, pin text, title text, class_id uuid, started_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.id, l.pin, l.title, l.class_id, l.started_at
  from public.lessons l
  where l.teacher_id = auth.uid() and l.status = 'live'
  order by l.started_at desc
  limit 1;
$$;

grant execute on function public.my_live_lesson() to authenticated;

-- ---------------------------------------------------------------------------
--  O'quvchi uchun: sinfimda dars ketyaptimi?
--
--  Bola PIN so'rab yurmasin — kabinetiga kirsa, dars boshlanganini o'zi ko'radi.
-- ---------------------------------------------------------------------------

create or replace function public.lesson_for_me()
returns table (pin text, title text, teacher text, started_at timestamptz)
language sql stable security definer set search_path = public as $$
  select l.pin, l.title, pr.full_name, l.started_at
  from public.lessons l
  join public.profiles pr on pr.id = l.teacher_id
  where l.status = 'live'
    and (
      l.class_id is null
      or exists (
        select 1 from public.class_students cs
        where cs.class_id = l.class_id and cs.student_id = auth.uid()
      )
    )
  order by l.started_at desc
  limit 1;
$$;

grant execute on function public.lesson_for_me() to authenticated;
