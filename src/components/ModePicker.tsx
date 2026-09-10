"use client";

import { Check, Lock } from "lucide-react";
import { useI18n } from "@/components/providers";
import { MODE_INFO, type GameDef, type GameMode } from "@/lib/games/registry";
import { cn } from "@/lib/utils";

/** Doska rejimi hamma o'yinda tayyor. */
const READY_MODES: GameMode[] = ["local", "live"];

/** Ulangan rejim hozircha faqat shu o'yinlarda yozilgan (Sprint 3). */
const LIVE_READY = new Set(["yomgir", "arqon", "poyga", "millioner", "xazina"]);

/** Uy vazifasi: yolg'iz o'ynaladigan o'yinlar. */
const HOMEWORK_READY = new Set(["yomgir", "millioner", "xotira", "krossvord"]);

const modeReady = (gameId: string, mode: GameMode) =>
  mode === "local" ||
  (mode === "live" && LIVE_READY.has(gameId)) ||
  (mode === "homework" && HOMEWORK_READY.has(gameId));

export function ModePicker({
  game,
  value,
  onChange,
}: {
  game: GameDef;
  value: GameMode;
  onChange: (mode: GameMode) => void;
}) {
  const { t, lang } = useI18n();

  return (
    <div>
      <h2 className="eyebrow mb-1">{t("mode.title")}</h2>
      <p className="mb-3 text-sm text-ink-mute">{t("mode.sub")}</p>

      <div className="grid gap-2.5 sm:grid-cols-3">
        {(["local", "live", "homework"] as GameMode[]).map((mode) => {
          const supported = game.modes.includes(mode);
          const ready = modeReady(game.id, mode);
          const info = MODE_INFO[mode];
          const active = value === mode && supported && ready;
          const disabled = !supported || !ready;

          return (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mode)}
              className={cn(
                "relative rounded-xl2 border-2 p-4 text-left transition",
                active && "border-ink bg-ink text-white shadow-lift",
                !active && !disabled && "border-paper-line bg-white hover:bg-paper",
                disabled && "cursor-not-allowed border-paper-line/70 bg-paper/50 opacity-60",
              )}
            >
              <span className="mb-1.5 flex items-center gap-2">
                <span className="text-xl leading-none">{info.ikonka}</span>
                <span className="font-extrabold leading-tight">{info.nomi[lang]}</span>
                {active ? <Check className="ml-auto h-4 w-4 shrink-0" strokeWidth={3} /> : null}
                {disabled ? <Lock className="ml-auto h-3.5 w-3.5 shrink-0 text-ink-mute" /> : null}
              </span>
              <span className={cn("block text-xs leading-relaxed", active ? "text-white/80" : "text-ink-mute")}>
                {info.izoh[lang]}
              </span>
              {disabled ? (
                <span className="mt-2 inline-block rounded-full bg-paper-line/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink-soft">
                  {supported ? t("mode.soon") : t("mode.unsupported")}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Bosh sahifadagi kartochka uchun kichik belgilar. */
export function ModeBadges({ game }: { game: GameDef }) {
  const { lang } = useI18n();
  return (
    <span className="flex flex-wrap gap-1">
      {game.modes.map((mode) => (
        <span
          key={mode}
          title={MODE_INFO[mode].nomi[lang]}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold",
            modeReady(game.id, mode) ? "bg-paper text-ink-soft" : "bg-paper/60 text-ink-mute",
          )}
        >
          {MODE_INFO[mode].ikonka}
          {MODE_INFO[mode].nomi[lang].split(" ")[0]}
        </span>
      ))}
    </span>
  );
}
