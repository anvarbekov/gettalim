import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isCloudEnabledServer = () => Boolean(url && key && !url.includes("xxxxxxxx"));

/**
 * Server komponentlari va route handler'lar uchun mijoz.
 * Sessiyani cookie'dan oladi, shuning uchun RLS to'g'ri ishlaydi.
 */
export function getServerClient() {
  if (!isCloudEnabledServer()) return null;
  const store = cookies();

  return createServerClient<Database>(url!, key!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server komponentidan cookie yozib bo'lmaydi — middleware buni o'zi yangilaydi.
        }
      },
    },
  });
}
