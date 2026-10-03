-- ============================================================================
--  GETTALIM — migratsiya 13: Chat
--
--  To'rt xil kanal bor:
--    class  — sinf kanali, sinfdagi hamma yozadi va o'qiydi
--    dm     — ikki kishilik yozishma (o'qituvchi↔o'quvchi yoki o'quvchi↔o'quvchi)
--    lesson — dars davomida ochiladigan vaqtinchalik kanal, dars tugagach yopiladi
--    open   — havola orqali ochiladigan kanal: ro'yxatdan o'tmasdan yozish mumkin
--
--  Mehmonlar haqida
--  ----------------
--  «Ro'yxatdan o'tmasdan yozish» maktabda xavfli bo'lishi mumkin: kim
--  yozganini bilmasangiz, tartibni saqlab bo'lmaydi. Shuning uchun mehmon
--  butunlay anonim emas: u ism yozadi va brauzerida barqaror `guest_id`
--  saqlanadi. O'qituvchi har bir xabarni ko'radi, o'chira oladi va kerak
--  bo'lsa o'sha mehmonni bloklaydi.
--
--  Ishga tushirish: Supabase → SQL Editor → shu faylni to'liq qo'yib "Run".
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1. Kanallar
-- ---------------------------------------------------------------------------

create table if not exists public.chat_channels (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,                    -- class | dm | lesson | open
  title      text,
  class_id   uuid references public.classes (id) on delete cascade,
  lesson_id  uuid references public.lessons (id) on delete cascade,
  owner_id   uuid references public.profiles (id) on delete set null,
  -- Havola orqali kirish kaliti (open kanallar uchun)
  slug       text unique,
  -- Mehmonlar yoza oladimi
  allow_guests boolean not null default false,
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chat_channels_class  on public.chat_channels (class_id);
create index if not exists chat_channels_lesson on public.chat_channels (lesson_id);

-- ---------------------------------------------------------------------------
--  2. A'zolar
--
--  `dm` kanallar uchun shart; `class` kanallarda a'zolik sinf ro'yxatidan
--  kelib chiqadi, shuning uchun har bir o'quvchini qo'lda qo'shish shart emas.
-- ---------------------------------------------------------------------------

create table if not exists public.chat_members (
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  -- Oxirgi o'qilgan xabar vaqti — o'qilmaganlar sonini shundan hisoblaymiz
  read_at    timestamptz not null default now(),
  muted      boolean not null default false,
  primary key (channel_id, user_id)
);

create index if not exists chat_members_user on public.chat_members (user_id);

-- ---------------------------------------------------------------------------
--  3. Xabarlar
--
--  Media fayllar bazada emas, tashqi xotirada (Cloudinary) turadi — bu yerda
--  faqat havola va o'lcham saqlanadi. Sabab: baza fayl saqlash uchun emas,
--  qidirish va tartiblash uchun mo'ljallangan.
-- ---------------------------------------------------------------------------

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  -- Hisobi bor foydalanuvchi
  author_id  uuid references public.profiles (id) on delete set null,
  -- Mehmon: brauzerda saqlanadigan barqaror kalit
  guest_id   text,
  author_name text not null,
  -- text | voice | image | video | file
  kind       text not null default 'text',
  body       text,
  media_url  text,
  media_name text,
  media_size integer,
  -- Ovozli xabar uzunligi (soniya)
  duration   integer,
  reply_to   uuid references public.chat_messages (id) on delete set null,
  deleted    boolean not null default false,
  created_at timestamptz not null default now(),

  -- Muallif ham hisob, ham mehmon bo'la olmaydi
  constraint chat_messages_author check (author_id is not null or guest_id is not null)
);

create index if not exists chat_messages_channel on public.chat_messages (channel_id, created_at desc);

-- ---------------------------------------------------------------------------
--  4. Bloklangan mehmonlar
-- ---------------------------------------------------------------------------

create table if not exists public.chat_blocks (
  channel_id uuid not null references public.chat_channels (id) on delete cascade,
  guest_id   text not null,
  blocked_by uuid references public.profiles (id) on delete set null,
  blocked_at timestamptz not null default now(),
  primary key (channel_id, guest_id)
);

-- ---------------------------------------------------------------------------
--  5. Ruxsatlar
--
--  Yordamchi funksiya: shu kanalni ko'ra olamanmi?
--  `security definer` — RLS qoidasi ichida qayta RLS tekshirilmasligi uchun.
-- ---------------------------------------------------------------------------

create or replace function public.can_see_channel(p_channel uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.chat_channels c
    where c.id = p_channel and (
      -- Ochiq kanal
      c.kind = 'open'
      -- Egasi
      or c.owner_id = auth.uid()
      -- Shaxsiy yozishma a'zosi
      or exists (select 1 from public.chat_members m
                 where m.channel_id = c.id and m.user_id = auth.uid())
      -- Sinf kanali: shu sinfning o'quvchisi
      or (c.class_id is not null and exists (
            select 1 from public.class_students cs
            where cs.class_id = c.class_id and cs.student_id = auth.uid()))
      -- Sinf kanali: shu sinfning o'qituvchisi
      or (c.class_id is not null and exists (
            select 1 from public.classes k
            where k.id = c.class_id and k.teacher_id = auth.uid()))
    )
  );
$$;

grant execute on function public.can_see_channel(uuid) to anon, authenticated;

alter table public.chat_channels enable row level security;
alter table public.chat_members  enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_blocks   enable row level security;

drop policy if exists chat_channels_read on public.chat_channels;
create policy chat_channels_read on public.chat_channels
  for select using (public.can_see_channel(id));

drop policy if exists chat_channels_own on public.chat_channels;
create policy chat_channels_own on public.chat_channels
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists chat_members_self on public.chat_members;
create policy chat_members_self on public.chat_members
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists chat_members_see on public.chat_members;
create policy chat_members_see on public.chat_members
  for select using (public.can_see_channel(channel_id));

drop policy if exists chat_messages_read on public.chat_messages;
create policy chat_messages_read on public.chat_messages
  for select using (public.can_see_channel(channel_id));

-- Yozish: hisobi bor foydalanuvchi o'z nomidan yozadi
drop policy if exists chat_messages_write on public.chat_messages;
create policy chat_messages_write on public.chat_messages
  for insert with check (author_id = auth.uid() and public.can_see_channel(channel_id));

-- O'chirish: o'z xabarini yoki kanal egasi istalganini
drop policy if exists chat_messages_delete on public.chat_messages;
create policy chat_messages_delete on public.chat_messages
  for update using (
    author_id = auth.uid()
    or exists (select 1 from public.chat_channels c
               where c.id = chat_messages.channel_id and c.owner_id = auth.uid())
  );

drop policy if exists chat_blocks_owner on public.chat_blocks;
create policy chat_blocks_owner on public.chat_blocks
  for all using (
    exists (select 1 from public.chat_channels c
            where c.id = chat_blocks.channel_id and c.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
--  6. Mehmon xabarini yozish
--
--  Mehmonda `auth.uid()` yo'q, shuning uchun RLS uni o'tkazmaydi. Xabar shu
--  funksiya orqali yoziladi: u kanal ochiqligini va mehmon bloklanmaganini
--  tekshiradi.
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

-- ---------------------------------------------------------------------------
--  7. Sinf kanalini olish yoki yaratish
--
--  Har sinf uchun bitta kanal. O'qituvchi birinchi marta chatni ochganda
--  kanal o'zi yaratiladi — qo'lda sozlash shart emas.
-- ---------------------------------------------------------------------------

create or replace function public.class_channel(p_class uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id      uuid;
  v_teacher uuid;
  v_name    text;
begin
  select k.teacher_id, k.name into v_teacher, v_name
  from public.classes k where k.id = p_class;

  if v_teacher is null then
    raise exception 'CLASS_NOT_FOUND';
  end if;

  select c.id into v_id
  from public.chat_channels c
  where c.class_id = p_class and c.kind = 'class'
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  -- Faqat o'qituvchi yarata oladi
  if v_teacher <> auth.uid() then
    raise exception 'NOT_ALLOWED';
  end if;

  insert into public.chat_channels (kind, title, class_id, owner_id)
  values ('class', v_name, p_class, v_teacher)
  returning id into v_id;

  return v_id;
end $$;

grant execute on function public.class_channel(uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  8. Shaxsiy yozishmani ochish
--
--  Ikki kishi orasida bitta kanal bo'lishi kerak — kim birinchi yozganidan
--  qat'i nazar. Shuning uchun a'zolar bo'yicha qidiriladi.
-- ---------------------------------------------------------------------------

create or replace function public.dm_channel(p_other uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null or p_other = auth.uid() then
    raise exception 'BAD_TARGET';
  end if;

  select m1.channel_id into v_id
  from public.chat_members m1
  join public.chat_members m2 on m2.channel_id = m1.channel_id
  join public.chat_channels c on c.id = m1.channel_id
  where c.kind = 'dm' and m1.user_id = auth.uid() and m2.user_id = p_other
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.chat_channels (kind, owner_id) values ('dm', auth.uid())
  returning id into v_id;

  insert into public.chat_members (channel_id, user_id) values (v_id, auth.uid()), (v_id, p_other);

  return v_id;
end $$;

grant execute on function public.dm_channel(uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  9. Mening kanallarim
-- ---------------------------------------------------------------------------

create or replace function public.my_channels()
returns table (
  id       uuid,
  kind     text,
  title    text,
  last_body text,
  last_at  timestamptz,
  unread   integer
)
language sql stable security definer set search_path = public as $$
  with mine as (
    select c.id, c.kind,
      coalesce(
        c.title,
        -- Shaxsiy yozishma sarlavhasi — suhbatdoshning ismi
        (select pr.full_name
         from public.chat_members m
         join public.profiles pr on pr.id = m.user_id
         where m.channel_id = c.id and m.user_id <> auth.uid()
         limit 1),
        'Suhbat'
      ) as title,
      (select coalesce(m2.read_at, 'epoch'::timestamptz)
       from public.chat_members m2
       where m2.channel_id = c.id and m2.user_id = auth.uid()) as read_at
    from public.chat_channels c
    where not c.archived and public.can_see_channel(c.id)
  )
  select
    mi.id, mi.kind, mi.title,
    (select left(coalesce(msg.body, msg.media_name, '📎'), 80)
     from public.chat_messages msg
     where msg.channel_id = mi.id and not msg.deleted
     order by msg.created_at desc limit 1) as last_body,
    (select msg.created_at from public.chat_messages msg
     where msg.channel_id = mi.id order by msg.created_at desc limit 1) as last_at,
    (select count(*)::int from public.chat_messages msg
     where msg.channel_id = mi.id
       and not msg.deleted
       and msg.created_at > coalesce(mi.read_at, 'epoch'::timestamptz)
       and coalesce(msg.author_id, '00000000-0000-0000-0000-000000000000'::uuid) <> auth.uid()
    ) as unread
  from mine mi
  order by last_at desc nulls last;
$$;

grant execute on function public.my_channels() to authenticated;

-- ---------------------------------------------------------------------------
--  10. O'qildi deb belgilash
-- ---------------------------------------------------------------------------

create or replace function public.mark_read(p_channel uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;

  insert into public.chat_members (channel_id, user_id, read_at)
  values (p_channel, auth.uid(), now())
  on conflict (channel_id, user_id) do update set read_at = now();
end $$;

grant execute on function public.mark_read(uuid) to authenticated;

-- ---------------------------------------------------------------------------
--  11. Realtime
--
--  Yangi xabar hamma ochiq turgan oynaga darhol borishi uchun jadval
--  realtime nashriga qo'shiladi.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- ---------------------------------------------------------------------------
--  12. Ochiq kanal (havola orqali, ro'yxatsiz)
--
--  O'qituvchi kanal ochadi va havolasini beradi. Kirgan kishi faqat ismini
--  yozadi. Kanalning `slug` i tasodifiy — havolani bilmagan odam topa olmaydi.
-- ---------------------------------------------------------------------------

create or replace function public.open_channel(p_title text)
returns table (id uuid, slug text)
language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  v_slug := lower(encode(gen_random_bytes(9), 'hex'));

  insert into public.chat_channels (kind, title, owner_id, slug, allow_guests)
  values ('open', coalesce(nullif(trim(p_title), ''), 'Ochiq suhbat'), auth.uid(), v_slug, true)
  returning chat_channels.id into v_id;

  return query select v_id, v_slug;
end $$;

grant execute on function public.open_channel(text) to authenticated;

/** Havoladagi kalit bo'yicha kanalni topish — mehmon uchun ham ochiq. */
create or replace function public.channel_by_slug(p_slug text)
returns table (id uuid, title text, allow_guests boolean, archived boolean)
language sql stable security definer set search_path = public as $$
  select c.id, coalesce(c.title, 'Suhbat'), c.allow_guests, c.archived
  from public.chat_channels c
  where c.slug = p_slug and c.kind = 'open'
  limit 1;
$$;

grant execute on function public.channel_by_slug(text) to anon, authenticated;

/** Mehmon uchun xabarlarni o'qish — RLS mehmonni o'tkazmaydi. */
create or replace function public.guest_messages(p_channel uuid, p_limit integer default 80)
returns setof public.chat_messages
language sql stable security definer set search_path = public as $$
  select m.*
  from public.chat_messages m
  join public.chat_channels c on c.id = m.channel_id
  where m.channel_id = p_channel and c.kind = 'open' and c.allow_guests
  order by m.created_at desc
  limit greatest(1, least(300, coalesce(p_limit, 80)));
$$;

grant execute on function public.guest_messages(uuid, integer) to anon, authenticated;

/** Mehmonni bloklash — faqat kanal egasi. */
create or replace function public.block_guest(p_channel uuid, p_guest text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.chat_channels c
                 where c.id = p_channel and c.owner_id = auth.uid()) then
    return false;
  end if;

  insert into public.chat_blocks (channel_id, guest_id, blocked_by)
  values (p_channel, p_guest, auth.uid())
  on conflict do nothing;

  -- Bloklangan mehmonning xabarlari ham yopiladi
  update public.chat_messages m
  set deleted = true, body = null, media_url = null
  where m.channel_id = p_channel and m.guest_id = p_guest;

  return true;
end $$;

grant execute on function public.block_guest(uuid, text) to authenticated;
