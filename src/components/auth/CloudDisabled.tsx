"use client";

import Link from "next/link";
import { CloudOff } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

/**
 * Supabase kalitlari qo'yilmaganda ko'rinadigan ekran.
 * Doska rejimi bunga umuman bog'liq emas, shuning uchun asosiy taklif —
 * o'yinni doskada davom ettirish.
 */
export function CloudDisabled({ title }: { title: string }) {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-paper text-ink-mute">
          <CloudOff className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
        <p className="mt-3 text-pretty leading-relaxed text-ink-soft">
          Bu bo'lim uchun bulut ulanishi kerak. <code className="rounded bg-paper px-1.5 py-0.5">.env.local</code>{" "}
          faylida <code className="rounded bg-paper px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> va{" "}
          <code className="rounded bg-paper px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ni to'ldiring,
          so'ng <code className="rounded bg-paper px-1.5 py-0.5">supabase/schema.sql</code> ni ishga tushiring.
        </p>
        <p className="mt-3 text-sm text-ink-mute">
          Doska rejimi bulutsiz ham to'liq ishlaydi — o'yinlarni hoziroq boshlashingiz mumkin.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/">
            <Button variant="dark">Bosh sahifa</Button>
          </Link>
          <Link href="/arqon">
            <Button variant="outline">Doskada o'ynash</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
