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
import { Card, CardBody, Select, Toggle } from "@/components/ui/card";
import { usableQuestions } from "@/lib/games/krossvord/engine";
import { getGameDef, type GameMode } from "@/lib/games/registry";
import { DEFAULT_KROSSVORD, getAllPacks, getKrossvordSettings, saveKrossvordSettings } from "@/lib/storage";
import type { KrossvordSettings, Pack } from "@/lib/types";
import { cn } from "@/lib/utils";

const COUNTS = [8, 10, 12, 15, 20];

function SetupInner() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [settings, setSettings] = useState<KrossvordSettings>(DEFAULT_KROSSVORD);
  const [mode, setMode] = useState<GameMode>("local");
  const game = getGameDef("krossvord");

  useEffect(() => {
    const all = getAllPacks().filter((p) => !p.generator);
    setPacks(all);
    const stored = getKrossvordSettings();
    const wanted = params.get("pack");
    const packId = wanted && all.some((p) => p.id === wanted) ? wanted : stored.packId;
    const valid = all.some((p) => p.id === packId) ? packId : all[0]?.id ?? "";
    setSettings({ ...stored, packId: valid });
  }, [params]);

  const pack = useMemo(() => packs.find((p) => p.id === settings.packId), [packs, settings.packId]);
  const usable = useMemo(() => usableQuestions(pack).length, [pack]);
  const patch = (part: Partial<KrossvordSettings>) => setSettings((s) => ({ ...s, ...part }));

  const start = () => {
    saveKrossvordSettings(settings);
    router.push(`/krossvord/play?pack=${encodeURIComponent(settings.packId)}`);
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
          Javob — so'z, savol — ta'rif. To'r har safar qaytadan tuziladi.
        </p>

        <Card className="mt-6">
          <CardBody>
            <ModePicker game={game} value={mode} onChange={setMode} />
          </CardBody>
        </Card>

        {mode === "homework" ? <HomeworkHint /> : null}

        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">{t("setup.pack")}</h2>
            <div className="grid max-h-64 gap-2 overflow-auto scroll-slim sm:grid-cols-2">
              {packs.map((p) => {
                const active = p.id === settings.packId;
                const count = usableQuestions(p).length;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patch({ packId: p.id })}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition",
                      active ? "border-[#0e7fa8] bg-[#0e7fa8]/10" : "border-paper-line bg-white hover:bg-paper",
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
                        {p.subject} · {count} so'z yaroqli
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-ink-mute">
              Krossvordga faqat bitta so'zli, 3–12 harfli javoblar tushadi. Tutuq belgilari
              (o', g') olib tashlanadi — har katakda bitta harf turadi.
            </p>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="eyebrow mb-1.5 block">So'zlar soni</span>
              <Select value={settings.words} onChange={(e) => patch({ words: Number(e.target.value) })}>
                {COUNTS.map((n) => (
                  <option key={n} value={n} disabled={n > usable}>
                    {n} ta{n > usable ? " — yetmaydi" : ""}
                  </option>
                ))}
              </Select>
              <span className="mt-1.5 block text-xs text-ink-mute">
                Paketda {usable} ta yaroqli so'z bor. Kesishmagan so'zlar tashlab ketiladi.
              </span>
            </div>
            <Toggle
              checked={settings.showClues}
              onChange={(v) => patch({ showClues: v })}
              label="Savollar ko'rinsin"
              hint="O'chirsangiz faqat to'r qoladi — chop etib tarqatish uchun"
            />
          </CardBody>
        </Card>

        {usable < 4 ? (
          <p className="mt-4 rounded-xl border-2 border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
            Bu paketda krossvord uchun so'z yetarli emas. Javoblari bitta so'zdan iborat savollar kerak.
          </p>
        ) : null}

        <div className="sticky bottom-4 mt-8">
          <Button size="lg" variant="dark" className="w-full" onClick={start} disabled={!pack || usable < 4}>
            <Play className="h-5 w-5" fill="currentColor" /> {t("setup.start")}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function KrossvordSetupPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-mute">…</div>}>
      <SetupInner />
    </Suspense>
  );
}
