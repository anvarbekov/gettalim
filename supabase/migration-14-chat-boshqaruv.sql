-- ============================================================================
--  GETTALIM — migratsiya 14: Chatni o'qituvchi boshqaradi
--
--  Nima qo'shiladi:
--    1. Chatni o'quvchilar uchun yopish/ochish:
--         - hammasini birdan (o'qituvchining barcha o'quvchilari uchun);
--         - har bir kanalni alohida.
--       Yopiq chatda o'quvchi xabarlarni o'qiydi, lekin yoza olmaydi.
--    2. Xabarlarni o'chirish: bittasini, tanlanganlarini yoki hammasini.
--       O'qituvchi o'z o'quvchilari ishtirok etgan istalgan kanalda o'chira oladi.
--    3. Stikerlar (reaksiyalar) — xabar ostiga bosiladi.
--    4. O'quvchilar orasidagi shaxsiy yozishmalarni o'qituvchi ko'radi va
--       tartibga soladi — maktab muhitida bu xavfsizlik uchun shart.
--
--  Oldin 13-migratsiya bajarilgan bo'lishi kerak.
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
--  Qayta ishga tushirish xavfsiz.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Yangi ustunlar va sozlamalar
-- ---------------------------------------------------------------------------

alter table public.chat_channels add column if not exists locked boolean not null default false;

-- Reaksiyalar xabarning o'zida: {"👍": ["user-id", ...], ...}
-- Alohida jadval emas — shunda reaksiya ham xabar bilan birga realtime orqali
-- darhol hammaga yetadi, qo'shimcha obuna kerak bo'lmaydi.
alter table public.chat_messages add column if not exists reactions jsonb not null default '{}'::jsonb;

-- O'qituvchining umumiy sozlamasi: o'quvchilari chatda yoza oladimi
create table if not exists public.chat_settings (
  teacher_id       uuid primary key references public.profiles (id) on delete cascade,
  students_enabled boolean not null default true,
  updated_at       timestamptz not null default now()
);

alter table public.chat_settings enable row level security;

drop policy if exists chat_settings_own on public.chat_settings;
create policy chat_settings_own on public.chat_settings
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

-- ---------------------------------------------------------------------------
--  2. Yordamchi funksiyalar
-- ---------------------------------------------------------------------------

/** O'qituvchi yoki administratormi. */
create or replace function public.chat_is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('teacher', 'admin')
  );
$$;

grant execute on function public.chat_is_staff() to anon, authenticated;

/** Kanalni ko'rish huquqi — 13-migratsiyadagidan farqi: o'qituvchi o'z
 *  o'quvchilarining shaxsiy yozishmalarini ham ko'radi. */
create or replace function public.can_see_channel(p_channel uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_channels c
    where c.id = p_channel and (
      c.kind = 'open'
      or c.owner_id = auth.uid()
      or exists (select 1 from public.chat_members m
                 where m.channel_id = c.id and m.user_id = auth.uid())
      or (c.class_id is not null and exists (
            select 1 from public.class_students cs
            where cs.class_id = c.class_id and cs.student_id = auth.uid()))
      or (c.class_id is not null and exists (
            select 1 from public.classes k
            where k.id = c.class_id and k.teacher_id = auth.uid()))
      -- O'qituvchi: yozishmada uning sinfidagi o'quvchi bor
      or (c.kind = 'dm' and exists (
            select 1
            from public.chat_members m
            join public.class_students cs on cs.student_id = m.user_id
            join public.classes k on k.id = cs.class_id
            where m.channel_id = c.id and k.teacher_id = auth.uid()))
    )
  );
$$;

grant execute on function public.can_see_channel(uuid) to anon, authenticated;

/** Kanalni tartibga sola oladimi (xabar o'chirish, yopish). */
create or replace function public.can_moderate_channel(p_channel uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.chat_is_staff() and public.can_see_channel(p_channel);
$$;

grant execute on function public.can_moderate_channel(uuid) to authenticated;

/** O'quvchining o'qituvchilaridan birortasi chatni yopganmi. */
create or replace function public.chat_open_for_me()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.chat_is_staff() or not exists (
    select 1
    from public.class_students cs
    join public.classes k on k.id = cs.class_id
    join public.chat_settings s on s.teacher_id = k.teacher_id
    where cs.student_id = auth.uid() and not s.students_enabled
  );
$$;

grant execute on function public.chat_open_for_me() to authenticated;

/** Kanalga yoza oladimi. */
create or replace function public.can_write_channel(p_channel uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_see_channel(p_channel) and (
    public.chat_is_staff()
    or (
      not coalesce((select c.locked from public.chat_channels c where c.id = p_channel), true)
      and public.chat_open_for_me()
    )
  );
$$;

grant execute on function public.can_write_channel(uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  3. Ruxsatlar
-- ---------------------------------------------------------------------------

drop policy if exists chat_messages_write on public.chat_messages;
create policy chat_messages_write on public.chat_messages
  for insert with check (author_id = auth.uid() and public.can_write_channel(channel_id));

-- To'g'ridan-to'g'ri o'zgartirish endi yopiq: o'chirish va reaksiya faqat
-- quyidagi funksiyalar orqali (ular huquqni tekshiradi). Aks holda o'quvchi
-- o'z xabari ostiga istagancha «reaksiya» yozib qo'yishi mumkin edi.
drop policy if exists chat_messages_delete on public.chat_messages;

-- ---------------------------------------------------------------------------
--  4. Mehmon yozishi — yopiq kanalga yoza olmaydi
-- ---------------------------------------------------------------------------

create or replace function public.guest_send(
  p_channel   uuid,
  p_guest     text,
  p_name      text,
  p_kind      text,
  p_body      text default null,
  p_media_url text default null,
  p_media_name text default null,
  p_media_size integer default null,
  p_duration  integer default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_channel public.chat_channels;
  v_id      uuid;
begin
  select * into v_channel from public.chat_channels c where c.id = p_channel;

  if v_channel.id is null or v_channel.archived then
    raise exception 'CHANNEL_NOT_FOUND';
  end if;
  if not v_channel.allow_guests then
    raise exception 'GUESTS_NOT_ALLOWED';
  end if;
  if v_channel.locked then
    raise exception 'CHANNEL_LOCKED';
  end if;
  if exists (select 1 from public.chat_blocks b
             where b.channel_id = p_channel and b.guest_id = p_guest) then
    raise exception 'BLOCKED';
  end if;
  if coalesce(trim(p_name), '') = '' then
    raise exception 'NAME_REQUIRED';
  end if;

  insert into public.chat_messages (
    channel_id, guest_id, author_name, kind, body,
    media_url, media_name, media_size, duration
  )
  values (
    p_channel, p_guest, left(trim(p_name), 40), coalesce(p_kind, 'text'),
    left(coalesce(p_body, ''), 4000),
    p_media_url, p_media_name, p_media_size, p_duration
  )
  returning id into v_id;

  return v_id;
end $$;

grant execute on function public.guest_send(uuid, text, text, text, text, text, text, integer, integer)
  to anon, authenticated;

/** Mehmon sahifasi kanal yopiqligini bilishi uchun. */
drop function if exists public.channel_by_slug(text);
create or replace function public.channel_by_slug(p_slug text)
returns table (id uuid, title text, allow_guests boolean, archived boolean, locked boolean)
language sql stable security definer set search_path = public as $$
  select c.id, coalesce(c.title, 'Suhbat'), c.allow_guests, c.archived, c.locked
  from public.chat_channels c
  where c.slug = p_slug and c.kind = 'open'
  limit 1;
$$;

grant execute on function public.channel_by_slug(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  5. Chatni yopish / ochish
-- ---------------------------------------------------------------------------

/** Bitta kanalni yopish yoki ochish. */
create or replace function public.set_channel_lock(p_channel uuid, p_locked boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.can_moderate_channel(p_channel) then
    return false;
  end if;
  update public.chat_channels set locked = p_locked where id = p_channel;
  return true;
end $$;

grant execute on function public.set_channel_lock(uuid, boolean) to authenticated;

/** O'qituvchining barcha o'quvchilari uchun chatni yopish yoki ochish. */
create or replace function public.set_students_chat(p_enabled boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not public.chat_is_staff() then
    return false;
  end if;
  insert into public.chat_settings (teacher_id, students_enabled, updated_at)
  values (auth.uid(), p_enabled, now())
  on conflict (teacher_id) do update
    set students_enabled = excluded.students_enabled, updated_at = now();
  return true;
end $$;

grant execute on function public.set_students_chat(boolean) to authenticated;

/** Joriy holat: o'qituvchi uchun — o'z sozlamasi, o'quvchi uchun — yoza oladimi. */
create or replace function public.my_chat_state()
returns table (staff boolean, students_enabled boolean, open_for_me boolean)
language sql stable security definer set search_path = public as $$
  select
    public.chat_is_staff(),
    coalesce((select s.students_enabled from public.chat_settings s where s.teacher_id = auth.uid()), true),
    public.chat_open_for_me();
$$;

grant execute on function public.my_chat_state() to authenticated;

-- ---------------------------------------------------------------------------
--  6. Xabarlarni o'chirish
--
--  p_ids = null  → kanaldagi hamma xabar (faqat o'qituvchi)
--  p_ids = [...] → tanlanganlar. O'qituvchi istalganini, boshqalar faqat
--                  o'zinikini o'chira oladi.
--
--  Xabar butunlay yo'qolmaydi, «o'chirildi» deb belgilanadi va mazmuni
--  tozalanadi — shunda o'zgarish realtime orqali hamma ekranga darhol yetadi.
-- ---------------------------------------------------------------------------

create or replace function public.delete_messages(p_channel uuid, p_ids uuid[] default null)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_mod   boolean := public.can_moderate_channel(p_channel);
  v_count integer;
begin
  if auth.uid() is null then
    return 0;
  end if;
  if p_ids is null and not v_mod then
    return 0;
  end if;

  update public.chat_messages m
  set deleted = true, body = null, media_url = null, media_name = null, reactions = '{}'::jsonb
  where m.channel_id = p_channel
    and not m.deleted
    and (p_ids is null or m.id = any (p_ids))
    and (v_mod or m.author_id = auth.uid());

  get diagnostics v_count = row_count;
  return v_count;
end $$;

grant execute on function public.delete_messages(uuid, uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
--  7. Stikerlar (reaksiyalar)
--
--  Bir xil stikerni ikkinchi marta bosish — olib tashlaydi.
-- ---------------------------------------------------------------------------

create or replace function public.react(p_message uuid, p_emoji text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_msg   public.chat_messages;
  v_uid   text := auth.uid()::text;
  v_list  jsonb;
  v_all   jsonb;
begin
  if auth.uid() is null or coalesce(length(p_emoji), 0) = 0 or length(p_emoji) > 16 then
    return null;
  end if;

  select * into v_msg from public.chat_messages where id = p_message;
  if v_msg.id is null or v_msg.deleted or not public.can_write_channel(v_msg.channel_id) then
    return null;
  end if;

  v_all  := coalesce(v_msg.reactions, '{}'::jsonb);
  v_list := coalesce(v_all -> p_emoji, '[]'::jsonb);

  if v_list ? v_uid then
    -- Olib tashlash
    v_list := (select coalesce(jsonb_agg(x), '[]'::jsonb)
               from jsonb_array_elements_text(v_list) x where x <> v_uid);
  else
    v_list := v_list || to_jsonb(v_uid);
  end if;

  if jsonb_array_length(v_list) = 0 then
    v_all := v_all - p_emoji;
  else
    v_all := jsonb_set(v_all, array[p_emoji], v_list, true);
  end if;

  update public.chat_messages set reactions = v_all where id = p_message;
  return v_all;
end $$;

grant execute on function public.react(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
--  8. Kimga yozish mumkin (yangi suhbat ochish uchun)
--
--  O'quvchi: sinfdoshlari va o'qituvchisi. O'qituvchi: o'z o'quvchilari.
-- ---------------------------------------------------------------------------

create or replace function public.chat_contacts()
returns table (id uuid, full_name text, role text, class_name text)
language sql stable security definer set search_path = public as $$
  select distinct on (t.id) t.id, t.full_name, t.role, t.class_name
  from (
    -- O'qituvchi uchun: o'z sinflaridagi o'quvchilar
    select p.id, p.full_name, p.role::text as role, k.name as class_name
    from public.classes k
    join public.class_students cs on cs.class_id = k.id
    join public.profiles p on p.id = cs.student_id
    where k.teacher_id = auth.uid()

    union all

    -- O'quvchi uchun: sinfdoshlar
    select p.id, p.full_name, p.role::text, k.name
    from public.class_students me
    join public.classes k on k.id = me.class_id
    join public.class_students cs on cs.class_id = k.id
    join public.profiles p on p.id = cs.student_id
    where me.student_id = auth.uid() and cs.student_id <> auth.uid()

    union all

    -- O'quvchi uchun: o'qituvchisi
    select p.id, p.full_name, p.role::text, k.name
    from public.class_students me
    join public.classes k on k.id = me.class_id
    join public.profiles p on p.id = k.teacher_id
    where me.student_id = auth.uid()
  ) t
  order by t.id, t.full_name;
$$;

grant execute on function public.chat_contacts() to authenticated;

-- ---------------------------------------------------------------------------
--  9. Mening kanallarim — yopiqligi, yoza olishim va «nazoratdagi»
--     yozishmalar bilan
-- ---------------------------------------------------------------------------

drop function if exists public.my_channels();

create or replace function public.my_channels()
returns table (
  id        uuid,
  kind      text,
  title     text,
  last_body text,
  last_at   timestamptz,
  unread    integer,
  locked    boolean,
  can_write boolean,
  watching  boolean
)
language sql stable security definer set search_path = public as $$
  with mine as (
    select c.id, c.kind, c.locked,
      -- Men a'zo bo'lmagan shaxsiy yozishma — o'qituvchi nazorati
      (c.kind = 'dm' and not exists (
         select 1 from public.chat_members m0
         where m0.channel_id = c.id and m0.user_id = auth.uid())) as watching,
      (select m2.read_at from public.chat_members m2
       where m2.channel_id = c.id and m2.user_id = auth.uid()) as read_at,
      c.title as own_title
    from public.chat_channels c
    where not c.archived and public.can_see_channel(c.id)
  )
  select
    mi.id,
    mi.kind,
    coalesce(
      mi.own_title,
      case
        when mi.watching then
          (select string_agg(pr.full_name, ' ↔ ' order by pr.full_name)
           from public.chat_members m
           join public.profiles pr on pr.id = m.user_id
           where m.channel_id = mi.id)
        else
          (select pr.full_name
           from public.chat_members m
           join public.profiles pr on pr.id = m.user_id
           where m.channel_id = mi.id and m.user_id <> auth.uid()
           limit 1)
      end,
      'Suhbat'
    ) as title,
    (select left(
       case msg.kind when 'sticker' then '🎨 Stiker'
                     when 'voice' then '🎤 Ovozli xabar'
                     else coalesce(msg.body, msg.media_name, '📎') end, 80)
     from public.chat_messages msg
     where msg.channel_id = mi.id and not msg.deleted
     order by msg.created_at desc limit 1) as last_body,
    (select msg.created_at from public.chat_messages msg
     where msg.channel_id = mi.id and not msg.deleted
     order by msg.created_at desc limit 1) as last_at,
    case when mi.watching then 0 else
      (select count(*)::int from public.chat_messages msg
       where msg.channel_id = mi.id
         and not msg.deleted
         and msg.created_at > coalesce(mi.read_at, 'epoch'::timestamptz)
         and coalesce(msg.author_id, '00000000-0000-0000-0000-000000000000'::uuid) <> auth.uid())
    end as unread,
    mi.locked,
    public.can_write_channel(mi.id) as can_write,
    mi.watching
  from mine mi
  order by mi.watching, last_at desc nulls last;
$$;

grant execute on function public.my_channels() to authenticated;
