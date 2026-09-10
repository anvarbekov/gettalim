"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase/client";
import type { Pack } from "@/lib/types";

/**
 * Paketlar ko'rinishini boshqarish.
 *
 * O'qituvchi qaysi paketlar o'quvchilarga ko'rinishini belgilaydi. Ro'yxat
 * sinfga biriktiriladi — turli sinflarda turli mavzular o'tilishi mumkin.
 *
 * Cheklov faqat **o'quvchiga** qo'llanadi. O'qituvchi va mehmon rejimida
 * (doska rejimi) hamma paket ko'rinadi, aks holda darsga tayyorgarlik qiyin
 * bo'lib qolardi.
 */

export async function setVisiblePacks(classId: string, packIds: string[] | null): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.rpc("set_visible_packs", { p_class: classId, p_packs: packIds });
  return !error;
}

export async function fetchVisiblePacks(): Promise<{ unlimited: boolean; packs: string[] } | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("my_visible_packs");
  if (error) return null;
  const row = (data as unknown as { unlimited: boolean; packs: string[] }[] | null)?.[0];
  if (!row) return null;
  return { unlimited: row.unlimited, packs: row.packs ?? [] };
}

/**
 * Paketlar ro'yxatini foydalanuvchi roliga qarab filtrlaydi.
 * O'qituvchi va tizimga kirmagan foydalanuvchi hammasini ko'radi.
 */
export function useVisiblePacks(all: Pack[]): { packs: Pack[]; loading: boolean } {
  const { cloud, role, user } = useAuth();
  const [allowed, setAllowed] = useState<{ unlimited: boolean; packs: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cloud || role !== "student" || !user) {
      setAllowed(null);
      return;
    }
    setLoading(true);
    void fetchVisiblePacks().then((result) => {
      setAllowed(result);
      setLoading(false);
    });
  }, [cloud, role, user]);

  if (role !== "student" || !allowed || allowed.unlimited) return { packs: all, loading };
  return { packs: all.filter((p) => allowed.packs.includes(p.id)), loading };
}
