"use client";

import { getBrowserClient } from "@/lib/supabase/client";

/**
 * Kanal ochish — o'qituvchi uchun.
 *
 * Sinf kanali har sinf uchun bitta bo'ladi: qayta chaqirilsa yangi kanal
 * yaratilmaydi, mavjudining raqami qaytadi.
 */

export async function classChannel(classId: string): Promise<string | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("class_channel", { p_class: classId });
  return error ? null : (data as unknown as string);
}

/** Havola orqali ochiladigan kanal. Mehmonlar ro'yxatdan o'tmasdan yozadi. */
export async function openChannel(title: string): Promise<{ id: string; slug: string } | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("open_channel", { p_title: title });
  if (error) return null;
  const row = (data as unknown as { id: string; slug: string }[] | null)?.[0];
  return row ?? null;
}

/** Tartib buzgan mehmonni bloklash. Xabarlari ham yopiladi. */
export async function blockGuest(channelId: string, guestId: string): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { data, error } = await supabase.rpc("block_guest", {
    p_channel: channelId,
    p_guest: guestId,
  });
  return !error && data === true;
}
