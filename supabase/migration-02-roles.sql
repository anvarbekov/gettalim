-- ============================================================================
--  GETTALIM — qo'shimcha migratsiya (Sprint 3b)
--
--  `supabase/schema.sql` ni ishga tushirgandan keyin shuni ham bajaring.
--  Fayl idempotent — qayta ishga tushirsa bo'ladi.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  Rolni o'zboshimchalik bilan ko'tarishning oldini olish
--
--  `profiles` da foydalanuvchi o'z satrini yangilay oladi (ism o'zgartirish
--  uchun kerak), lekin o'quvchi o'zini o'qituvchi qilib qo'ymasligi shart.
--  O'quvchilarning pochtasi sintetik (@gettalim.local) — ular uchun rolni
--  o'zgartirish taqiqlanadi.
-- ---------------------------------------------------------------------------

create or replace function public.guard_role_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  addr text;
begin
  if new.role is distinct from old.role then
    select u.email into addr from auth.users u where u.id = new.id;
    if coalesce(addr, '') like '%@gettalim.local' then
      raise exception 'ROLE_CHANGE_NOT_ALLOWED';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_role_change();
