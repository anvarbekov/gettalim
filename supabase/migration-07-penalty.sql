-- ============================================================================
--  GETTALIM — migratsiya 07: xato javob uchun jarima
--
--  Muammo: reyting faqat to'plangan ball bo'yicha tuzilardi va xato javob
--  0 ball berardi. Natijada tez-tez javob berib ko'p xato qilgan o'quvchi
--  ehtiyotkorlik bilan ishlagandan yuqorida turib qolardi.
--
--  Yechim: har bir xato javob **25 ball** ayiradi. Ball noldan pastga
--  tushmaydi — bola o'yindan butunlay tushib qolmasligi uchun.
--
--  Shu bilan tanlov aniq bo'ladi: bilmasang, tavakkal qilma.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

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

  -- To'g'ri javob: 100 ball + tezlik uchun 50 gacha qo'shimcha
  -- Xato javob: 25 ball jarima
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

grant execute on function public.submit_answer(uuid, text, text, boolean, integer) to anon, authenticated;
