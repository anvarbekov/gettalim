-- ============================================================================
--  GETTALIM — migratsiya 16: O'quvchi ishlari (portfolio) va baholash
--
--  O'quvchi o'z ishini yuklaydi: sarlavha, izoh, fayllar (rasm, hujjat,
--  video, arxiv), havola. O'qituvchi ko'radi va 2–5 baho hamda izoh qo'yadi.
--
--  Fayllarning o'zi Cloudinary'da turadi — bu yerda faqat havolalar.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
--  Qayta ishga tushirish xavfsiz.
-- ============================================================================

create table if not exists public.works (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles (id) on delete cascade,
  title         text not null,
  body          text,
  -- [{ "url": "...", "name": "...", "size": 123, "kind": "image|video|file|voice" }]
  files         jsonb not null default '[]'::jsonb,
  link          text,
  grade         smallint check (grade between 2 and 5),
  grade_comment text,
  graded_by     uuid references public.profiles (id) on delete set null,
  graded_at     timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists works_student on public.works (student_id, created_at desc);
create index if not exists works_ungraded on public.works (created_at desc) where grade is null;

alter table public.works enable row level security;

/** Shu o'quvchi mening sinfimdami. */
create or replace function public.is_my_student(p_student uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.class_students cs
    join public.classes k on k.id = cs.class_id
    where cs.student_id = p_student and k.teacher_id = auth.uid()
  );
$$;

grant execute on function public.is_my_student(uuid) to authenticated;

-- O'quvchi — o'z ishlari; o'qituvchi — o'z sinflaridagi o'quvchilar ishlari
drop policy if exists works_read on public.works;
create policy works_read on public.works
  for select using (student_id = auth.uid() or public.is_my_student(student_id));

drop policy if exists works_insert on public.works;
create policy works_insert on public.works
  for insert with check (student_id = auth.uid() and grade is null and graded_by is null);

-- O'quvchi o'z ishini tahrirlay oladi (baho ustunlarini emas — trigger to'sadi)
drop policy if exists works_update on public.works;
create policy works_update on public.works
  for update using (student_id = auth.uid());

drop policy if exists works_delete on public.works;
create policy works_delete on public.works
  for delete using (student_id = auth.uid() and grade is null);

/** Bahoni faqat o'qituvchi qo'yadi — o'quvchi o'ziga «5» yozib qo'ya olmasin. */
create or replace function public.guard_work_grade()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if (new.grade is distinct from old.grade
      or new.grade_comment is distinct from old.grade_comment
      or new.graded_by is distinct from old.graded_by
      or new.graded_at is distinct from old.graded_at)
     and not public.is_my_student(old.student_id) then
    raise exception 'GRADE_NOT_ALLOWED';
  end if;
  -- Baholangan ishni o'quvchi o'zgartira olmaydi
  if old.grade is not null and new.student_id = auth.uid()
     and (new.title is distinct from old.title or new.body is distinct from old.body
          or new.files is distinct from old.files or new.link is distinct from old.link) then
    raise exception 'WORK_LOCKED';
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists works_guard on public.works;
create trigger works_guard
  before update on public.works
  for each row execute function public.guard_work_grade();

/** Baholash — faqat o'z o'quvchisi ishiga. `p_grade = null` — bahoni olib tashlash. */
create or replace function public.grade_work(p_work uuid, p_grade smallint, p_comment text default null)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_student uuid;
begin
  select w.student_id into v_student from public.works w where w.id = p_work;
  if v_student is null or not public.is_my_student(v_student) then
    return false;
  end if;
  if p_grade is not null and (p_grade < 2 or p_grade > 5) then
    raise exception 'BAD_GRADE';
  end if;

  update public.works
  set grade = p_grade,
      grade_comment = nullif(trim(coalesce(p_comment, '')), ''),
      graded_by = case when p_grade is null then null else auth.uid() end,
      graded_at = case when p_grade is null then null else now() end
  where id = p_work;
  return true;
end $$;

grant execute on function public.grade_work(uuid, smallint, text) to authenticated;

/** O'qituvchi uchun: o'quvchilar ishlari, sinf nomi bilan. */
create or replace function public.teacher_works(p_class uuid default null, p_only_ungraded boolean default false)
returns table (
  id            uuid,
  student_id    uuid,
  student_name  text,
  class_name    text,
  title         text,
  body          text,
  files         jsonb,
  link          text,
  grade         smallint,
  grade_comment text,
  created_at    timestamptz
)
language sql stable security definer set search_path = public as $$
  select distinct on (w.created_at, w.id)
    w.id, w.student_id, p.full_name, k.name, w.title, w.body, w.files, w.link,
    w.grade, w.grade_comment, w.created_at
  from public.works w
  join public.profiles p on p.id = w.student_id
  join public.class_students cs on cs.student_id = w.student_id
  join public.classes k on k.id = cs.class_id and k.teacher_id = auth.uid()
  where (p_class is null or k.id = p_class)
    and (not p_only_ungraded or w.grade is null)
  order by w.created_at desc, w.id
  limit 300;
$$;

grant execute on function public.teacher_works(uuid, boolean) to authenticated;
