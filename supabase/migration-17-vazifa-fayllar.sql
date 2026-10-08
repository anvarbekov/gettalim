-- ============================================================================
--  GETTALIM — migratsiya 17: ishlar limitlari va fayl bilan uy vazifasi
--
--  1. O'quvchi ishlari:
--     - o'qituvchi o'z o'quvchisining istalgan ishini o'chira oladi;
--     - o'quvchi jami 3 marta ish o'chira oladi;
--     - o'quvchi har bir ishni 3 martagacha qayta yuklaydi (tahrirlaydi);
--     - o'qituvchi o'quvchi limitlarini tiklay oladi.
--  2. Uy vazifasi:
--     - endi ikki xil: «o'yin» (avvalgidek) va «topshiriq» — fayl, video,
--       matn, havola bilan beriladi;
--     - o'quvchi topshiriqqa o'z ishini (fayl, matn, havola) yuklaydi,
--       o'qituvchi «O'quvchilar ishlari» bo'limida baholaydi.
--
--  Oldin migration-16 bajarilgan bo'lishi kerak.
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
--  Qayta ishga tushirish xavfsiz.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Uy vazifasi: topshiriq turi va materiallar
-- ---------------------------------------------------------------------------

alter table public.assignments add column if not exists kind  text not null default 'game';
alter table public.assignments add column if not exists body  text;
alter table public.assignments add column if not exists files jsonb not null default '[]'::jsonb;
alter table public.assignments add column if not exists link  text;
alter table public.assignments alter column game_id drop not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'assignments_kind_check') then
    alter table public.assignments
      add constraint assignments_kind_check check (kind in ('game', 'task'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
--  2. Ishlar: topshiriqqa bog'lash va qayta yuklash hisobi
-- ---------------------------------------------------------------------------

alter table public.works add column if not exists assignment_id uuid
  references public.assignments (id) on delete set null;
alter table public.works add column if not exists edit_count smallint not null default 0;

create index if not exists works_assignment on public.works (assignment_id) where assignment_id is not null;

-- Bitta topshiriqqa bitta ish (qayta yuklash — shu ishni tahrirlash)
create unique index if not exists works_one_per_assignment
  on public.works (assignment_id, student_id) where assignment_id is not null;

-- O'quvchining o'chirish hisobi. Ilovadan faqat o'qiladi — yozish trigger orqali.
create table if not exists public.work_quota (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  deletes    smallint not null default 0
);

alter table public.work_quota enable row level security;

drop policy if exists work_quota_read on public.work_quota;
create policy work_quota_read on public.work_quota
  for select using (student_id = auth.uid() or public.is_my_student(student_id));

-- Topshiriqqa faqat o'z sinfiniki va faqat «topshiriq» turidagisiga bog'lanadi
drop policy if exists works_insert on public.works;
create policy works_insert on public.works
  for insert with check (
    student_id = auth.uid()
    and grade is null and graded_by is null
    and (
      assignment_id is null
      or exists (
        select 1 from public.assignments a
        where a.id = assignment_id and a.kind = 'task' and public.is_class_member(a.class_id)
      )
    )
  );

-- O'qituvchi ham o'chira oladi (baholangan bo'lsa ham)
drop policy if exists works_delete on public.works;
create policy works_delete on public.works
  for delete using (
    (student_id = auth.uid() and grade is null) or public.is_my_student(student_id)
  );

-- ---------------------------------------------------------------------------
--  3. Qoidalar triggerlari
-- ---------------------------------------------------------------------------

create or replace function public.guard_work_grade()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_content_changed boolean;
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

  -- O'quvchi bog'lanishni va hisobni o'zgartira olmaydi
  if old.student_id = auth.uid() then
    new.assignment_id := old.assignment_id;
    new.edit_count := old.edit_count;
  end if;

  v_content_changed := new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.files is distinct from old.files
    or new.link is distinct from old.link;

  if v_content_changed and old.student_id = auth.uid() then
    if old.grade is not null then
      raise exception 'WORK_LOCKED';
    end if;
    if old.edit_count >= 3 then
      raise exception 'EDIT_LIMIT';
    end if;
    new.edit_count := old.edit_count + 1;
  end if;

  new.updated_at := now();
  return new;
end $$;

drop trigger if exists works_guard on public.works;
create trigger works_guard
  before update on public.works
  for each row execute function public.guard_work_grade();

/** O'quvchi o'z ishini o'chirsa — hisobga yoziladi, 3 tadan keyin to'xtaydi. */
create or replace function public.guard_work_delete()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_used smallint;
begin
  if auth.uid() is null or old.student_id <> auth.uid() then
    return old; -- o'qituvchi yoki SQL Editor — cheklov yo'q
  end if;

  insert into public.work_quota (student_id) values (old.student_id)
  on conflict (student_id) do nothing;

  select deletes into v_used from public.work_quota where student_id = old.student_id for update;
  if v_used >= 3 then
    raise exception 'DELETE_LIMIT';
  end if;

  update public.work_quota set deletes = deletes + 1 where student_id = old.student_id;
  return old;
end $$;

drop trigger if exists works_guard_delete on public.works;
create trigger works_guard_delete
  before delete on public.works
  for each row execute function public.guard_work_delete();

-- ---------------------------------------------------------------------------
--  4. Funksiyalar
-- ---------------------------------------------------------------------------

/** O'qituvchi o'quvchi limitlarini tiklaydi: o'chirish va qayta yuklash — yana 3 tadan. */
create or replace function public.reset_work_limits(p_student uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_my_student(p_student) then
    return false;
  end if;
  update public.work_quota set deletes = 0 where student_id = p_student;
  -- Trigger o'quvchi uchun ishlaydi; bu yerda auth.uid() — o'qituvchi
  update public.works set edit_count = 0 where student_id = p_student and edit_count > 0;
  return true;
end $$;

grant execute on function public.reset_work_limits(uuid) to authenticated;

-- Qaytaradigan ustunlar o'zgardi — eski funksiya o'chiriladi
drop function if exists public.teacher_works(uuid, boolean);
drop function if exists public.teacher_works(uuid, text, uuid);

/**
 * O'qituvchi uchun ishlar.
 *   p_status: null — hammasi, 'ungraded' — baholanmaganlar, 'graded' — baholanganlar
 *   p_assignment: faqat shu topshiriqqa yuklanganlar
 */
create or replace function public.teacher_works(
  p_class      uuid default null,
  p_status     text default null,
  p_assignment uuid default null
)
returns table (
  id               uuid,
  student_id       uuid,
  student_name     text,
  class_name       text,
  title            text,
  body             text,
  files            jsonb,
  link             text,
  grade            smallint,
  grade_comment    text,
  edit_count       smallint,
  assignment_id    uuid,
  assignment_title text,
  due_at           timestamptz,
  created_at       timestamptz,
  updated_at       timestamptz
)
language sql stable security definer set search_path = public as $$
  select distinct on (w.created_at, w.id)
    w.id, w.student_id, p.full_name, k.name, w.title, w.body, w.files, w.link,
    w.grade, w.grade_comment, w.edit_count, w.assignment_id, a.title, a.due_at,
    w.created_at, w.updated_at
  from public.works w
  join public.profiles p on p.id = w.student_id
  join public.class_students cs on cs.student_id = w.student_id
  join public.classes k on k.id = cs.class_id and k.teacher_id = auth.uid()
  left join public.assignments a on a.id = w.assignment_id
  where (p_class is null or k.id = p_class)
    and (p_assignment is null or w.assignment_id = p_assignment)
    and (p_status is null
         or (p_status = 'ungraded' and w.grade is null)
         or (p_status = 'graded' and w.grade is not null))
  order by w.created_at desc, w.id
  limit 300;
$$;

grant execute on function public.teacher_works(uuid, text, uuid) to authenticated;

/** Topshiriq jurnali: sinfdagi har bir o'quvchi — topshirdimi, bahosi. */
create or replace function public.task_stats(p_assignment uuid)
returns table (
  student_id   uuid,
  full_name    text,
  work_id      uuid,
  grade        smallint,
  submitted_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select pr.id, pr.full_name, w.id, w.grade, w.created_at
  from public.assignments a
  join public.class_students cs on cs.class_id = a.class_id
  join public.profiles pr on pr.id = cs.student_id
  left join public.works w on w.assignment_id = a.id and w.student_id = pr.id
  where a.id = p_assignment
    and (a.teacher_id = auth.uid() or public.my_role() = 'admin')
  order by (w.id is null), pr.full_name;
$$;

grant execute on function public.task_stats(uuid) to authenticated;
