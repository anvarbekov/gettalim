"use client";

import { Check, ChevronLeft, ChevronRight, Flag, X } from "lucide-react";
import type { RacerState } from "@/hooks/useRace";
import { cn, normalizeAnswer } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export interface RacePanelProps {
  lane: number;
  name: string;
  color: string;
  racer: RacerState;
  compact: boolean;
  disabled: boolean;
  allowReview: boolean;
  labels: {
    hint: string;
    reviewBack: string;
    reviewLive: string;
    reviewTitle: string;
    yourAnswer: string;
    finished: string;
  };
  onAnswer: (choice: string) => void;
  onReviewBack: () => void;
  onReviewForward: () => void;
}

export function RacePanel({
  lane,
  name,
  color,
  racer,
  compact,
  disabled,
  allowReview,
  labels,
  onAnswer,
  onReviewBack,
  onReviewForward,
}: RacePanelProps) {
  const reviewing = racer.reviewIndex !== null;
  const reviewed = reviewing ? racer.history[racer.reviewIndex as number] ?? null : null;
  const item = reviewed ? reviewed.item : racer.current;
  const feedback = racer.feedback;
  const done = racer.place !== null;

  const stateFor = (option: string): "idle" | "correct" | "wrong" | "muted" => {
    const isAnswer = normalizeAnswer(option) === normalizeAnswer(item.answer);
    if (reviewed) {
      if (isAnswer) return "correct";
      if (normalizeAnswer(option) === normalizeAnswer(reviewed.chosen)) return "wrong";
      return "muted";
    }
    if (!feedback) return "idle";
    if (isAnswer) return "correct";
    if (normalizeAnswer(option) === normalizeAnswer(feedback.chosen)) return "wrong";
    return "muted";
  };

  return (
    <section className="surface flex h-full flex-col overflow-hidden" aria-label={name}>
      <header
        className="flex items-center justify-between gap-2 px-3 py-2 text-white"
        style={{ background: color }}
      >
        <h2 className="flex min-w-0 items-center gap-2 text-base font-extrabold">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/25 text-xs">
            {lane + 1}
          </span>
          <span className="truncate">{name}</span>
        </h2>
        <div className="flex items-center gap-1.5">
          {racer.streak > 1 ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold">
              ×{racer.streak}
            </span>
          ) : null}
          <span className="grid h-8 min-w-8 place-items-center rounded-full bg-white px-2 font-mono text-base font-extrabold text-ink">
            {racer.steps}
          </span>
        </div>
      </header>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <Flag className="h-8 w-8" style={{ color }} />
          <p className="text-lg font-extrabold text-ink">{labels.finished}</p>
          <p className="font-mono text-3xl font-bold" style={{ color }}>
            {racer.place}
          </p>
        </div>
      ) : (
        <>
          {reviewing ? (
            <div className="flex items-center justify-between gap-2 bg-ink px-3 py-1 text-[11px] font-extrabold text-white">
              <span>
                {labels.reviewTitle} {(racer.reviewIndex as number) + 1}/{racer.history.length}
              </span>
              <span className={reviewed?.ok ? "text-emerald-300" : "text-rose-300"}>
                {reviewed?.ok ? "✓" : "✕"} {reviewed?.chosen}
              </span>
            </div>
          ) : null}

          <div className="px-3 py-3 text-center" style={{ background: `${color}12` }}>
            <p
              className={cn(
                "text-balance font-extrabold leading-snug",
                compact ? "text-base sm:text-lg" : "text-lg sm:text-xl",
              )}
              style={{ color }}
            >
              {item.question.prompt}
            </p>
            {item.question.hint ? (
              <p className="mt-1 text-[11px] font-bold text-ink-mute">
                {labels.hint}: {item.question.hint}
              </p>
            ) : null}
          </div>

          <div className="flex flex-1 flex-col gap-1.5 p-3">
            {item.options.map((option, index) => {
              const status = stateFor(option);
              return (
                <button
                  key={`${item.key}-${option}`}
                  type="button"
                  disabled={disabled || reviewing || !!feedback}
                  onClick={() => onAnswer(option)}
                  className={cn(
                    "flex flex-1 items-center gap-2.5 rounded-xl border-2 px-2.5 py-2 text-left font-bold shadow-key transition",
                    compact ? "min-h-[2.6rem] text-sm" : "min-h-[3rem] text-base",
                    "disabled:pointer-events-none",
                    status === "idle" &&
                      "border-paper-line bg-white text-ink hover:bg-paper active:translate-y-[2px] active:shadow-none",
                    status === "correct" && "animate-pop-in border-emerald-500 bg-emerald-50 text-emerald-900",
                    status === "wrong" && "border-rose-500 bg-rose-50 text-rose-900",
                    status === "muted" && "border-paper-line bg-white text-ink-mute opacity-55",
                  )}
                >
                  <span
                    className={cn(
                      "grid shrink-0 place-items-center rounded-lg text-xs font-extrabold text-white",
                      compact ? "h-6 w-6" : "h-7 w-7",
                    )}
                    style={{
                      background:
                        status === "correct" ? "#10b981" : status === "wrong" ? "#f43f5e" : color,
                    }}
                  >
                    {status === "correct" ? (
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : status === "wrong" ? (
                      <X className="h-3.5 w-3.5" strokeWidth={3} />
                    ) : (
                      LETTERS[index]
                    )}
                  </span>
                  <span className="leading-tight">{option}</span>
                </button>
              );
            })}

            {allowReview && (racer.history.length > 0 || reviewing) ? (
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={onReviewBack}
                  disabled={!!feedback || (reviewing && racer.reviewIndex === 0)}
                  className="flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-extrabold text-ink-soft transition hover:bg-paper disabled:opacity-35"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> {labels.reviewBack}
                </button>
                {reviewing ? (
                  <button
                    type="button"
                    onClick={onReviewForward}
                    className="flex items-center gap-1 rounded-lg bg-ink px-2 py-1 text-[11px] font-extrabold text-white hover:bg-ink-soft"
                  >
                    {labels.reviewLive} <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
