"use client";

import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { AnsweredItem, TeamState } from "@/hooks/useMatch";
import { cn, normalizeAnswer } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export interface TeamPanelLabels {
  hint: string;
  reviewBack: string;
  reviewLive: string;
  reviewTitle: string;
  correctWas: string;
  yourAnswer: string;
}

export interface TeamPanelProps {
  side: "a" | "b";
  name: string;
  team: TeamState;
  disabled: boolean;
  allowReview: boolean;
  labels: TeamPanelLabels;
  onAnswer: (choice: string) => void;
  onReviewBack: () => void;
  onReviewForward: () => void;
}

export function TeamPanel({
  side,
  name,
  team,
  disabled,
  allowReview,
  labels,
  onAnswer,
  onReviewBack,
  onReviewForward,
}: TeamPanelProps) {
  const isA = side === "a";
  const reviewing = team.reviewIndex !== null;
  const reviewed: AnsweredItem | null = reviewing ? team.history[team.reviewIndex as number] ?? null : null;

  const item = reviewed ? reviewed.item : team.current;
  const feedback = team.feedback;

  const headerClass = isA ? "bg-teamA" : "bg-teamB";
  const promptClass = isA ? "bg-teamA-soft text-teamA-deep" : "bg-teamB-soft text-teamB-deep";
  const badgeClass = isA ? "bg-teamA" : "bg-teamB";

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
    <section
      className={cn(
        "surface flex h-full flex-col overflow-hidden",
        reviewing && "ring-2 ring-ink/15",
      )}
      aria-label={name}
    >
      <header className={cn("flex items-center justify-between gap-2 px-4 py-3 text-white", headerClass)}>
        <h2 className="truncate text-lg font-extrabold">{name}</h2>
        <div className="flex items-center gap-2">
          {team.streak > 1 ? (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-extrabold">×{team.streak}</span>
          ) : null}
          <span className="grid h-9 min-w-9 place-items-center rounded-full bg-white px-2 text-lg font-extrabold text-ink">
            {team.pull}
          </span>
        </div>
      </header>

      {reviewing ? (
        <div className="flex items-center justify-between gap-2 bg-ink px-4 py-1.5 text-xs font-extrabold text-white">
          <span>
            {labels.reviewTitle} {(team.reviewIndex as number) + 1}/{team.history.length}
          </span>
          <span className={reviewed?.ok ? "text-emerald-300" : "text-rose-300"}>
            {reviewed?.ok ? "✓" : "✕"} {labels.yourAnswer}: {reviewed?.chosen}
          </span>
        </div>
      ) : null}

      <div className={cn("px-4 py-4 text-center", promptClass)}>
        <p className="text-balance text-xl font-extrabold leading-snug sm:text-2xl">{item.question.prompt}</p>
        {item.question.hint ? (
          <p className="mt-1 text-xs font-bold opacity-70">
            {labels.hint}: {item.question.hint}
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {item.options.map((option, index) => {
          const status = stateFor(option);
          return (
            <button
              key={`${item.key}-${option}`}
              type="button"
              disabled={disabled || reviewing || !!feedback}
              onClick={() => onAnswer(option)}
              className={cn(
                "flex min-h-[3.1rem] flex-1 items-center gap-3 rounded-xl border-2 px-3 py-2 text-left",
                "text-base font-bold shadow-key transition",
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
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-extrabold text-white",
                  status === "correct" && "bg-emerald-500",
                  status === "wrong" && "bg-rose-500",
                  (status === "idle" || status === "muted") && badgeClass,
                )}
              >
                {status === "correct" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : status === "wrong" ? (
                  <X className="h-4 w-4" strokeWidth={3} />
                ) : (
                  LETTERS[index]
                )}
              </span>
              <span className="leading-tight">{option}</span>
            </button>
          );
        })}

        {allowReview && (team.history.length > 0 || reviewing) ? (
          <div className="mt-1 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onReviewBack}
              disabled={!!feedback || (reviewing && team.reviewIndex === 0)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-extrabold text-ink-soft transition hover:bg-paper disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" /> {labels.reviewBack}
            </button>
            {reviewing ? (
              <button
                type="button"
                onClick={onReviewForward}
                className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-ink-soft"
              >
                {labels.reviewLive} <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
