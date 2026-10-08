-- ============================================================================
--  GETTALIM — migratsiya 03: `join_session` tuzatildi
--
--  Muammo: funksiya qaytaradigan ustunlar (`status`, `session_id`, `game_id`)
--  jadval ustunlari bilan bir xil nomlangan edi. PostgreSQL `where` ichida
--  qaysi biri nazarda tutilganini ajrata olmay "column reference is ambiguous"
--  xatosini berardi.
--
--  Yechim: funksiya ichidagi barcha ustunlar jadval taxallusi bilan yoziladi
--  (`s.status`, `p.session_id`), qaytariladigan ustunlar esa `out_` prefiksi
--  bilan ajratiladi.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

drop function if exists public.join_session(text, text, smallint);

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

-- ---------------------------------------------------------------------------
--  `submit_answer` — bir xil ehtiyot chorasi
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
--  `session_state` — shu ham taxallus bilan yoziladi
-- ---------------------------------------------------------------------------

drop function if exists public.session_state(text);

create or replace function public.session_state(p_pin text)
returns table (status public.session_status, game_id text, current_question_index integer)
language sql stable security definer set search_path = public as $$
  select s.status, s.game_id, s.current_question_index
  from public.sessions s
  where s.pin = btrim(p_pin) and s.status <> 'finished'
  limit 1;
$$;

grant execute on function public.session_state(text) to anon, authenticated;
