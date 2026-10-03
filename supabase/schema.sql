-- ============================================================================
--  GETTALIM — ma'lumotlar bazasi sxemasi (v5)
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq nusxalab "Run".
--  Fayl qayta ishga tushirilsa ham xato bermaydi (idempotent).
--
--  Muhim: doska rejimi (bitta kompyuter + proyektor) bu bazaga umuman bog'liq
--  emas. Baza faqat ulangan rejim, uy vazifasi va jurnal uchun kerak.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
--  1. FOYDALANUVCHILAR VA SINFLAR
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.user_role as enum ('admin', 'teacher', 'student');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '',
  role         public.user_role not null default 'student',
  avatar       text,
  -- o'quvchi uchun: sinf kodi + ism asosidagi kirish identifikatori
  student_code text,
  xp           integer not null default 0,
  level        integer not null default 1,
  streak_days  integer not null default 0,
  last_active  timestamptz,
  created_at   timestamptz not null default now()
);

create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  -- o'quvchi shu kod bilan sinfga kiradi
  join_code  text not null unique,
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists classes_teacher_idx on public.classes (teacher_id);

create table if not exists public.class_students (
  class_id   uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  -- o'quvchiga beriladigan 4 xonali kod (parol o'rniga)
  pin        text,
  added_at   timestamptz not null default now(),
  primary key (class_id, student_id)
);

create index if not exists class_students_student_idx on public.class_students (student_id);

-- ---------------------------------------------------------------------------
--  2. SAVOLLAR BAZASI
-- ---------------------------------------------------------------------------

create table if not exists public.packs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references public.profiles (id) on delete set null,
  title       text not null,
  subject     text not null default '',
  grade       integer,
  icon        text default '📚',
  color       text default '#1f6fd0',
  description text,
  language    text default 'uz',
  is_public   boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists packs_owner_idx  on public.packs (owner_id);
create index if not exists packs_public_idx on public.packs (is_public) where is_public;

do $$ begin
  create type public.question_type as enum ('choice', 'number', 'text');
exception when duplicate_object then null; end $$;

create table if not exists public.questions (
  id          uuid primary key default gen_random_uuid(),
  pack_id     uuid not null references public.packs (id) on delete cascade,
  type        public.question_type not null default 'choice',
  text        text not null,
  answer      text not null,
  options     jsonb not null default '[]'::jsonb,
  alt         jsonb not null default '[]'::jsonb,
  difficulty  smallint not null default 1 check (difficulty between 1 and 3),
  image_url   text,
  explanation text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists questions_pack_idx on public.questions (pack_id, position);

-- ---------------------------------------------------------------------------
--  3. ULANGAN REJIM (jonli sessiyalar) — Sprint 3 da ishlatiladi
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.session_status as enum ('waiting', 'running', 'finished');
exception when duplicate_object then null; end $$;

create table if not exists public.sessions (
  id                     uuid primary key default gen_random_uuid(),
  pin                    text not null unique check (char_length(pin) = 6),
  game_id                text not null,
  pack_id                uuid references public.packs (id) on delete set null,
  host_id                uuid not null references public.profiles (id) on delete cascade,
  class_id               uuid references public.classes (id) on delete set null,
  status                 public.session_status not null default 'waiting',
  config                 jsonb not null default '{}'::jsonb,
  current_question_index integer not null default 0,
  started_at             timestamptz,
  ended_at               timestamptz,
  created_at             timestamptz not null default now()
);

create index if not exists sessions_host_idx on public.sessions (host_id, created_at desc);
create index if not exists sessions_pin_idx  on public.sessions (pin) where status <> 'finished';

create table if not exists public.participants (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete set null,
  nickname   text not null,
  team_no    smallint not null default 1,
  score      integer not null default 0,
  joined_at  timestamptz not null default now()
);

create index if not exists participants_session_idx on public.participants (session_id);

create table if not exists public.answers (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.sessions (id) on delete cascade,
  participant_id uuid not null references public.participants (id) on delete cascade,
  question_id    uuid references public.questions (id) on delete set null,
  question_text  text,
  given_answer   text,
  is_correct     boolean not null default false,
  ms_taken       integer,
  created_at     timestamptz not null default now()
);

create index if not exists answers_session_idx     on public.answers (session_id, created_at);
create index if not exists answers_participant_idx on public.answers (participant_id);

-- ---------------------------------------------------------------------------
--  4. MUSTAQIL REJIM (uy vazifasi) — Sprint 6 da ishlatiladi
-- ---------------------------------------------------------------------------

create table if not exists public.assignments (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references public.profiles (id) on delete cascade,
  class_id     uuid not null references public.classes (id) on delete cascade,
  game_id      text not null,
  pack_id      uuid references public.packs (id) on delete set null,
  title        text not null,
  config       jsonb not null default '{}'::jsonb,
  due_at       timestamptz,
  max_attempts smallint not null default 1,
  created_at   timestamptz not null default now()
);

create index if not exists assignments_class_idx on public.assignments (class_id, due_at desc);

create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id    uuid not null references public.profiles (id) on delete cascade,
  attempt_no    smallint not null default 1,
  score         integer not null default 0,
  max_score     integer not null default 0,
  details       jsonb not null default '{}'::jsonb,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  unique (assignment_id, student_id, attempt_no)
);

create index if not exists submissions_assignment_idx on public.submissions (assignment_id);
create index if not exists submissions_student_idx    on public.submissions (student_id);

-- ---------------------------------------------------------------------------
--  5. GAMIFIKATSIYA — Sprint 7 da ishlatiladi
-- ---------------------------------------------------------------------------

create table if not exists public.achievements (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  title       text not null,
  description text,
  icon        text
);

create table if not exists public.user_achievements (
  user_id        uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at      timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

insert into public.achievements (code, title, description, icon) values
  ('first_win',     'Birinchi g''alaba', 'Birinchi marta o''yinda g''olib bo''ldingiz',      '🏆'),
  ('streak_10',     '10 kun ketma-ket',  '10 kun tanaffussiz mashq qildingiz',              '🔥'),
  ('flawless',      'Xatosiz o''yin',    'Butun o''yinni bitta ham xatosiz yakunladingiz',   '💎'),
  ('lightning',     'Chaqmoq javob',     '10 ta savolga 3 soniyadan tez javob berdingiz',    '⚡'),
  ('crossword_pro', 'Krossvord ustasi',  'Krossvordni to''liq va xatosiz to''ldirdingiz',    '🔡')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
--  6. YORDAMCHI FUNKSIYALAR
--  `security definer` — RLS siyosatlari ichida rekursiya bo'lmasligi uchun.
-- ---------------------------------------------------------------------------

create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_class_teacher(target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes c where c.id = target and c.teacher_id = auth.uid());
$$;

create or replace function public.is_class_member(target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_students cs
    where cs.class_id = target and cs.student_id = auth.uid()
  );
$$;

create or replace function public.can_read_pack(target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.packs p
    where p.id = target and (p.is_public or p.owner_id = auth.uid())
  );
$$;

create or replace function public.is_session_host(target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sessions s where s.id = target and s.host_id = auth.uid());
$$;

create or replace function public.is_session_participant(target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.participants p
    where p.session_id = target and p.student_id = auth.uid()
  );
$$;

-- Ro'yxatdan o'tgan har bir foydalanuvchi uchun profil avtomatik yaratiladi
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, student_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'student'),
    new.raw_user_meta_data ->> 'student_code'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Takrorlanmas 6 xonali sessiya PIN kodi
create or replace function public.generate_session_pin()
returns text
language plpgsql security definer set search_path = public as $$
declare candidate text;
begin
  loop
    candidate := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    exit when not exists (select 1 from public.sessions where pin = candidate and status <> 'finished');
  end loop;
  return candidate;
end $$;

-- Sinf kodi bo'yicha sinfni topish (o'quvchi kirishda ishlatadi).
-- Faqat id va nom qaytadi — sinf ro'yxati ochilib qolmaydi.
create or replace function public.find_class_by_code(code text)
returns table (id uuid, name text)
language sql stable security definer set search_path = public as $$
  select c.id, c.name from public.classes c
  where upper(c.join_code) = upper(code) and not c.archived
  limit 1;
$$;

grant execute on function public.find_class_by_code(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  7. RLS
-- ---------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.classes           enable row level security;
alter table public.class_students    enable row level security;
alter table public.packs             enable row level security;
alter table public.questions         enable row level security;
alter table public.sessions          enable row level security;
alter table public.participants      enable row level security;
alter table public.answers           enable row level security;
alter table public.assignments       enable row level security;
alter table public.submissions       enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;

-- --- profiles --------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or public.my_role() = 'admin'
    or exists (
      select 1 from public.class_students cs
      join public.classes c on c.id = cs.class_id
      where cs.student_id = profiles.id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.my_role() = 'admin')
  with check (id = auth.uid() or public.my_role() = 'admin');

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

-- --- classes ---------------------------------------------------------------
drop policy if exists classes_teacher_all on public.classes;
create policy classes_teacher_all on public.classes
  for all using (teacher_id = auth.uid() or public.my_role() = 'admin')
  with check (teacher_id = auth.uid() or public.my_role() = 'admin');

drop policy if exists classes_student_read on public.classes;
create policy classes_student_read on public.classes
  for select using (public.is_class_member(id));

-- --- class_students --------------------------------------------------------
drop policy if exists class_students_teacher_all on public.class_students;
create policy class_students_teacher_all on public.class_students
  for all using (public.is_class_teacher(class_id) or public.my_role() = 'admin')
  with check (public.is_class_teacher(class_id) or public.my_role() = 'admin');

drop policy if exists class_students_self_read on public.class_students;
create policy class_students_self_read on public.class_students
  for select using (student_id = auth.uid());

-- o'quvchi sinf kodi bilan o'zini ro'yxatga qo'shadi
drop policy if exists class_students_self_join on public.class_students;
create policy class_students_self_join on public.class_students
  for insert with check (student_id = auth.uid());

-- --- packs / questions -----------------------------------------------------
drop policy if exists packs_owner_all on public.packs;
create policy packs_owner_all on public.packs
  for all using (owner_id = auth.uid() or public.my_role() = 'admin')
  with check (owner_id = auth.uid() or public.my_role() = 'admin');

drop policy if exists packs_public_read on public.packs;
create policy packs_public_read on public.packs
  for select using (is_public);

drop policy if exists questions_read on public.questions;
create policy questions_read on public.questions
  for select using (public.can_read_pack(pack_id));

drop policy if exists questions_owner_write on public.questions;
create policy questions_owner_write on public.questions
  for all using (exists (select 1 from public.packs p where p.id = pack_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.packs p where p.id = pack_id and p.owner_id = auth.uid()));

-- --- sessions / participants / answers -------------------------------------
drop policy if exists sessions_host_all on public.sessions;
create policy sessions_host_all on public.sessions
  for all using (host_id = auth.uid() or public.my_role() = 'admin')
  with check (host_id = auth.uid() or public.my_role() = 'admin');

drop policy if exists sessions_participant_read on public.sessions;
create policy sessions_participant_read on public.sessions
  for select using (public.is_session_participant(id));

drop policy if exists participants_host_all on public.participants;
create policy participants_host_all on public.participants
  for all using (public.is_session_host(session_id))
  with check (public.is_session_host(session_id));

drop policy if exists participants_self_read on public.participants;
create policy participants_self_read on public.participants
  for select using (student_id = auth.uid());

drop policy if exists participants_self_join on public.participants;
create policy participants_self_join on public.participants
  for insert with check (student_id = auth.uid());

drop policy if exists participants_self_update on public.participants;
create policy participants_self_update on public.participants
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists answers_read on public.answers;
create policy answers_read on public.answers
  for select using (public.is_session_host(session_id) or public.is_session_participant(session_id));

drop policy if exists answers_self_write on public.answers;
create policy answers_self_write on public.answers
  for insert with check (
    exists (
      select 1 from public.participants p
      where p.id = participant_id and p.student_id = auth.uid() and p.session_id = answers.session_id
    )
  );

-- --- assignments / submissions ---------------------------------------------
drop policy if exists assignments_teacher_all on public.assignments;
create policy assignments_teacher_all on public.assignments
  for all using (teacher_id = auth.uid() or public.my_role() = 'admin')
  with check (teacher_id = auth.uid() or public.my_role() = 'admin');

drop policy if exists assignments_student_read on public.assignments;
create policy assignments_student_read on public.assignments
  for select using (public.is_class_member(class_id));

drop policy if exists submissions_student_own on public.submissions;
create policy submissions_student_own on public.submissions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists submissions_teacher_read on public.submissions;
create policy submissions_teacher_read on public.submissions
  for select using (
    exists (select 1 from public.assignments a where a.id = assignment_id and a.teacher_id = auth.uid())
  );

-- --- achievements ----------------------------------------------------------
drop policy if exists achievements_read on public.achievements;
create policy achievements_read on public.achievements for select using (true);

drop policy if exists user_achievements_own on public.user_achievements;
create policy user_achievements_own on public.user_achievements
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
--  8. REALTIME (ulangan rejim uchun)
-- ---------------------------------------------------------------------------

do $$ begin alter publication supabase_realtime add table public.sessions;     exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.participants; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.answers;      exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
--  9. ULANGAN REJIM UCHUN FUNKSIYALAR
--
--  O'quvchi PIN bilan qo'shilganda hisobi bo'lishi shart emas. Shuning uchun
--  jadvallarni anon foydalanuvchiga ochish o'rniga, faqat shu ikki funksiya
--  ochiladi — ular kerakli tekshiruvni o'zi bajaradi.
-- ---------------------------------------------------------------------------

-- Sessiyaga qo'shilish. Hisobi bor o'quvchi taniladi, yo'g'i mehmon bo'ladi.
create or replace function public.join_session(p_pin text, p_nickname text)
returns table (participant_id uuid, session_id uuid, game_id text, config jsonb)
language plpgsql security definer set search_path = public as $$
declare
  s public.sessions%rowtype;
  existing uuid;
  new_id uuid;
begin
  select * into s from public.sessions
  where pin = p_pin and status in ('waiting', 'running')
  limit 1;

  if s.id is null then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  if length(coalesce(trim(p_nickname), '')) < 2 then
    raise exception 'NICKNAME_TOO_SHORT';
  end if;

  -- O'sha qurilma qayta ulansa yangi qatnashuvchi yaratilmasin
  if auth.uid() is not null then
    select id into existing from public.participants
    where session_id = s.id and student_id = auth.uid() limit 1;
  else
    select id into existing from public.participants
    where session_id = s.id and lower(nickname) = lower(trim(p_nickname)) limit 1;
  end if;

  if existing is not null then
    return query select existing, s.id, s.game_id, s.config;
    return;
  end if;

  insert into public.participants (session_id, student_id, nickname)
  values (s.id, auth.uid(), trim(p_nickname))
  returning id into new_id;

  return query select new_id, s.id, s.game_id, s.config;
end $$;

grant execute on function public.join_session(text, text) to anon, authenticated;

-- PIN bo'yicha sessiya bor-yo'qligini tekshirish (qo'shilishdan oldin)
create or replace function public.peek_session(p_pin text)
returns table (game_id text, status public.session_status)
language sql stable security definer set search_path = public as $$
  select s.game_id, s.status from public.sessions s
  where s.pin = p_pin and s.status in ('waiting', 'running')
  limit 1;
$$;

grant execute on function public.peek_session(text) to anon, authenticated;

-- Javoblarni sessiya egasi yozadi (o'quvchi qurilmasi emas) — shunda hiyla qilib
-- bo'lmaydi va mehmon o'quvchi uchun ham jurnal to'ladi.
drop policy if exists answers_host_write on public.answers;
create policy answers_host_write on public.answers
  for insert with check (public.is_session_host(session_id));

-- ---------------------------------------------------------------------------
--  9. ULANGAN REJIM UCHUN RPC FUNKSIYALARI
--
--  O'quvchi hisobsiz ham qo'shila olishi kerak (darsda 30 ta bola parol
--  terib o'tirmaydi). Shuning uchun qo'shilish va javob yuborish
--  `security definer` funksiyalar orqali amalga oshiriladi — RLS ochilmaydi,
--  lekin mehmon ham o'ynay oladi.
-- ---------------------------------------------------------------------------

-- PIN bo'yicha sessiyaga qo'shilish.
-- Diqqat: funksiya ichidagi barcha ustunlar jadval taxallusi bilan yoziladi —
-- aks holda qaytariladigan ustun nomlari (status, session_id) bilan chalkashadi.
create or replace function public.join_session(
  p_pin      text,
  p_nickname text,
  p_team     smallint default 1
)
returns table (
  session_id     uuid,
  participant_id uuid,
  game_id        text,
  config         jsonb,
  status         public.session_status
)
language plpgsql security definer set search_path = public as $$
declare
  v_session public.sessions%rowtype;
  v_pid     uuid;
  v_nick    text;
begin
  v_nick := nullif(btrim(p_nickname), '');
  if v_nick is null then
    raise exception 'NICKNAME_REQUIRED';
  end if;

  select s.* into v_session
  from public.sessions s
  where s.pin = btrim(p_pin) and s.status <> 'finished'
  limit 1;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  -- O'sha qurilmadan qayta kirilsa, eski yozuv qayta ishlatiladi
  select p.id into v_pid
  from public.participants p
  where p.session_id = v_session.id
    and lower(p.nickname) = lower(left(v_nick, 40))
    and (p.student_id is not distinct from auth.uid())
  limit 1;

  if v_pid is null then
    insert into public.participants (session_id, student_id, nickname, team_no)
    values (v_session.id, auth.uid(), left(v_nick, 40), greatest(1, coalesce(p_team, 1)))
    returning id into v_pid;
  end if;

  return query
    select v_session.id, v_pid, v_session.game_id, v_session.config, v_session.status;
end $$;

grant execute on function public.join_session(text, text, smallint) to anon, authenticated;

-- Javobni saqlash va ballni yangilash. Qaytadigan qiymat — jamg'arilgan ball.
create or replace function public.submit_answer(
  p_participant uuid,
  p_question    text,
  p_answer      text,
  p_correct     boolean,
  p_ms          integer default null
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

  insert into public.answers (session_id, participant_id, question_text, given_answer, is_correct, ms_taken)
  values (
    v_session,
    p_participant,
    left(coalesce(p_question, ''), 500),
    left(coalesce(p_answer, ''), 200),
    p_correct,
    p_ms
  );

  -- To'g'ri javob 100 ball; tez javob uchun 50 ballgacha qo'shimcha
  v_gained := case
    when p_correct then 100 + greatest(0, 50 - coalesce(p_ms, 20000) / 400)
    else 0
  end;

  update public.participants p
  set score = p.score + v_gained
  where p.id = p_participant
  returning p.score into v_score;

  return coalesce(v_score, 0);
end $$;

grant execute on function public.submit_answer(uuid, text, text, boolean, integer) to anon, authenticated;

-- Sessiya holati (o'quvchi qayta ulanganda kerak)
create or replace function public.session_state(p_pin text)
returns table (status public.session_status, game_id text, current_question_index integer)
language sql stable security definer set search_path = public as $$
  select s.status, s.game_id, s.current_question_index
  from public.sessions s
  where s.pin = btrim(p_pin) and s.status <> 'finished'
  limit 1;
$$;

grant execute on function public.session_state(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  10. XAVFSIZLIK: rolni o'zboshimchalik bilan ko'tarishning oldini olish
--
--  `profiles` jadvalida foydalanuvchi o'z satrini yangilay oladi. Bu ismni
--  o'zgartirish uchun kerak, lekin o'quvchi o'zini o'qituvchi qilib qo'yishi
--  mumkin bo'lmasligi kerak. O'quvchilarning pochtasi sintetik
--  (@gettalim.local) — shuning uchun ular uchun rolni o'zgartirish taqiqlanadi.
-- ---------------------------------------------------------------------------

create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  email text;
begin
  if new.role is distinct from old.role then
    select u.email into email from auth.users u where u.id = new.id;
    if coalesce(email, '') like '%@gettalim.local' then
      raise exception 'ROLE_CHANGE_NOT_ALLOWED';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_role_change();
