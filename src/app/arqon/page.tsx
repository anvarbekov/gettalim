"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { CharacterPicker } from "@/components/CharacterPicker";
import { ModePicker } from "@/components/ModePicker";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input, Select, Toggle } from "@/components/ui/card";
import { getGameDef, type GameMode } from "@/lib/games/registry";
import { createSession } from "@/lib/live/api";
import { LiveOptions, type LiveConfig } from "@/components/live/LiveOptions";
import { useAuth } from "@/components/auth/AuthProvider";
import { DEFAULT_SETTINGS, getAllPacks, getSettings, saveSettings } from "@/lib/storage";
import type { MatchSettings, Pack } from "@/lib/types";
import { cn } from "@/lib/utils";

const DURATIONS = [0, 60, 120, 180, 300, 600];
const PULLS = [3, 4, 5, 6, 8, 10];


function SetupInner() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [settings, setSettings] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<GameMode>("local");
  const [busy, setBusy] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveConfig>({ questionCount: 20, minutes: 5 });
  const { user, role } = useAuth();
  const game = getGameDef("arqon");

  useEffect(() => {
    const all = getAllPacks();
    setPacks(all);
    const stored = getSettings();
    const wanted = params.get("pack");
    const packId = wanted && all.some((p) => p.id === wanted) ? wanted : stored.packId;
    const valid = all.some((p) => p.id === packId) ? packId : all[0]?.id ?? "";
    setSettings({ ...stored, packId: valid });
  }, [params]);

  const pack = useMemo(() => packs.find((p) => p.id === settings.packId), [packs, settings.packId]);
  const patch = (part: Partial<MatchSettings>) => setSettings((s) => ({ ...s, ...part }));

  const start = async () => {
    saveSettings(settings);

    if (mode === "local") {
      router.push(`/arqon/play?pack=${encodeURIComponent(settings.packId)}`);
      return;
    }

    // Ulangan rejim: butun sinf o'z qurilmasidan qatnashadi
    if (!user) {
      router.push("/kirish?keyin=/arqon");
      return;
    }
    if (role === "student") {
      setLiveError("Sessiyani faqat o'qituvchi ocha oladi.");
      return;
    }
    if (!pack) return;

    setBusy(true);
    setLiveError(null);
    const { session, error } = await createSession(user.id, "arqon", {
      packId: pack.id,
      packTitle: pack.title,
      subject: pack.subject,
      teams: 2,
      teamNames: [settings.teamA, settings.teamB],
      questionCount: live.questionCount,
      duration: live.minutes * 60,
    });
    setBusy(false);
    if (error || !session) {
      setLiveError(error ?? "Sessiya ochilmadi.");
      return;
    }
    router.push(`/host/${session.id}`);
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

        <Card className="mt-6">
          <CardBody>
            <ModePicker game={game} value={mode} onChange={setMode} />
          </CardBody>
        </Card>

        {mode === "live" ? <LiveOptions value={live} onChange={setLive} /> : null}

        {/* Paket tanlash */}
        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">{t("setup.pack")}</h2>
            <div className="grid max-h-72 gap-2 overflow-auto scroll-slim sm:grid-cols-2">
              {packs.map((p) => {
                const active = p.id === settings.packId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patch({ packId: p.id })}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition",
                      active ? "border-teamA bg-teamA-soft" : "border-paper-line bg-white hover:bg-paper",
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
                        {p.subject} ·{" "}
                        {p.generator ? t("setup.endless") : `${p.questions.length} ${t("setup.questions")}`}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <Link href="/packs" className="link-quiet mt-3 inline-block text-sm font-bold">
              + {t("packs.new")}
            </Link>
          </CardBody>
        </Card>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Jamoalar */}
          <Card>
            <CardBody className="space-y-4">
              <h2 className="eyebrow">{t("setup.teams")}</h2>
              <Field label={t("setup.teamA")}>
                <Input
                  value={settings.teamA}
                  maxLength={22}
                  onChange={(e) => patch({ teamA: e.target.value })}
                  className="border-teamA/40 focus:border-teamA"
                />
              </Field>
              <Field label={t("setup.teamB")}>
                <Input
                  value={settings.teamB}
                  maxLength={22}
                  onChange={(e) => patch({ teamB: e.target.value })}
                  className="border-teamB/40 focus:border-teamB"
                />
              </Field>
            </CardBody>
          </Card>

          {/* Qoidalar */}
          <Card>
            <CardBody className="space-y-4">
              <h2 className="eyebrow">{t("setup.rules")}</h2>
              <Field label={t("setup.pull")} hint={t("setup.pull.hint")}>
                <Select
                  value={settings.pullToWin}
                  onChange={(e) => patch({ pullToWin: Number(e.target.value) })}
                >
                  {PULLS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("setup.duration")}>
                <Select value={settings.duration} onChange={(e) => patch({ duration: Number(e.target.value) })}>
                  {DURATIONS.map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? t("setup.noLimit") : `${n / 60} ${t("common.min")}`}
                    </option>
                  ))}
                </Select>
              </Field>

            </CardBody>
          </Card>
        </div>

        {/* Personajlar */}
        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow">{t("setup.chars")}</h2>
            <p className="mb-3 mt-1 text-sm text-ink-mute">{t("setup.chars.sub")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 truncate text-sm font-extrabold text-teamA">{settings.teamA}</p>
                <CharacterPicker side="a" value={settings.charA} onChange={(id) => patch({ charA: id })} />
              </div>
              <div>
                <p className="mb-2 truncate text-sm font-extrabold text-teamB">{settings.teamB}</p>
                <CharacterPicker side="b" value={settings.charB} onChange={(id) => patch({ charB: id })} />
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle
            checked={settings.allowReview}
            onChange={(v) => patch({ allowReview: v })}
            label={t("setup.review")}
            hint={t("setup.review.hint")}
          />
          <Toggle
            checked={settings.shuffle}
            onChange={(v) => patch({ shuffle: v })}
            label={t("setup.shuffle")}
          />
          <Toggle
            checked={settings.keyboard}
            onChange={(v) => patch({ keyboard: v })}
            label={t("setup.keyboard")}
            hint={t("setup.keyboard.hint")}
          />
        </div>

        {liveError ? (
          <p className="mt-4 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
            {liveError}
          </p>
        ) : null}

        <div className="sticky bottom-4 mt-8">
          <Button size="lg" variant="dark" className="w-full" onClick={start} disabled={!pack}>
            <Play className="h-5 w-5" fill="currentColor" />{" "}
            {busy ? "Sessiya ochilmoqda…" : mode === "live" ? "Sessiyani ochish" : t("setup.start")}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-mute">…</div>}>
      <SetupInner />
    </Suspense>
  );
}
