"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase/client";
import { getAllPacks } from "@/lib/storage";
import type { Pack } from "@/lib/types";

/**
 * Paketlar ko'rinishini boshqarish.
 *
 * Qoida sodda: **o'quvchi sukut bo'yicha faqat informatika paketlarini
 * ko'radi.** Boshqa fanlar (matematika, tarix, biologiya…) o'qituvchi ularni
 * ataylab ochmaguncha umuman ko'rinmaydi.
 *
 * Ilgari teskari edi: sinfga ro'yxat qo'yilmagan bo'lsa «cheklov yo'q» deb
 * hisoblanardi va bola hamma fanni ko'rardi. Yangi sinf ochilganda esa ro'yxat
 * doim bo'sh bo'ladi — ya'ni amalda hech qachon cheklanmasdi.
 *
 * Cheklov faqat **o'quvchiga** tegishli. O'qituvchi va tizimga kirmagan
 * foydalanuvchi (doska rejimi) hamma paketni ko'raveradi — aks holda darsga
 * tayyorgarlik ko'rish qiyin bo'lardi.
 */

/**
 * O'qituvchining o'z fani. Sukut bo'yicha o'quvchiga faqat shu fanlar
 * ko'rinadi.
 */
export const OWN_SUBJECTS = ["Informatika va AT", "Raqamli savodxonlik"];

/**
 * Paket o'z fanimizgami?
 *
 * Aniq moslik emas, **ichida bormi** deb qaraladi. Sabab: o'qituvchi o'zi
 * paket yaratganda fan nomini har xil yozishi mumkin — «Informatika»,
 * «informatika 7-sinf», «Informatika va AT». Aniq moslik talab qilinsa,
 * bunday paketlar o'quvchidan yashirinib qolardi va buni topish qiyin bo'lardi.
 */
export function isOwnSubject(subject: string): boolean {
  const s = (subject ?? "").toLocaleLowerCase("uz");
  if (s.includes("informatika")) return true;
  if (s.includes("raqamli savodxonlik")) return true;
  if (s.includes("axborot texnologiya")) return true;
  return OWN_SUBJECTS.some((own) => own.toLocaleLowerCase("uz") === s);
}

export interface Allowance {
  /** O'qituvchi ro'yxat qo'ymagan — sukut bo'yicha qoida ishlaydi. */
  unset: boolean;
  /** O'qituvchi ochgan paketlar. */
  packs: string[];
}

/** Ro'yxat bir marta olinadi va sahifalar orasida saqlanadi. */
let cached: Allowance | null = null;

export async function setVisiblePacks(classId: string, packIds: string[] | null): Promise<boolean> {
  const supabase = getBrowserClient();
  if (!supabase) return false;
  const { error } = await supabase.rpc("set_visible_packs", { p_class: classId, p_packs: packIds });
  if (!error) cached = null; // keyingi o'qishda yangisi olinadi
  return !error;
}

export async function fetchAllowance(): Promise<Allowance | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("my_visible_packs");
  if (error) return null;
  const row = (data as unknown as { unlimited: boolean; packs: string[] }[] | null)?.[0];
  if (!row) return null;
  // Bazadagi `unlimited` — «sinfga ro'yxat qo'yilmagan» degani.
  return { unset: !!row.unlimited, packs: row.packs ?? [] };
}

/**
 * Paketlarni o'quvchi uchun saralaydi.
 *
 * `allowance` hali kelmagan bo'lsa ham **cheklangan** ro'yxat qaytadi:
 * sahifa ochilishida boshqa fanlar bir lahzaga bo'lsa ham ko'rinib ketmasligi
 * kerak.
 */
export function filterForStudent(all: Pack[], allowance: Allowance | null): Pack[] {
  if (!allowance || allowance.unset) {
    return all.filter((p) => isOwnSubject(p.subject));
  }
  const open = new Set(allowance.packs);
  return all.filter((p) => open.has(p.id) || isOwnSubject(p.subject));
}

/**
 * Foydalanuvchiga ko'rinadigan paketlar.
 *
 * O'qituvchi va mehmon — hammasi. O'quvchi — informatika, ustiga o'qituvchi
 * ochgan paketlar.
 */
export function useAvailablePacks(): { packs: Pack[]; loading: boolean } {
  const { cloud, role, user } = useAuth();
  const [all, setAll] = useState<Pack[]>([]);
  const [allowance, setAllowance] = useState<Allowance | null>(cached);
  const [loading, setLoading] = useState(false);
  const asked = useRef(false);

  // Paketlar `localStorage` dan ham o'qiladi, shuning uchun faqat brauzerda
  useEffect(() => {
    setAll(getAllPacks());
  }, []);

  useEffect(() => {
    if (role !== "student" || !cloud || !user) return;
    if (cached) {
      setAllowance(cached);
      return;
    }
    if (asked.current) return;
    asked.current = true;
    setLoading(true);
    void fetchAllowance().then((result) => {
      cached = result;
      setAllowance(result);
      setLoading(false);
    });
  }, [cloud, role, user]);

  const packs = useMemo(() => {
    if (role !== "student") return all;
    return filterForStudent(all, allowance);
  }, [all, allowance, role]);

  return { packs, loading };
}

/** Chiqishda keshni tozalash — boshqa hisob boshqa ro'yxat ko'radi. */
export function clearAllowanceCache() {
  cached = null;
}
