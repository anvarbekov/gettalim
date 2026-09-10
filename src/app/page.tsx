/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileJson, Play } from "lucide-react";
import { Arena } from "@/components/Arena";
import { SiteHeader } from "@/components/SiteHeader";
import { SubjectCard, TiltCard } from "@/components/SubjectCard";
import { ThreeBackground } from "@/components/ThreeBackground";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { ModeBadges } from "@/components/ModePicker";
import { GAMES, type GameDef } from "@/lib/games/registry";
import { ASSET_VERSION, BUILTIN_CHARACTERS } from "@/lib/characters";
import { getRacer } from "@/lib/racers";
import { cn } from "@/lib/utils";
import { getAllPacks } from "@/lib/storage";
import type { Pack } from "@/lib/types";

export default function HomePage() {
  const { t, lang } = useI18n();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [demoPull, setDemoPull] = useState(1);

  useEffect(() => {
    setPacks(getAllPacks());
  }, []);

  useEffect(() => {
    const id = setInterval(() => setDemoPull((p) => (p >= 2 ? -2 : p + 1)), 1800);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    const questions = packs.reduce((sum, p) => sum + (p.generator ? 0 : p.questions.length), 0);
    const subjects = new Set(packs.map((p) => p.subject)).size;
    return { packs: packs.length, questions, subjects };
  }, [packs]);

  return (
    <div className="relative min-h-dvh">
      <ThreeBackground />
      <SiteHeader />

      {/* ---------------- Hero ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-10 sm:pt-14">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div>
            <span className="eyebrow inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-card">
              <img src="/mark.png" alt="" className="h-5 w-5 rounded-full" />
              {t("home.badge")}
            </span>
            <h1 className="mt-5 text-balance text-4xl leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
              {t("home.title")}
            </h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-ink-soft sm:text-lg">
              {t("home.lead")}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/arqon">
                <Button size="lg" variant="dark">
                  <Play className="h-5 w-5" fill="currentColor" /> {t("home.cta.play")}
                </Button>
              </Link>
              <Link href="/packs">
                <Button size="lg" variant="outline">
                  <FileJson className="h-5 w-5" /> {t("home.cta.packs")}
                </Button>
              </Link>
            </div>

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {[
                [stats.packs, t("home.stats.packs")],
                [stats.questions, t("home.stats.questions")],
                [stats.subjects, t("home.stats.subjects")],
              ].map(([value, label]) => (
                <div key={String(label)}>
                  <dd className="font-mono text-2xl font-bold tabular-nums text-ink">{value}</dd>
                  <dt className="text-xs font-bold uppercase tracking-wide text-ink-mute">{label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl2 bg-white/70 p-3 shadow-lift backdrop-blur">
            <Arena
              pull={demoPull}
              pullToWin={4}
              aName="1-Jamoa"
              bName="2-Jamoa"
              charA={BUILTIN_CHARACTERS[0]}
              charB={BUILTIN_CHARACTERS[1] ?? BUILTIN_CHARACTERS[0]}
            />
          </div>
        </div>
      </section>

      {/* ---------------- O'yinlar ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("games.title")}</h2>
          <p className="mt-1 text-ink-mute">{t("games.sub")}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} soon={t("games.soon")} teamsLabel={t("games.teams")} openLabel={t("games.open")} />
          ))}
        </div>
      </section>

      {/* ---------------- Mashqlar ---------------- */}
      <section className="mx-auto w-full max-w-6xl px-4 py-6">
        <Link
          href="/mashq"
          className="group flex flex-wrap items-center gap-4 rounded-xl2 border-2 border-paper-line bg-white p-5 shadow-card transition hover:shadow-lift"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl2 bg-[#7a3fd0]/10 text-3xl">
            🧩
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-extrabold text-ink">Mashqlar bo'limi</span>
            <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">
              Algoritm yig'ish va sanoq sistemalari — test emas, o'rganish. 2-sinfdan 11-sinfgacha.
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
            Ochish
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </Link>
      </section>

      {/* ---------------- Fanlar ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("home.subjects")}</h2>
            <p className="mt-1 text-ink-mute">{t("home.subjects.sub")}</p>
          </div>
          <Link href="/packs" className="link-quiet text-sm font-bold">
            {t("nav.packs")} →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packs.map((pack) => (
            <SubjectCard key={pack.id} pack={pack} label={t("setup.questions")} />
          ))}
        </div>
      </section>

      {/* ---------------- Qanday ishlaydi ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("home.how")}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((step) => (
            <li key={step} className="surface relative p-5 pt-8">
              <span className="absolute -top-4 left-5 grid h-9 w-9 place-items-center rounded-xl bg-rope font-mono text-lg font-bold text-ink shadow-card">
                {step}
              </span>
              <h3 className="text-lg font-extrabold text-ink">{t(`home.how.${step}.t` as "home.how.1.t")}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {t(`home.how.${step}.d` as "home.how.1.d")}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-paper-line/70 bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-ink-mute">
          <span className="flex items-center gap-2">
            <img src="/mark.png" alt="Gettalim" className="h-7 w-7 rounded-full" />
            {t("app.tagline")}
          </span>
          <span className="font-bold">{t("common.dev")}: @Gettalim</span>
        </div>
      </footer>
    </div>
  );
}

/** Bosh sahifadagi o'yin kartochkasi. Hali yozilmagan o'yinlar "tez orada" bo'lib turadi. */
function GameCard({
  game,
  soon,
  teamsLabel,
  openLabel,
}: {
  game: GameDef;
  soon: string;
  teamsLabel: string;
  openLabel: string;
}) {
  const { lang } = useI18n();
  const ready = game.status === "ready";
  const teams = game.minTeams === game.maxTeams ? `${game.minTeams}` : `${game.minTeams}–${game.maxTeams}`;

  const inner = (
    <>
      <div
        className="relative flex h-32 items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${game.rang}1f, ${game.rang}06)` }}
      >
        {game.id === "arqon" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/img/puller-left.png?v=${ASSET_VERSION}`} alt="" className="absolute bottom-0 left-5 h-[86%] object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/img/girl-right.png?v=${ASSET_VERSION}`} alt="" className="absolute bottom-0 right-5 h-[86%] object-contain" />
          </>
        ) : game.id === "poyga" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getRacer("horse", 1).src} alt="" className="absolute bottom-2 left-3 h-[58%] object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getRacer("car", 4).src} alt="" className="absolute bottom-3 right-3 h-[42%] object-contain" />
          </>
        ) : (
          <span className="text-6xl opacity-90">{game.ikonka}</span>
        )}

        <span
          className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white"
          style={{ background: game.rang }}
        >
          {teams} {teamsLabel}
        </span>
        {!ready ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
            {soon}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-extrabold text-ink">{game.nomi[lang]}</h3>
        <p className="mt-0.5 text-sm font-bold" style={{ color: game.rang }}>
          {game.shior[lang]}
        </p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{game.tavsif[lang]}</p>
        <div className="mt-3">
          <ModeBadges game={game} />
        </div>
        {ready ? (
          <span className="mt-3 flex items-center gap-1.5 text-sm font-extrabold text-ink">
            {openLabel}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        ) : null}
      </div>
    </>
  );

  const shell =
    "group flex h-full flex-col overflow-hidden rounded-xl2 border border-paper-line bg-white shadow-card transition";

  if (!ready) {
    return <div className={cn(shell, "opacity-70")}>{inner}</div>;
  }

  return (
    <TiltCard max={5}>
      <Link href={`/${game.slug}`} className={cn(shell, "hover:shadow-lift")} style={{ transform: "translateZ(18px)" }}>
        {inner}
      </Link>
    </TiltCard>
  );
}
