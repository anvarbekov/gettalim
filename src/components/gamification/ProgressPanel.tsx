"use client";

import { useEffect, useState } from "react";
import { Flame, Lock, Sparkles, Trophy } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { levelProgress, listAchievements, xpForLevel, type Achievement } from "@/lib/gamification/api";
import { cn } from "@/lib/utils";

/** Daraja nomlari — quruq raqamdan ko'ra qiziqarli. */
const TITLES = [
  "Yangi boshlovchi",
  "Izlanuvchi",
  "Bilimdon",
  "Zukko",
  "Ustoz",
  "Bilim chempioni",
];

export const levelTitle = (level: number) => TITLES[Math.min(TITLES.length - 1, Math.max(0, level - 1))];

/**
 * O'quvchi kabinetidagi daraja chizig'i va nishonlar.
 * XP bazada hisoblanadi, bu yerda faqat ko'rsatiladi.
 */
export function ProgressPanel({ xp, level, streak }: { xp: number; level: number; streak: number }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    void listAchievements().then(setAchievements);
  }, [xp]);

  const progress = levelProgress(xp, level);
  const earned = achievements.filter((a) => a.earnedAt);

  return (
    <>
      {/* Daraja */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl2 bg-[#7a3fd0]/10 text-[#7a3fd0]">
                <Sparkles className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-lg font-extrabold text-ink">
                  {level}-daraja · {levelTitle(level)}
                </span>
                <span className="block text-xs font-bold text-ink-mute">
                  {xp} XP · keyingi darajagacha {Math.max(0, progress.next - xp)} XP
                </span>
              </span>
            </span>

            <span className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2 text-sm font-extrabold text-amber-800">
              <Flame className="h-4 w-4" fill="currentColor" /> {streak} kun
            </span>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7a3fd0] to-[#b07ef0] transition-[width] duration-700"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-mute">
            <span>{xpForLevel(level)}</span>
            <span>{xpForLevel(level + 1)}</span>
          </div>
        </CardBody>
      </Card>

      {/* Nishonlar */}
      <Card className="mt-4">
        <CardBody>
          <h2 className="eyebrow mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4" /> Nishonlar · {earned.length}/{achievements.length}
          </h2>

          {achievements.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-mute">Nishonlar yuklanmadi.</p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((item) => {
                const done = Boolean(item.earnedAt);
                return (
                  <div
                    key={item.code}
                    className={cn(
                      "flex items-center gap-3 rounded-xl2 border-2 p-3 transition",
                      done ? "border-gold bg-gold/10" : "border-paper-line bg-paper/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl",
                        done ? "bg-white shadow-card" : "bg-white/60",
                      )}
                    >
                      {done ? item.icon : <Lock className="h-4 w-4 text-ink-mute" />}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block truncate font-extrabold", done ? "text-ink" : "text-ink-mute")}>
                        {item.title}
                      </span>
                      <span className="block text-xs leading-snug text-ink-mute">{item.description}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
