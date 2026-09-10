"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Heart, Play } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { HomeworkHint } from "@/components/HomeworkHint";
import { ModePicker } from "@/components/ModePicker";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input, Select, Toggle } from "@/components/ui/card";
import { getGameDef, type GameMode } from "@/lib/games/registry";
import { LANE_COLORS } from "@/lib/racers";
import { createSession } from "@/lib/live/api";
import { LiveOptions, type LiveConfig } from "@/components/live/LiveOptions";
import { DEFAULT_RAIN, getAllPacks, getRainSettings, saveRainSettings } from "@/lib/storage";
import type { Pack, RainSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const DURATIONS = [0, 60, 120, 180, 300];
const LIVES = [1, 3, 5];
const TEMPOS: RainSettings["tempo"][] = ["slow", "normal", "fast"];

function RainSetupInner() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [settings, setSettings] = useState<RainSettings>(DEFAULT_RAIN);
  const [mode, setMode] = useState<GameMode>("local");
  const [busy, setBusy] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveConfig>({ questionCount: 20, minutes: 5 });
  const { user, role } = useAuth();
  const game = getGameDef("yomgir");

  useEffect(() => {
    const all = getAllPacks();
    setPacks(all);
    const stored = getRainSettings();
    const wanted = params.get("pack");
    const packId = wanted && all.some((p) => p.id === wanted) ? wanted : stored.packId;
    const valid = all.some((p) => p.id === packId) ? packId : all[0]?.id ?? "";
    setSettings({ ...stored, packId: valid });
  }, [params]);

  const pack = useMemo(() => packs.find((p) => p.id === settings.packId), [packs, settings.packId]);
  const patch = (part: Partial<RainSettings>) => setSettings((s) => ({ ...s, ...part }));

  const setTeamName = (index: number, value: string) =>
    setSettings((s) => {
      const teams = [...s.teams];
      teams[index] = value;
      return { ...s, teams };
    });

  const start = async () => {
    saveRainSettings(settings);

    if (mode === "local") {
      router.push(`/yomgir/play?pack=${encodeURIComponent(settings.packId)}`);
      return;
    }

    // Ulangan rejim: sessiya ochiladi va o'qituvchi ekraniga o'tiladi
    if (!user) {
      router.push("/kirish?keyin=/yomgir");
      return;
    }
    if (role === "student") {
      setLiveError("Sessiyani faqat o'qituvchi ocha oladi.");
      return;
    }
    if (!pack) return;

    setBusy(true);
    setLiveError(null);
    const { session, error } = await createSession(user.id, "yomgir", {
      packId: pack.id,
      packTitle: pack.title,
      subject: pack.subject,
      teams: settings.teamCount > 1 ? settings.teamCount : 0,
      teamNames: settings.teams.slice(0, settings.teamCount),
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
        <p className="mt-1 text-ink-mute">{t("rain.rules")}</p>

        <Card className="mt-6">
          <CardBody>
            <ModePicker game={game} value={mode} onChange={setMode} />
          </CardBody>
        </Card>

        {mode === "live" ? <LiveOptions value={live} onChange={setLive} /> : null}

        {mode === "homework" ? <HomeworkHint /> : null}

        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">{t("setup.pack")}</h2>
            <div className="grid max-h-64 gap-2 overflow-auto scroll-slim sm:grid-cols-2">
              {packs.map((p) => {
                const active = p.id === settings.packId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => patch({ packId: p.id })}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition",
                      active ? "border-[#0f9b8e] bg-[#0f9b8e]/10" : "border-paper-line bg-white hover:bg-paper",
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
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">{t("setup.teamCount")}</h2>
            <div className="flex gap-2">
              {[1, 2].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => patch({ teamCount: n })}
                  className={cn(
                    "h-12 flex-1 rounded-xl border-2 text-base font-extrabold transition",
                    settings.teamCount === n
                      ? "border-ink bg-ink text-white"
                      : "border-paper-line bg-white text-ink hover:bg-paper",
                  )}
                >
                  {n === 1 ? t("rain.solo") : `2 ${t("games.teams")}`}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: settings.teamCount }, (_, i) => (
                <Field key={i} label={`${i + 1}-${t("games.teams")}`}>
                  <Input
                    value={settings.teams[i] ?? ""}
                    maxLength={22}
                    onChange={(e) => setTeamName(i, e.target.value)}
                    style={{ borderColor: `${LANE_COLORS[i]}66` }}
                  />
                </Field>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="mt-4">
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <Field label={t("rain.lives")} hint={t("rain.lives.hint")}>
              <Select value={settings.lives} onChange={(e) => patch({ lives: Number(e.target.value) })}>
                {LIVES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("rain.tempo")} hint={t("rain.tempo.hint")}>
              <Select
                value={settings.tempo}
                onChange={(e) => patch({ tempo: e.target.value as RainSettings["tempo"] })}
              >
                {TEMPOS.map((tempo) => (
                  <option key={tempo} value={tempo}>
                    {t(`rain.tempo.${tempo}` as "rain.tempo.slow")}
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

        <div className="mt-4 flex items-center gap-2 rounded-xl2 border-2 border-paper-line bg-white p-4">
          <Heart className="h-5 w-5 shrink-0 text-teamB" fill="currentColor" />
          <p className="text-sm text-ink-soft">{t("rain.lifeNote")}</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle checked={settings.shuffle} onChange={(v) => patch({ shuffle: v })} label={t("setup.shuffle")} />
          <Toggle checked={settings.keyboard} onChange={(v) => patch({ keyboard: v })} label={t("setup.keyboard")} />
        </div>

        <div className="sticky bottom-4 mt-8">
          {liveError ? (
            <p className="mb-2 rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
              {liveError}
            </p>
          ) : null}
          <Button size="lg" variant="dark" className="w-full" onClick={start} disabled={!pack || busy}>
            <Play className="h-5 w-5" fill="currentColor" />{" "}
            {busy ? "Sessiya ochilmoqda…" : mode === "live" ? "Sessiyani ochish" : t("setup.start")}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function RainSetupPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-mute">…</div>}>
      <RainSetupInner />
    </Suspense>
  );
}
