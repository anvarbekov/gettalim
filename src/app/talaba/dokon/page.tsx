"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { SiteHeader } from "@/components/SiteHeader";
import { sfx } from "@/lib/sound";
import { KIND_LABEL, buyItem, equipItem, fetchShop, type ShopItem, type ShopKind } from "@/lib/gamification/shop";
import { cn } from "@/lib/utils";

/**
 * XP do'koni.
 *
 * XP shunchaki raqam bo'lib qolmasligi kerak — bola uni biror narsaga
 * almashtira olsa, ball ma'no kasb etadi. Sotib olingan narsa ro'yxatda
 * qoladi, «kiyish» esa bir turdan faqat bittasini faol qiladi.
 */
export default function ShopPage() {
  const { cloud, loading, profile, user, refresh } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [xp, setXp] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setItems(await fetchShop());
  }, []);

  useEffect(() => {
    if (cloud && user) void load();
  }, [cloud, user, load]);

  useEffect(() => {
    setXp(profile?.xp ?? 0);
  }, [profile?.xp]);

  const grouped = useMemo(() => {
    const map = new Map<ShopKind, ShopItem[]>();
    items.forEach((item) => {
      const list = map.get(item.kind) ?? [];
      list.push(item);
      map.set(item.kind, list);
    });
    return [...map.entries()];
  }, [items]);

  const buy = async (item: ShopItem) => {
    setBusy(item.id);
    const result = await buyItem(item.id);
    setBusy(null);
    setNotice({ ok: result.ok, text: result.message });
    setTimeout(() => setNotice(null), 3000);
    if (result.ok) {
      setXp(result.xp);
      sfx.win();
      await load();
      await refresh();
    } else {
      sfx.wrong();
    }
  };

  const equip = async (item: ShopItem) => {
    setBusy(item.id);
    const ok = await equipItem(item.id);
    setBusy(null);
    if (ok) {
      sfx.correct();
      await load();
    }
  };

  if (!cloud) return <CloudDisabled title="Do'kon uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/talaba" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Kabinet
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">XP do'koni</h1>
            <p className="mt-1 text-ink-mute">
              To'plagan ballingizga avatar, poyga ko'rinishi va unvon oling.
            </p>
          </div>

          <span className="flex items-center gap-2 rounded-xl2 bg-[#7a3fd0] px-4 py-2.5 text-lg font-extrabold text-white shadow-lift">
            <Sparkles className="h-5 w-5" /> {xp} XP
          </span>
        </div>

        {notice ? (
          <p
            className={cn(
              "animate-pop-in mt-4 rounded-xl2 border-2 px-4 py-2.5 text-sm font-bold",
              notice.ok
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-amber-300 bg-amber-50 text-amber-900",
            )}
          >
            {notice.text}
          </p>
        ) : null}

        {items.length === 0 ? (
          <p className="surface mt-6 p-10 text-center text-ink-mute">
            Do'kon bo'sh. Migratsiya bajarilganini tekshiring.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {grouped.map(([kind, list]) => (
              <section key={kind}>
                <h2 className="eyebrow mb-3">{KIND_LABEL[kind] ?? kind}</h2>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((item) => {
                    const affordable = xp >= item.price;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "surface flex flex-col items-center gap-2 p-5 text-center transition",
                          item.equipped && "border-2 border-[#7a3fd0]",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-16 w-16 place-items-center rounded-2xl text-4xl",
                            item.owned ? "bg-[#7a3fd0]/10" : "bg-paper",
                            !item.owned && !affordable && "opacity-45",
                          )}
                        >
                          {item.emoji}
                        </span>

                        <span className="font-extrabold text-ink">{item.title}</span>

                        {item.owned ? (
                          item.equipped ? (
                            <span className="flex items-center gap-1.5 rounded-xl bg-[#7a3fd0] px-3.5 py-2 text-sm font-extrabold text-white">
                              <Check className="h-4 w-4" strokeWidth={3} /> Kiyilgan
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => equip(item)}
                              disabled={busy === item.id}
                              className="rounded-xl border-2 border-paper-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-paper disabled:opacity-50"
                            >
                              Kiyish
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => buy(item)}
                            disabled={!affordable || busy === item.id}
                            className={cn(
                              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-extrabold transition",
                              affordable
                                ? "bg-ink text-white hover:bg-ink-soft"
                                : "bg-paper text-ink-mute",
                            )}
                          >
                            {affordable ? null : <Lock className="h-3.5 w-3.5" />}
                            {item.price} XP
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}

        <p className="mt-8 rounded-xl2 border-2 border-paper-line bg-paper/50 px-5 py-4 text-sm leading-relaxed text-ink-soft">
          XP musobaqada qatnashganingiz va uy vazifasini bajarganingiz uchun beriladi.
          Sotib olingan narsa doim sizda qoladi — faqat XP kamayadi.
        </p>
      </main>
    </div>
  );
}
