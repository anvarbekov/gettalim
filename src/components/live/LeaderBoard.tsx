"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Flame } from "lucide-react";
import type { HostPlayer } from "@/hooks/useHostSession";
import { LANE_COLORS } from "@/lib/racers";
import { cn } from "@/lib/utils";

const MEDALS = ["#e0a92e", "#9aa7b8", "#c1783c"];

/** Ismdan ikki harfli qisqartma. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * Sinf reytingi — barcha o'quvchilar kartochkasi.
 *
 * Kartochkalar ball bo'yicha tartiblanadi va o'rin o'zgarganda FLIP usuli
 * bilan siljib o'tadi: avval eski joyi o'lchanadi, DOM yangilangach yangi
 * joyidan eskisiga qaytariladi va animatsiya bilan joyiga suriladi.
 * Sinf monitorida shu "jonli" harakat eng ko'zga tashlanadigan narsa.
 */
export function LeaderBoard({ board, teams }: { board: HostPlayer[]; teams: number }) {
  const scope = useRef<HTMLDivElement>(null);
  const nodes = useRef<Map<string, HTMLDivElement>>(new Map());
  const positions = useRef<Map<string, DOMRect>>(new Map());

  useLayoutEffect(() => {
    const previous = positions.current;
    const next = new Map<string, DOMRect>();

    nodes.current.forEach((node, id) => {
      const rect = node.getBoundingClientRect();
      next.set(id, rect);
      const old = previous.get(id);
      if (!old) return;
      const dx = old.left - rect.left;
      const dy = old.top - rect.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      gsap.fromTo(node, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.55, ease: "power3.out" });
    });

    positions.current = next;
  }, [board]);

  if (board.length === 0) {
    return <p className="py-16 text-center text-lg text-ink-mute">Hozircha hech kim qo'shilmadi.</p>;
  }

  const leader = board[0]?.score ?? 0;

  // Sinf monitorida hamma kartochka sig'ishi va uzoqdan o'qilishi kerak:
  // o'quvchi qancha kam bo'lsa, kartochka shuncha katta.
  const count = board.length;
  const cols = count <= 6 ? 2 : count <= 12 ? 3 : count <= 30 ? 4 : 5;
  const big = count <= 10;
  const mid = count <= 30;

  return (
    <div
      ref={scope}
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {board.map((player, index) => {
        const color = teams > 0 ? LANE_COLORS[(player.teamNo - 1) % LANE_COLORS.length] : "#12233f";
        const medal = index < 3 ? MEDALS[index] : null;
        const share = leader > 0 ? Math.max(0.06, player.score / leader) : 0.06;
        const fresh = player.lastAt > 0 && Date.now() - player.lastAt < 1200;

        return (
          <div
            key={player.participantId}
            ref={(el) => {
              if (el) nodes.current.set(player.participantId, el);
              else nodes.current.delete(player.participantId);
            }}
            className={cn(
              "relative overflow-hidden rounded-xl2 border-2 bg-white shadow-card transition-colors duration-500",
              big ? "p-5" : mid ? "p-4" : "p-3",
              index === 0 && "border-gold shadow-lift",
              index > 0 && player.lastCorrect === true && fresh && "border-emerald-400",
              index > 0 && player.lastCorrect === false && fresh && "border-rose-300",
              index > 0 && !(fresh && player.lastCorrect !== null) && "border-paper-line",
            )}
          >
            {/* Ball ulushi — fon chizig'i */}
            <span
              className="absolute inset-y-0 left-0 -z-0 transition-[width] duration-700"
              style={{ width: `${share * 100}%`, background: `${color}12` }}
              aria-hidden
            />

            <div className={cn("relative flex items-center", big ? "gap-4" : "gap-2.5")}>
              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-xl font-extrabold text-white",
                  big ? "h-12 w-12 text-xl" : mid ? "h-10 w-10 text-base" : "h-9 w-9 text-sm",
                )}
                style={{ background: medal ?? color }}
              >
                {index + 1}
              </span>

              <span
                className={cn(
                  "grid shrink-0 place-items-center rounded-full font-extrabold text-white",
                  big ? "h-14 w-14 text-lg" : mid ? "h-11 w-11 text-sm" : "h-10 w-10 text-sm",
                )}
                style={{ background: color }}
              >
                {initials(player.nickname)}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate font-extrabold text-ink",
                    big ? "text-2xl" : mid ? "text-lg" : "text-sm",
                  )}
                >
                  {player.nickname}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 font-bold text-ink-mute",
                    big ? "text-sm" : "text-[11px]",
                  )}
                >
                  <span className="text-emerald-600">{player.correct} ✓</span>
                  <span className="text-rose-500">{player.wrong} ✕</span>
                  {player.answered > 0 ? (
                    <span className="text-ink-mute">
                      {Math.round((player.correct / player.answered) * 100)}%
                    </span>
                  ) : null}
                  {player.streak >= 3 ? (
                    <span className="flex items-center gap-0.5 text-amber-600">
                      <Flame className={big ? "h-4 w-4" : "h-3 w-3"} fill="currentColor" />
                      {player.streak}
                    </span>
                  ) : null}
                </span>
              </span>

              <span
                className={cn(
                  "shrink-0 font-mono font-bold tabular-nums text-ink",
                  big ? "text-4xl" : mid ? "text-2xl" : "text-lg",
                )}
              >
                {player.score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
