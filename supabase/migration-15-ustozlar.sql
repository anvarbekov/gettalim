-- ============================================================================
--  GETTALIM — migratsiya 15: O'qituvchilarni faqat egasi belgilaydi
--
--  Avval: istalgan odam «Ro'yxatdan o'tish» orqali o'zini o'qituvchi qila olardi,
--  hatto o'quvchi hisobi ham «O'qituvchi rejimiga o'tish» tugmasini bosardi.
--
--  Endi:
--    - o'qituvchi bo'lib ro'yxatdan o'tish faqat EGA taklif qilgan pochta
--      bilan mumkin (taklifsiz urinish rad etiladi);
--    - rolni faqat ega o'zgartiradi (o'qituvchi qiladi yoki olib tashlaydi);
--    - «ega» belgisini ilovadan umuman o'zgartirib bo'lmaydi — faqat shu yerda,
--      Supabase SQL Editor'da.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
--  ⚠ Eng pastdagi pochta manzilini o'z O'QITUVCHI hisobingiz pochtasiga
--    almashtiring (hozir siz shu pochta bilan kirasiz). Natijada
--    "UPDATE 1" chiqishi kerak.
-- ============================================================================

alter table public.profiles add column if not exists is_owner boolean not null default false;

-- Takliflar: ega kiritgan pochta — shu pochta bilan o'qituvchi bo'lib
-- ro'yxatdan o'tish mumkin. Taklif bir martalik.
create table if not exists public.teacher_invites (
  email      text primary key,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Siyosat yo'q = ilovadan to'g'ridan-to'g'ri o'qish/yozish yopiq.
-- Faqat quyidagi funksiyalar orqali.
alter table public.teacher_invites enable row level security;

-- ---------------------------------------------------------------------------
--  Yordamchi
-- ---------------------------------------------------------------------------

create or replace function public.is_owner()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_owner from public.profiles p where p.id = auth.uid()), false);
$$;

grant execute on function public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------------------
--  Yangi hisob: o'qituvchi faqat taklif bilan
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_requested text := new.raw_user_meta_data ->> 'role';
  v_email     text := lower(coalesce(new.email, ''));
  v_role      public.user_role := 'student';
begin
  if v_requested in ('teacher', 'admin') then
    if not exists (select 1 from public.teacher_invites i where i.email = v_email) then
      raise exception 'TEACHER_INVITE_REQUIRED';
    end if;
    delete from public.teacher_invites where email = v_email;
    v_role := 'teacher';
  end if;

  insert into public.profiles (id, full_name, role, student_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    v_role,
    new.raw_user_meta_data ->> 'student_code'
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- ---------------------------------------------------------------------------
--  Rolni o'zgartirish: faqat ega. «Ega» belgisini — hech kim (faqat SQL).
-- ---------------------------------------------------------------------------

create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- SQL Editor yoki server kaliti — cheklov yo'q
  if auth.uid() is null then
    return new;
  end if;

  if new.is_owner is distinct from old.is_owner then
    raise exception 'OWNER_FLAG_LOCKED';
  end if;

  if new.role is distinct from old.role and not public.is_owner() then
    raise exception 'ROLE_CHANGE_NOT_ALLOWED';
  end if;

  return new;
end $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- ---------------------------------------------------------------------------
--  Ro'yxatdan o'tish sahifasi uchun: bu pochta taklif qilinganmi
-- ---------------------------------------------------------------------------

create or replace function public.teacher_invited(p_email text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teacher_invites i where i.email = lower(trim(p_email)));
$$;

grant execute on function public.teacher_invited(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  Ega boshqaruvi
-- ---------------------------------------------------------------------------

/** O'qituvchilar va kutilayotgan takliflar. */
create or replace function public.owner_teachers()
returns table (
  id         uuid,
  email      text,
  full_name  text,
  is_owner   boolean,
  pending    boolean,
  created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.full_name, p.is_owner, false, u.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_owner() and p.role in ('teacher', 'admin')
  union all
  select null, i.email, null, false, true, i.created_at
  from public.teacher_invites i
  where public.is_owner()
  order by 4 desc, 5, 6;
$$;

grant execute on function public.owner_teachers() to authenticated;

/**
 * Pochtani o'qituvchi qilish.
 * Bunday hisob bor bo'lsa — darhol o'qituvchi bo'ladi ('promoted').
 * Yo'q bo'lsa — taklif yoziladi, odam /ustoz sahifasida ro'yxatdan o'tadi ('invited').
 */
create or replace function public.owner_add_teacher(p_email text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
  v_user  uuid;
begin
  if not public.is_owner() then
    raise exception 'NOT_OWNER';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'BAD_EMAIL';
  end if;
  if v_email like '%@gettalim.local' then
    raise exception 'STUDENT_ACCOUNT';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = v_email;

  if v_user is not null then
    update public.profiles set role = 'teacher' where id = v_user and role = 'student';
    return 'promoted';
  end if;

  insert into public.teacher_invites (email, invited_by)
  values (v_email, auth.uid())
  on conflict (email) do nothing;
  return 'invited';
end $$;

grant execute on function public.owner_add_teacher(text) to authenticated;

/** O'qituvchilikdan olish yoki taklifni bekor qilish. Egani olib bo'lmaydi. */
create or replace function public.owner_remove_teacher(p_email text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(trim(p_email));
begin
  if not public.is_owner() then
    raise exception 'NOT_OWNER';
  end if;

  delete from public.teacher_invites where email = v_email;

  update public.profiles p
  set role = 'student'
  from auth.users u
  where u.id = p.id and lower(u.email) = v_email and not p.is_owner;

  return true;
end $$;

grant execute on function public.owner_remove_teacher(text) to authenticated;

-- ---------------------------------------------------------------------------
--  Ega — siz. ⚠ Pochtani o'zingiznikiga almashtiring.
-- ---------------------------------------------------------------------------

update public.profiles
set is_owner = true, role = 'teacher'
where id in (
  select u.id from auth.users u
  where lower(u.email) = lower('muhammadnozimanvarbekov@gmail.com')
);
