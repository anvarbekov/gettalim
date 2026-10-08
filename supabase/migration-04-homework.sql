-- ============================================================================
--  GETTALIM — migratsiya 04: uy vazifasi rejimi
--
--  Uy vazifasida savollar o'quvchi qurilmasiga bazadan keladi (doska rejimida
--  ular o'qituvchi kompyuterida qoladi). Shuning uchun o'quvchi topshiriqqa
--  bog'langan paketni o'qiy olishi kerak — lekin faqat o'ziga berilganini.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Topshiriqqa bog'langan paketni o'qish huquqi
-- ---------------------------------------------------------------------------

create or replace function public.pack_assigned_to_me(target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.assignments a
    join public.class_students cs on cs.class_id = a.class_id
    where a.pack_id = target and cs.student_id = auth.uid()
  );
$$;

drop policy if exists packs_assigned_read on public.packs;
create policy packs_assigned_read on public.packs
  for select using (public.pack_assigned_to_me(id));

-- `questions` uchun mavjud siyosat `can_read_pack` ga tayanadi — uni kengaytiramiz
create or replace function public.can_read_pack(target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.packs p
    where p.id = target and (p.is_public or p.owner_id = auth.uid())
  ) or public.pack_assigned_to_me(target);
$$;

-- ---------------------------------------------------------------------------
--  Topshiriqlar: o'quvchi o'z sinfiniki ko'radi (siyosat allaqachon bor),
--  qo'shimcha indeks — ro'yxat tez ochilsin
-- ---------------------------------------------------------------------------

create index if not exists assignments_teacher_idx on public.assignments (teacher_id, created_at desc);
create index if not exists submissions_pair_idx on public.submissions (assignment_id, student_id);

-- ---------------------------------------------------------------------------
--  Topshiriq statistikasi — o'qituvchi jurnalida bitta so'rov bilan ko'rinadi
-- ---------------------------------------------------------------------------

create or replace function public.assignment_stats(p_assignment uuid)
returns table (
  student_id   uuid,
  full_name    text,
  attempts     integer,
  best_score   integer,
  max_score    integer,
  finished_at  timestamptz
)
language sql stable security definer set search_path = public as $$
  select
    pr.id,
    pr.full_name,
    count(s.id)::int                       as attempts,
    coalesce(max(s.score), 0)::int         as best_score,
    coalesce(max(s.max_score), 0)::int     as max_score,
    max(s.finished_at)                     as finished_at
  from public.assignments a
  join public.class_students cs on cs.class_id = a.class_id
  join public.profiles pr       on pr.id = cs.student_id
  left join public.submissions s on s.assignment_id = a.id and s.student_id = pr.id
  where a.id = p_assignment
    and (a.teacher_id = auth.uid() or public.my_role() = 'admin')
  group by pr.id, pr.full_name
  order by coalesce(max(s.score), 0) desc, pr.full_name;
$$;

grant execute on function public.assignment_stats(uuid) to authenticated;
