"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { SiteHeader } from "@/components/SiteHeader";
import { AvatarBadge, THEMES } from "@/components/gamification/Cosmetics";
import { sfx } from "@/lib/sound";
import {
  CLAIM_LABEL,
  KIND_HINT,
  KIND_LABEL,
  KIND_ORDER,
  buyItem,
  equipItem,
  fetchMyClaims,
  fetchShop,
  type Claim,
  type ShopItem,
  type ShopKind,
} from "@/lib/gamification/shop";
import { cn } from "@/lib/utils";

/**
 * XP do'koni.
 *
 * Narxlar ataylab past: bitta darsda 60–120 XP to'planadi, ya'ni eng arzon
 * narsani birinchi darsdayoq olsa bo'ladi. Eng kuchli narsalar esa XP bilan
 * emas, daraja bilan ham qulflangan — shunchaki ball yig'ib turish emas,
 * o'ynash kerak.
 */
export default function ShopPage() {
  const { cloud, loading, profile, user, refresh } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [xp, setXp] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<ShopKind>("reward");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const level = profile?.level ?? 1;

  const load = useCallback(async () => {
    const [shop, mine] = await Promise.all([fetchShop(), fetchMyClaims()]);
    setItems(shop);
    setClaims(mine);
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
    return map;
  }, [items]);

  const tabs = useMemo(() => KIND_ORDER.filter((kind) => (grouped.get(kind)?.length ?? 0) > 0), [grouped]);

  useEffect(() => {
    if (tabs.length && !tabs.includes(tab)) setTab(tabs[0]);
  }, [tabs, tab]);

  const say = (ok: boolean, text: string) => {
    setNotice({ ok, text });
    setTimeout(() => setNotice(null), 3200);
  };

  const buy = async (item: ShopItem) => {
    setBusy(item.id);
    const result = await buyItem(item.id);
    setBusy(null);
    say(result.ok, result.message);
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

  const list = grouped.get(tab) ?? [];

  return (
    <div className="min-h-dvh">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/talaba" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Kabinet
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">XP do'koni</h1>
            <p className="mt-1 text-ink-mute">
              Kuchaytirgich, avatar, ramka, effekt va unvonlar — hammasi o'yinda ko'rinadi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-xl2 bg-[#7a3fd0] px-4 py-2.5 text-lg font-extrabold text-white shadow-lift">
              <Sparkles className="h-5 w-5" /> {xp} XP
            </span>
            <span className="rounded-xl2 border-2 border-paper-line bg-white px-3.5 py-2.5 text-sm font-extrabold text-ink-soft">
              {level}-daraja
            </span>
          </div>
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
            Do'kon bo'sh. <code className="font-mono">migration-10-shop-v2.sql</code> bajarilganini tekshiring.
          </p>
        ) : (
          <>
            {/* Bo'limlar */}
            <div className="scroll-slim mt-6 flex gap-2 overflow-x-auto pb-1">
              {tabs.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setTab(kind)}
                  className={cn(
                    "shrink-0 rounded-xl2 border-2 px-4 py-2 text-sm font-extrabold transition",
                    kind === tab
                      ? "border-ink bg-ink text-white"
                      : "border-paper-line bg-white text-ink-soft hover:bg-paper",
                  )}
                >
                  {KIND_LABEL[kind]}
                </button>
              ))}
            </div>

            <p className="mt-3 text-sm text-ink-mute">{KIND_HINT[tab]}</p>

            {/* Sovg'alar bo'limida o'z kuponlari ko'rinib turadi */}
            {tab === "reward" && claims.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {claims.slice(0, 5).map((claim) => (
                  <li
                    key={claim.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl2 border-2 px-4 py-2.5",
                      claim.status === "pending"
                        ? "border-amber-300 bg-amber-50"
                        : claim.status === "approved"
                          ? "border-emerald-300 bg-emerald-50"
                          : "border-paper-line bg-paper",
                    )}
                  >
                    <span className="text-2xl" aria-hidden>
                      {claim.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-extrabold text-ink">{claim.title}</span>
                      <span className="block text-xs font-bold text-ink-mute">{CLAIM_LABEL[claim.status]}</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-mute">
                      {new Date(claim.createdAt).toLocaleDateString("uz-UZ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => {
                const locked = level < item.minLevel;
                const affordable = xp >= item.price;
                const canBuy = !locked && affordable;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "surface flex flex-col items-center gap-2 p-5 text-center transition",
                      item.equipped && "border-2 border-[#7a3fd0]",
                    )}
                  >
                    {/* Oldindan ko'rish */}
                    <Preview item={item} dim={locked || (!item.owned && !affordable)} />

                    <span className="flex items-center gap-1.5 font-extrabold text-ink">
                      {item.title}
                      {item.consumable && item.qty > 0 ? (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-extrabold text-white">
                          ×{item.qty}
                        </span>
                      ) : null}
                    </span>

                    {item.description ? (
                      <span className="text-xs leading-snug text-ink-mute">{item.description}</span>
                    ) : null}

                    {locked ? (
                      <span className="mt-auto flex items-center gap-1.5 rounded-xl bg-paper px-4 py-2 text-sm font-extrabold text-ink-mute">
                        <Lock className="h-3.5 w-3.5" /> {item.minLevel}-daraja
                      </span>
                    ) : item.kind === "reward" ? (
                      <button
                        type="button"
                        onClick={() => buy(item)}
                        disabled={!affordable || busy === item.id}
                        className={cn(
                          "mt-auto flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-extrabold transition",
                          affordable ? "bg-[#7a3fd0] text-white hover:bg-[#6a33bd]" : "bg-paper text-ink-mute",
                        )}
                      >
                        {item.price} XP
                      </button>
                    ) : item.owned && !item.consumable ? (
                      item.equipped ? (
                        <span className="mt-auto flex items-center gap-1.5 rounded-xl bg-[#7a3fd0] px-3.5 py-2 text-sm font-extrabold text-white">
                          <Check className="h-4 w-4" strokeWidth={3} /> Kiyilgan
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => equip(item)}
                          disabled={busy === item.id}
                          className="mt-auto rounded-xl border-2 border-paper-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-paper disabled:opacity-50"
                        >
                          Kiyish
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => buy(item)}
                        disabled={!canBuy || busy === item.id}
                        className={cn(
                          "mt-auto flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-extrabold transition",
                          canBuy ? "bg-ink text-white hover:bg-ink-soft" : "bg-paper text-ink-mute",
                        )}
                      >
                        {item.consumable && item.qty > 0 ? <Plus className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                        {item.price} XP
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-8 rounded-xl2 border-2 border-paper-line bg-paper/50 px-5 py-4 text-sm leading-relaxed text-ink-soft">
          XP musobaqada qatnashganingiz va uy vazifasini bajarganingiz uchun beriladi. Avatar, ramka,
          effekt, mavzu va unvon doim sizda qoladi. Kuchaytirgichlar esa bir martalik — o'yinda
          ishlatilgach tugaydi, lekin ularni qayta sotib olsa bo'ladi.
        </p>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Mahsulotni sotib olishdan oldin ko'rsatish. Har turning o'z ko'rinishi bor. */
function Preview({ item, dim }: { item: ShopItem; dim: boolean }) {
  const shell = cn("transition", dim && "opacity-40");

  if (item.kind === "frame") {
    return (
      <span className={shell}>
        <AvatarBadge emoji="🙂" frame={item.value} size={64} />
      </span>
    );
  }

  if (item.kind === "theme") {
    const theme = item.value ? THEMES[item.value] : undefined;
    return (
      <span
        className={cn("grid h-16 w-16 place-items-center rounded-2xl text-3xl shadow-card", shell)}
        style={{ background: theme?.background ?? "#eee" }}
      >
        {item.emoji}
      </span>
    );
  }

  if (item.kind === "avatar") {
    return (
      <span className={shell}>
        <AvatarBadge emoji={item.emoji} size={64} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid h-16 w-16 place-items-center rounded-2xl text-4xl",
        item.owned ? "bg-[#7a3fd0]/10" : "bg-paper",
        shell,
      )}
    >
      {item.emoji}
    </span>
  );
}
