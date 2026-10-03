-- ============================================================================
--  GETTALIM — migratsiya 05: gamifikatsiya
--
--  XP, daraja, kunlik streak va nishonlar. Barcha hisob-kitob bazada
--  bajariladi — shunda o'quvchi brauzerdan ball qo'shib qo'ya olmaydi.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Daraja formulasi
--
--  Daraja XP ning kvadrat ildiziga bog'liq: boshida tez, keyin sekinroq
--  ko'tariladi. 250 XP — 2-daraja, 1000 — 3-daraja, 2250 — 4-daraja…
-- ---------------------------------------------------------------------------

create or replace function public.level_of(p_xp integer)
returns integer
language sql immutable as $$
  select greatest(1, floor(sqrt(greatest(0, p_xp) / 250.0))::int + 1);
$$;

/** Keyingi darajagacha qancha XP kerak. */
create or replace function public.xp_for_level(p_level integer)
returns integer
language sql immutable as $$
  select (greatest(1, p_level) - 1) * (greatest(1, p_level) - 1) * 250;
$$;

-- ---------------------------------------------------------------------------
--  XP berish
--
--  Bir vaqtda streak ham yangilanadi:
--    - bugun allaqachon o'ynagan bo'lsa — o'zgarmaydi;
--    - kecha o'ynagan bo'lsa — bir kunga oshadi;
--    - tanaffus bo'lsa — 1 dan boshlanadi.
-- ---------------------------------------------------------------------------

create or replace function public.award_xp(p_amount integer)
returns table (xp integer, level integer, streak_days integer, leveled_up boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_profile   public.profiles%rowtype;
  v_old_level integer;
  v_new_xp    integer;
  v_new_level integer;
  v_streak    integer;
  v_last      date;
begin
  select p.* into v_profile from public.profiles p where p.id = auth.uid();
  if not found then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  v_old_level := public.level_of(v_profile.xp);
  v_new_xp    := greatest(0, v_profile.xp + greatest(0, coalesce(p_amount, 0)));
  v_new_level := public.level_of(v_new_xp);

  v_last := (v_profile.last_active at time zone 'UTC')::date;
  if v_last is null then
    v_streak := 1;
  elsif v_last = current_date then
    v_streak := greatest(1, v_profile.streak_days);
  elsif v_last = current_date - 1 then
    v_streak := greatest(1, v_profile.streak_days) + 1;
  else
    v_streak := 1;
  end if;

  update public.profiles p
  set xp = v_new_xp,
      level = v_new_level,
      streak_days = v_streak,
      last_active = now()
  where p.id = auth.uid();

  -- 10 kunlik streak nishoni avtomatik beriladi
  if v_streak >= 10 then
    perform public.grant_achievement('streak_10');
  end if;

  return query select v_new_xp, v_new_level, v_streak, v_new_level > v_old_level;
end $$;

grant execute on function public.award_xp(integer) to authenticated;

-- ---------------------------------------------------------------------------
--  Nishonlar
-- ---------------------------------------------------------------------------

create or replace function public.grant_achievement(p_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_id      uuid;
  v_existed boolean;
begin
  select a.id into v_id from public.achievements a where a.code = p_code;
  if v_id is null then
    return false;
  end if;

  select exists (
    select 1 from public.user_achievements ua
    where ua.user_id = auth.uid() and ua.achievement_id = v_id
  ) into v_existed;

  if v_existed then
    return false;
  end if;

  insert into public.user_achievements (user_id, achievement_id)
  values (auth.uid(), v_id)
  on conflict do nothing;

  return true;
end $$;

grant execute on function public.grant_achievement(text) to authenticated;

/** Mening nishonlarim + hali olinmaganlari. */
create or replace function public.my_achievements()
returns table (code text, title text, description text, icon text, earned_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.code, a.title, a.description, a.icon, ua.earned_at
  from public.achievements a
  left join public.user_achievements ua
    on ua.achievement_id = a.id and ua.user_id = auth.uid()
  order by (ua.earned_at is null), ua.earned_at desc nulls last, a.code;
$$;

grant execute on function public.my_achievements() to authenticated;

-- ---------------------------------------------------------------------------
--  Sinf reytingi
--
--  O'quvchi o'z sinfidagilarni, o'qituvchi esa o'zi yuritadigan sinflarni
--  ko'radi. Boshqa sinflar ochilmaydi.
-- ---------------------------------------------------------------------------

create or replace function public.class_leaderboard(p_class uuid default null)
returns table (
  student_id  uuid,
  full_name   text,
  xp          integer,
  level       integer,
  streak_days integer,
  class_name  text
)
language sql stable security definer set search_path = public as $$
  select pr.id, pr.full_name, pr.xp, pr.level, pr.streak_days, c.name
  from public.class_students cs
  join public.classes c  on c.id = cs.class_id
  join public.profiles pr on pr.id = cs.student_id
  where (p_class is null or cs.class_id = p_class)
    and (
      c.teacher_id = auth.uid()
      or exists (
        select 1 from public.class_students mine
        where mine.class_id = cs.class_id and mine.student_id = auth.uid()
      )
    )
  order by pr.xp desc, pr.full_name
  limit 100;
$$;

grant execute on function public.class_leaderboard(uuid) to authenticated;
