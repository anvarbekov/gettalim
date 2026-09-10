import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/** Mijoz tipi kutubxonadan olinadi — versiya o'zgarsa ham mos qoladi. */
export type GettalimClient = ReturnType<typeof createBrowserClient<Database>>;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase sozlanganmi? Sozlanmagan bo'lsa doska rejimi baribir ishlaydi. */
export const isCloudEnabled = () => Boolean(url && key && !url.includes("xxxxxxxx"));

let browserClient: GettalimClient | null = null;

/**
 * Brauzer uchun mijoz. Sessiya cookie'da saqlanadi, shuning uchun server
 * komponentlari ham foydalanuvchini ko'radi.
 */
export function getBrowserClient(): GettalimClient | null {
  if (!isCloudEnabled()) return null;
  if (!browserClient) browserClient = createBrowserClient<Database>(url!, key!);
  return browserClient;
}

/**
 * Sessiyani saqlamaydigan vaqtinchalik mijoz.
 * O'qituvchi o'quvchi hisobini yaratayotganda kerak — aks holda `signUp`
 * o'qituvchining o'z sessiyasini almashtirib yuboradi.
 */
export function createEphemeralClient(): GettalimClient | null {
  if (!isCloudEnabled()) return null;
  return createBrowserClient<Database>(url!, key!, {
    isSingleton: false,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
