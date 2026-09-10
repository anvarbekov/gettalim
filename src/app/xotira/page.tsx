"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { HomeworkHint } from "@/components/HomeworkHint";
import { ModePicker } from "@/components/ModePicker";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";
import { SIZE_INFO } from "@/lib/games/xotira/engine";
import { getGameDef, type GameMode } from "@/lib/games/registry";
import { LANE_COLORS } from "@/lib/racers";
import { DEFAULT_XOTIRA, getAllPacks, getXotiraSettings, saveXotiraSettings } from "@/lib/storage";
import type { MemorySize, Pack, XotiraSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZES: MemorySize[] = ["4x4", "4x5", "6x6"];

function SetupInner() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [settings, setSettings] = useState<XotiraSettings>(DEFAULT_XOTIRA);
  const [mode, setMode] = useState<GameMode>("local");
  const game = getGameDef("xotira");

  useEffect(() => {
    const all = getAllPacks().filter((p) => !p.generator);
    setPacks(all);
    const stored = getXotiraSettings();
    const wanted = params.get("pack");
    const packId = wanted && all.some((p) => p.id === wanted) ? wanted : stored.packId;
    const valid = all.some((p) => p.id === packId) ? packId : all[0]?.id ?? "";
    setSettings({ ...stored, packId: valid });
  }, [params]);

  const pack = useMemo(() => packs.find((p) => p.id === settings.packId), [packs, settings.packId]);
  const patch = (part: Partial<XotiraSettings>) => setSettings((s) => ({ ...s, ...part }));

  const setTeamName = (index: number, value: string) =>
    setSettings((s) => {
      const teams = [...s.teams];
      teams[index] = value;
      return { ...s, teams };
    });

  /** Paketda nechta noyob javob bor — juftliklar shundan yasaladi. */
  const available = useMemo(() => {
    if (!pack) return 0;
    return new Set(pack.questions.map((q) => q.answer.trim().toLowerCase())).size;
  }, [pack]);

  const needed = SIZE_INFO[settings.size].pairs;
  const enough = available >= needed;

  const start = () => {
    saveXotiraSettings(settings);
    router.push(`/xotira/play?pack=${encodeURIComponent(settings.packId)}`);
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> {t("common.back")}
        </Link>
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">
          {game.ikonka} {game.nomi[lang]} — {t("setup.title")}
        </h1>
        <p className="mt-1 text-ink-mute">
          Har bir juft — atama va uning ta'rifi. Juft topilganda ikkalasi birga ko'rsatiladi.
        </p>

        <Card className="mt-6">
          <CardBody>
            <ModePicker game={game} value={mode} onChange={setMode} />
          </CardBody>
        </Card>

        {mode === "homework" ? <HomeworkHint /> : null}

        {/* Paket */}
        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">{t("setup.pack")}</h2>
            <div className="grid max-h-64 gap-2 overflow-auto scroll-slim sm:grid-cols-2">
              {packs.map((p) => {
                const active = p.id === settings.packId;
                const pairs = new Set(p.questions.map((q) => q.answer.trim().toLowerCase())).size;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patch({ packId: p.id })}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition",
                      active ? "border-teamB bg-teamB/10" : "border-paper-line bg-white hover:bg-paper",
                    )}
                  >
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xl"
                      style={{ background: `${p.color}1a` }}
                    >
                      {p.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-extrabold text-ink">{p.title}</span>
                      <span className="block truncate text-xs text-ink-mute">
                        {p.subject} · {pairs} juft mumkin
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-ink-mute">
              Arifmetika generatorlari bu o'yinda ishlamaydi — juftlik uchun atama va ta'rif kerak.
            </p>
          </CardBody>
        </Card>

        {/* To'r o'lchami */}
        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">To'r o'lchami</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {SIZES.map((size) => {
                const info = SIZE_INFO[size];
                const fits = available >= info.pairs;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => patch({ size })}
                    className={cn(
                      "rounded-xl2 border-2 p-4 text-left transition",
                      settings.size === size
                        ? "border-ink bg-ink text-white"
                        : "border-paper-line bg-white text-ink hover:bg-paper",
                      !fits && settings.size !== size && "opacity-60",
                    )}
                  >
                    <span className="block text-lg font-extrabold">{info.label}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs font-bold",
                        settings.size === size ? "text-white/70" : "text-ink-mute",
                      )}
                    >
                      {fits ? "Paketda yetarli" : `${info.pairs - available} juft yetmaydi`}
                    </span>
                  </button>
                );
              })}
            </div>

            {!enough ? (
              <p className="mt-3 rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                Bu paketda {available} ta noyob javob bor, tanlangan to'r uchun {needed} ta kerak.
                Kichikroq to'r tanlang yoki paketga savol qo'shing.
              </p>
            ) : null}
          </CardBody>
        </Card>

        {/* Jamoalar */}
        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">Kim o'ynaydi?</h2>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => patch({ teamCount: n })}
                  className={cn(
                    "h-12 flex-1 rounded-xl border-2 text-sm font-extrabold transition",
                    settings.teamCount === n
                      ? "border-ink bg-ink text-white"
                      : "border-paper-line bg-white text-ink hover:bg-paper",
                  )}
                >
                  {n === 1 ? "Yakka" : `${n} jamoa`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-ink-mute">
              Juft topgan jamoa yana o'ynaydi; topolmasa navbat keyingisiga o'tadi.
            </p>

            {settings.teamCount > 1 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: settings.teamCount }, (_, i) => (
                  <Field key={i} label={`${i + 1}-jamoa`}>
                    <Input
                      value={settings.teams[i] ?? ""}
                      maxLength={22}
                      onChange={(e) => setTeamName(i, e.target.value)}
                      style={{ borderColor: `${LANE_COLORS[i]}66` }}
                    />
                  </Field>
                ))}
              </div>
            ) : null}
          </CardBody>
        </Card>

        <div className="sticky bottom-4 mt-8">
          <Button size="lg" variant="dark" className="w-full" onClick={start} disabled={!pack || available < 4}>
            <Play className="h-5 w-5" fill="currentColor" /> {t("setup.start")}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function XotiraSetupPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-mute">…</div>}>
      <SetupInner />
    </Suspense>
  );
}
