"use client";

import { useEffect, useState } from "react";
import { Trash2, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { clearMatches, getMatches } from "@/lib/storage";
import { fetchMatches, isCloudEnabled } from "@/lib/supabase";
import type { MatchResult } from "@/lib/types";
import { cn, formatClock } from "@/lib/utils";

export default function LeaderboardPage() {
  const { t, lang } = useI18n();
  const [matches, setMatches] = useState<MatchResult[]>([]);

  useEffect(() => {
    const local = getMatches();
    setMatches(local);
    if (isCloudEnabled()) {
      fetchMatches()
        .then((remote) => setMatches([...remote, ...local].slice(0, 100)))
        .catch(() => undefined);
    }
  }, []);

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t("board.title")}</h1>
            <p className="mt-1 text-ink-mute">{t("board.sub")}</p>
          </div>
          {matches.length ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearMatches();
                setMatches([]);
              }}
            >
              <Trash2 className="h-4 w-4" /> {t("board.clear")}
            </Button>
          ) : null}
        </div>

        {matches.length ? (
          <ul className="mt-6 grid gap-2.5">
            {matches.map((match) => (
              <li key={match.id} className="surface flex flex-wrap items-center gap-3 p-4">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    match.winner === "A"
                      ? "bg-teamA-soft text-teamA"
                      : match.winner === "B"
                        ? "bg-teamB-soft text-teamB"
                        : "bg-paper text-ink-mute",
                  )}
                >
                  <Trophy className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-ink">
                    <span className={match.winner === "A" ? "text-teamA" : ""}>{match.teamA}</span>
                    <span className="mx-2 text-ink-mute">vs</span>
                    <span className={match.winner === "B" ? "text-teamB" : ""}>{match.teamB}</span>
                  </p>
                  <p className="truncate text-sm text-ink-mute">
                    {match.packTitle} · {match.subject} · {formatClock(match.durationSec)}
                  </p>
                </div>
                <p className="font-mono text-xl font-bold tabular-nums text-ink">
                  {match.scoreA} : {match.scoreB}
                </p>
                <p className="w-full text-xs text-ink-mute sm:w-auto">
                  {new Date(match.playedAt).toLocaleString(lang === "uz" ? "uz-UZ" : lang)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="surface mt-6 p-8 text-center text-ink-mute">{t("board.empty")}</div>
        )}
      </main>
    </div>
  );
}
