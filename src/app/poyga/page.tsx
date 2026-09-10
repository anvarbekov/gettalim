/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { ModePicker } from "@/components/ModePicker";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input, Select, Toggle } from "@/components/ui/card";
import { getGameDef, type GameMode } from "@/lib/games/registry";
import { createSession } from "@/lib/live/api";
import { LiveOptions, type LiveConfig } from "@/components/live/LiveOptions";
import { useAuth } from "@/components/auth/AuthProvider";
import { LANE_COLORS, RACER_SETS, type RacerKind } from "@/lib/racers";
import { DEFAULT_RACE, getAllPacks, getRaceSettings, saveRaceSettings } from "@/lib/storage";
import type { Pack, RaceSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const DURATIONS = [0, 120, 180, 300, 600];
const DISTANCES = [6, 8, 10, 12, 15, 20];

function RaceSetupInner() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [settings, setSettings] = useState<RaceSettings>(DEFAULT_RACE);
  const [mode, setMode] = useState<GameMode>("local");
  const [busy, setBusy] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveConfig>({ questionCount: 20, minutes: 5 });
  const { user, role } = useAuth();
  const game = getGameDef("poyga");

  useEffect(() => {
    const all = getAllPacks();
    setPacks(all);
    const stored = getRaceSettings();
    const wanted = params.get("pack");
    const packId = wanted && all.some((p) => p.id === wanted) ? wanted : stored.packId;
    const valid = all.some((p) => p.id === packId) ? packId : all[0]?.id ?? "";
    setSettings({ ...stored, packId: valid });
  }, [params]);

  const pack = useMemo(() => packs.find((p) => p.id === settings.packId), [packs, settings.packId]);
  const patch = (part: Partial<RaceSettings>) => setSettings((s) => ({ ...s, ...part }));

  const setTeamName = (index: number, value: string) =>
    setSettings((s) => {
      const teams = [...s.teams];
      teams[index] = value;
      return { ...s, teams };
    });

  const start = async () => {
    saveRaceSettings(settings);

    if (mode === "local") {
      router.push(`/poyga/play?pack=${encodeURIComponent(settings.packId)}`);
      return;
    }

    if (!user) {
      router.push("/kirish?keyin=/poyga");
      return;
    }
    if (role === "student") {
      setLiveError("Sessiyani faqat o'qituvchi ocha oladi.");
      return;
    }
    if (!pack) return;

    setBusy(true);
    setLiveError(null);
    const { session, error } = await createSession(user.id, "poyga", {
      packId: pack.id,
      packTitle: pack.title,
      subject: pack.subject,
      teams: settings.teamCount,
      teamNames: settings.teams.slice(0, settings.teamCount),
      racer: settings.racer,
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
        <p className="mt-1 text-ink-mute">{t("race.rules")}</p>

        <Card className="mt-6">
          <CardBody>
            <ModePicker game={game} value={mode} onChange={setMode} />
          </CardBody>
        </Card>

        {mode === "live" ? <LiveOptions value={live} onChange={setLive} /> : null}

        {/* Paket */}
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
                      active ? "border-gold bg-gold/10" : "border-paper-line bg-white hover:bg-paper",
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

        {/* Jamoalar soni va nomlari */}
        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">{t("setup.teamCount")}</h2>
            <div className="flex gap-2">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => patch({ teamCount: n })}
                  className={cn(
                    "h-12 flex-1 rounded-xl border-2 text-lg font-extrabold transition",
                    settings.teamCount === n
                      ? "border-ink bg-ink text-white"
                      : "border-paper-line bg-white text-ink hover:bg-paper",
                  )}
                >
                  {n}
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

        {/* Chopuvchilar */}
        <Card className="mt-4">
          <CardBody>
            <h2 className="eyebrow mb-3">{t("setup.racer")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {RACER_SETS.map((set) => {
                const active = set.kind === settings.racer;
                const shown = set.models.slice(0, Math.max(2, settings.teamCount));
                return (
                  <button
                    key={set.kind}
                    type="button"
                    onClick={() => patch({ racer: set.kind as RacerKind })}
                    className={cn(
                      "overflow-hidden rounded-xl2 border-2 text-left transition",
                      active ? "border-gold shadow-lift" : "border-paper-line hover:border-ink/20",
                    )}
                  >
                    {/* Trek uslubidagi ko'rinish — modellar to'liq, kesilmagan */}
                    <span
                      className="relative flex h-24 items-end justify-center gap-1 overflow-hidden px-3 pb-2"
                      style={{
                        background: active
                          ? "linear-gradient(180deg,#fff 0%,#fdf6e3 100%)"
                          : "linear-gradient(180deg,#fff 0%,#eef2f7 100%)",
                      }}
                    >
                      {/* yo'lakcha chizig'i */}
                      <span
                        className="pointer-events-none absolute inset-x-3 bottom-2 h-px opacity-40"
                        style={{
                          backgroundImage:
                            "repeating-linear-gradient(90deg,#9aa7b8 0 10px,transparent 10px 20px)",
                        }}
                        aria-hidden
                      />
                      {shown.map((m) => (
                        <img
                          key={m.src}
                          src={m.src}
                          alt=""
                          className="h-auto max-h-[72px] w-auto max-w-[24%] object-contain"
                          style={{ filter: "drop-shadow(0 4px 6px rgba(18,35,63,.18))" }}
                        />
                      ))}
                    </span>

                    <span className="flex items-center justify-between gap-2 border-t border-paper-line bg-white px-3 py-2.5">
                      <span className="font-extrabold text-ink">{set.name[lang]}</span>
                      {active ? (
                        <span className="rounded-full bg-gold/20 px-2.5 py-1 text-[11px] font-extrabold text-[#8a6410]">
                          Tanlandi
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Qoidalar */}
        <Card className="mt-4">
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label={t("setup.distance")} hint={t("setup.distance.hint")}>
              <Select value={settings.distance} onChange={(e) => patch({ distance: Number(e.target.value) })}>
                {DISTANCES.map((n) => (
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

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Toggle checked={settings.shuffle} onChange={(v) => patch({ shuffle: v })} label={t("setup.shuffle")} />
          <Toggle checked={settings.allowReview} onChange={(v) => patch({ allowReview: v })} label={t("setup.review")} />
          <Toggle checked={settings.keyboard} onChange={(v) => patch({ keyboard: v })} label={t("setup.keyboard")} />
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

export default function RaceSetupPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-mute">…</div>}>
      <RaceSetupInner />
    </Suspense>
  );
}
