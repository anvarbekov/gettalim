"use client";

import { getBrowserClient } from "@/lib/supabase/client";

/**
 * Chat mijozi.
 *
 * Xabarlar Supabase Realtime orqali darhol keladi — sahifani yangilash yoki
 * har soniyada so'rov yuborish shart emas.
 */

export type MessageKind = "text" | "voice" | "image" | "video" | "file" | "sticker";
export type ChannelKind = "class" | "dm" | "lesson" | "open";

/** Stiker → uni bosganlar ro'yxati. */
export type Reactions = Record<string, string[]>;

export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string | null;
  guestId: string | null;
  authorName: string;
  kind: MessageKind;
  body: string | null;
  mediaUrl: string | null;
  mediaName: string | null;
  mediaSize: number | null;
  duration: number | null;
  replyTo: string | null;
  deleted: boolean;
  reactions: Reactions;
  createdAt: string;
}

export interface ChatChannel {
  id: string;
  kind: ChannelKind;
  title: string;
  lastBody: string | null;
  lastAt: string | null;
  unread: number;
  /** Kanal o'qituvchi tomonidan yopilgan. */
  locked: boolean;
  /** Men shu kanalga yoza olamanmi (yopiq kanal yoki umumiy yopiq chat hisobga olingan). */
  canWrite: boolean;
  /** O'quvchilar yozishmasi — o'qituvchi faqat kuzatadi. */
  watching: boolean;
}

type Row = {
  id: string;
  channel_id: string;
  author_id: string | null;
  guest_id: string | null;
  author_name: string;
  kind: string;
  body: string | null;
  media_url: string | null;
  media_name: string | null;
  media_size: number | null;
  duration: number | null;
  reply_to: string | null;
  deleted: boolean;
  reactions?: Reactions | null;
  created_at: string;
};

export function toMessage(row: Row): ChatMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    authorId: row.author_id,
    guestId: row.guest_id,
    authorName: row.author_name,
    kind: (row.kind as MessageKind) ?? "text",
    body: row.body,
    mediaUrl: row.media_url,
    mediaName: row.media_name,
    mediaSize: row.media_size,
    duration: row.duration,
    replyTo: row.reply_to,
    deleted: row.deleted,
    reactions: row.reactions ?? {},
    createdAt: row.created_at,
  };
}

export type MessageRow = Row;

/* ------------------------------------------------------------------ */
/*  Kanallar                                                           */
/* ------------------------------------------------------------------ */

export async function fetchChannels(): Promise<ChatChannel[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("my_channels");
  if (error) return [];
  return ((data as unknown as {
    id: string;
    kind: string;
    title: string;
    last_body: string | null;
    last_at: string | null;
    unread: number;
    locked: boolean | null;
    can_write: boolean | null;
    watching: boolean | null;
  }[] | null) ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as ChannelKind,
    title: row.title,
    lastBody: row.last_body,
    lastAt: row.last_at,
    unread: row.unread ?? 0,
    locked: !!row.locked,
    // Eski bazada (14-migratsiyasiz) bu maydon yo'q — unda yozish ochiq
    canWrite: row.can_write ?? true,
    watching: !!row.watching,
  }));
}

export async function classChannel(classId: string): Promise<string | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("class_channel", { p_class: classId });
  return error ? null : (data as unknown as string);
}

export async function dmChannel(otherId: string): Promise<string | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("dm_channel", { p_other: otherId });
  return error ? null : (data as unknown as string);
}

export async function markRead(channelId: string): Promise<void> {
  const supabase = getBrowserClient();
  if (!supabase) return;
  await supabase.rpc("mark_read", { p_channel: channelId });
}

/* ------------------------------------------------------------------ */
/*  Xabarlar                                                           */
/* ------------------------------------------------------------------ */

export async function fetchMessages(channelId: string, limit = 80): Promise<ChatMessage[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  // Bazadan yangi→eski keladi, ekranda esa eski→yangi kerak
  return ((data as unknown as Row[]) ?? []).map(toMessage).reverse();
}

export interface SendInput {
  channelId: string;
  kind: MessageKind;
  body?: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: number;
  duration?: number;
  replyTo?: string | null;
  /** Mehmon bo'lsa — brauzerdagi barqaror kalit va ism. */
  guest?: { id: string; name: string };
  /** Hisobi bor foydalanuvchining ismi. */
  authorName?: string;
}

export async function sendMessage(input: SendInput): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;

  // Mehmon RLS orqali yoza olmaydi — funksiya orqali yozadi
  if (input.guest) {
    const { error } = await supabase.rpc("guest_send", {
      p_channel: input.channelId,
      p_guest: input.guest.id,
      p_name: input.guest.name,
      p_kind: input.kind,
      p_body: input.body ?? null,
      p_media_url: input.mediaUrl ?? null,
      p_media_name: input.mediaName ?? null,
      p_media_size: input.mediaSize ?? null,
      p_duration: input.duration ?? null,
    });
    return !error;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("chat_messages").insert({
    channel_id: input.channelId,
    author_id: user.id,
    author_name: input.authorName ?? "Foydalanuvchi",
    kind: input.kind,
    body: input.body ?? null,
    media_url: input.mediaUrl ?? null,
    media_name: input.mediaName ?? null,
    media_size: input.mediaSize ?? null,
    duration: input.duration ?? null,
    reply_to: input.replyTo ?? null,
  });
  return !error;
}

/**
 * Xabarlarni o'chirish.
 *
 * `ids = null` — kanaldagi hamma xabar (faqat o'qituvchi). O'qituvchi istalgan
 * xabarni, boshqalar faqat o'zinikini o'chira oladi — buni baza tekshiradi.
 * Qaytadi: nechta xabar o'chirildi.
 */
export async function deleteMessages(channelId: string, ids: string[] | null): Promise<number> {
  const supabase = getBrowserClient();
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc("delete_messages", {
    p_channel: channelId,
    p_ids: ids,
  });
  return error ? 0 : Number(data ?? 0);
}

/** Stiker bosish. Ikkinchi marta bosilsa — olib tashlanadi. */
export async function react(messageId: string, emoji: string): Promise<Reactions | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("react", { p_message: messageId, p_emoji: emoji });
  return error ? null : ((data as unknown as Reactions | null) ?? {});
}

/* ------------------------------------------------------------------ */
/*  O'qituvchi boshqaruvi                                              */
/* ------------------------------------------------------------------ */

export async function setChannelLock(channelId: string, locked: boolean): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("set_channel_lock", {
    p_channel: channelId,
    p_locked: locked,
  });
  return !error && data === true;
}

/** O'qituvchining barcha o'quvchilari uchun chatni yopish/ochish. */
export async function setStudentsChat(enabled: boolean): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("set_students_chat", { p_enabled: enabled });
  return !error && data === true;
}

export interface ChatState {
  staff: boolean;
  studentsEnabled: boolean;
  openForMe: boolean;
}

export async function myChatState(): Promise<ChatState> {
  const fallback = { staff: false, studentsEnabled: true, openForMe: true };
  const supabase = getBrowserClient();
  if (!supabase) return fallback;
  const { data, error } = await supabase.rpc("my_chat_state");
  const row = (data as unknown as { staff: boolean; students_enabled: boolean; open_for_me: boolean }[] | null)?.[0];
  if (error || !row) return fallback;
  return { staff: row.staff, studentsEnabled: row.students_enabled, openForMe: row.open_for_me };
}

export interface Contact {
  id: string;
  fullName: string;
  role: string;
  className: string | null;
}

/** Kimga yozish mumkin: o'quvchiga — sinfdoshlar va o'qituvchi, o'qituvchiga — o'quvchilari. */
export async function chatContacts(): Promise<Contact[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("chat_contacts");
  if (error) return [];
  return ((data as unknown as { id: string; full_name: string; role: string; class_name: string | null }[] | null) ?? [])
    .map((r) => ({ id: r.id, fullName: r.full_name, role: r.role, className: r.class_name }))
    .sort((a, b) => (a.role === b.role ? a.fullName.localeCompare(b.fullName) : a.role === "teacher" ? -1 : 1));
}

/* ------------------------------------------------------------------ */
/*  Jonli yangilanish                                                  */
/* ------------------------------------------------------------------ */

/**
 * Kanaldagi yangi xabarlarga obuna bo'ladi.
 *
 * Qaytadigan funksiya obunani bekor qiladi — komponent yopilganda chaqirilishi
 * shart, aks holda eski obunalar yig'ilib qoladi.
 */
export function subscribeMessages(
  channelId: string,
  onInsert: (message: ChatMessage) => void,
  onUpdate?: (message: ChatMessage) => void,
): () => void {
  const supabase = getBrowserClient();
  if (!supabase) return () => undefined;

  const channel = supabase
    .channel(`chat:${channelId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` },
      (payload) => onInsert(toMessage(payload.new as Row)),
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` },
      (payload) => onUpdate?.(toMessage(payload.new as Row)),
    );

  void channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
