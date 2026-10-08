-- ============================================================================
--  GETTALIM — migratsiya 06: kirish ma'lumotlarini vaqtincha ochish
--
--  Muammo: o'quvchi sinf kodi yoki PIN kodini unutgan bo'lsa, tizimga
--  kira olmaydi — ya'ni ma'lumotini ko'rish uchun avval kirishi kerak.
--
--  Yechim: o'qituvchi bir bosishda sinf ro'yxatini **vaqtincha** ochadi.
--  Shu oraliqda kim sinf kodini bilsa, ro'yxatdan o'z ismini topib PIN
--  kodini ko'radi. Vaqt tugagach ro'yxat o'zi yopiladi.
--
--  Nega vaqt bilan cheklangan: aks holda o'quvchilarning ism-familiyasi va
--  kirish kodlari doimo ochiq sahifada turadi va izlash tizimlariga tushadi.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

alter table public.classes add column if not exists roster_open_until timestamptz;

-- ---------------------------------------------------------------------------
--  O'qituvchi: ochish va yopish
-- ---------------------------------------------------------------------------

create or replace function public.open_roster(p_class uuid, p_minutes integer default 15)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  v_until timestamptz;
begin
  if not exists (
    select 1 from public.classes c where c.id = p_class and c.teacher_id = auth.uid()
  ) then
    raise exception 'NOT_ALLOWED';
  end if;

  -- Eng ko'pi 2 soat — tasodifan ochiq qolib ketmasin
  v_until := now() + make_interval(mins => greatest(1, least(120, coalesce(p_minutes, 15))));
  update public.classes c set roster_open_until = v_until where c.id = p_class;
  return v_until;
end $$;

grant execute on function public.open_roster(uuid, integer) to authenticated;

create or replace function public.close_roster(p_class uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.classes c where c.id = p_class and c.teacher_id = auth.uid()
  ) then
    raise exception 'NOT_ALLOWED';
  end if;
  update public.classes c set roster_open_until = null where c.id = p_class;
end $$;

grant execute on function public.close_roster(uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  O'quvchi (hisobsiz): sinf kodi bo'yicha ro'yxat
--
--  Faqat ismlar qaytadi — PIN alohida so'raladi, shunda butun sinfning
--  kodlari bitta so'rovda tashqariga chiqmaydi.
-- ---------------------------------------------------------------------------

create or replace function public.public_roster(p_code text)
returns table (student_id uuid, full_name text, class_name text)
language sql stable security definer set search_path = public as $$
  select pr.id, pr.full_name, c.name
  from public.classes c
  join public.class_students cs on cs.class_id = c.id
  join public.profiles pr on pr.id = cs.student_id
  where upper(c.join_code) = upper(btrim(p_code))
    and not c.archived
    and c.roster_open_until is not null
    and c.roster_open_until > now()
  order by pr.full_name;
$$;

grant execute on function public.public_roster(text) to anon, authenticated;

-- Tanlangan o'quvchining kirish ma'lumoti
create or replace function public.public_credentials(p_code text, p_student uuid)
returns table (full_name text, class_name text, join_code text, pin text)
language sql stable security definer set search_path = public as $$
  select pr.full_name, c.name, c.join_code, cs.pin
  from public.classes c
  join public.class_students cs on cs.class_id = c.id
  join public.profiles pr on pr.id = cs.student_id
  where upper(c.join_code) = upper(btrim(p_code))
    and not c.archived
    and cs.student_id = p_student
    and c.roster_open_until is not null
    and c.roster_open_until > now()
  limit 1;
$$;

grant execute on function public.public_credentials(text, uuid) to anon, authenticated;

-- Ro'yxat ochiqmi — sahifa ochilganda tekshiriladi
create or replace function public.roster_open(p_code text)
returns table (class_name text, open_until timestamptz)
language sql stable security definer set search_path = public as $$
  select c.name, c.roster_open_until
  from public.classes c
  where upper(c.join_code) = upper(btrim(p_code))
    and not c.archived
    and c.roster_open_until is not null
    and c.roster_open_until > now()
  limit 1;
$$;

grant execute on function public.roster_open(text) to anon, authenticated;
