-- ============================================================================
--  GETTALIM — migratsiya 08: paketlar ko'rinishini boshqarish
--
--  Muammo: o'quvchi ilovaga kirsa, barcha savol paketlarini ko'rar edi —
--  boshqa fanlar ham. O'qituvchi esa faqat informatika darsini olib boradi.
--
--  Yechim: o'qituvchi qaysi paketlar o'quvchilarga ko'rinishini o'zi
--  belgilaydi. Ro'yxat sinfga biriktiriladi, chunki turli sinflarda turli
--  mavzular o'tilishi mumkin.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

-- Sinfga ko'rinadigan paketlar ro'yxati.
-- `null` — cheklov yo'q (hamma narsa ko'rinadi).
-- Bo'sh massiv — hech narsa ko'rinmaydi.
alter table public.classes add column if not exists visible_packs text[];

-- ---------------------------------------------------------------------------
--  O'qituvchi ro'yxatni yangilaydi
-- ---------------------------------------------------------------------------

create or replace function public.set_visible_packs(p_class uuid, p_packs text[])
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.classes c where c.id = p_class and c.teacher_id = auth.uid()
  ) then
    raise exception 'NOT_ALLOWED';
  end if;

  update public.classes c set visible_packs = p_packs where c.id = p_class;
end $$;

grant execute on function public.set_visible_packs(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
--  O'quvchi o'z sinfiga ruxsat etilgan ro'yxatni oladi
--
--  O'quvchi bir nechta sinfda bo'lsa, ro'yxatlar birlashtiriladi.
--  Birorta sinfda cheklov qo'yilmagan bo'lsa, cheklov umuman qo'llanmaydi.
-- ---------------------------------------------------------------------------

create or replace function public.my_visible_packs()
returns table (unlimited boolean, packs text[])
language plpgsql security definer set search_path = public as $$
declare
  v_unlimited boolean;
  v_packs     text[];
begin
  select
    bool_or(c.visible_packs is null),
    coalesce(array_agg(distinct p) filter (where p is not null), '{}')
  into v_unlimited, v_packs
  from public.class_students cs
  join public.classes c on c.id = cs.class_id
  left join lateral unnest(c.visible_packs) as p on true
  where cs.student_id = auth.uid() and not c.archived;

  -- Umuman sinfda bo'lmasa — cheklov yo'q
  if v_unlimited is null then
    return query select true, '{}'::text[];
  end if;

  return query select coalesce(v_unlimited, false), coalesce(v_packs, '{}'::text[]);
end $$;

grant execute on function public.my_visible_packs() to authenticated;
