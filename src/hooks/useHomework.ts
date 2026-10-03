"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { awardXp, checkAchievements, homeworkXp, type XpResult } from "@/lib/gamification/api";
import { getAssignment, saveSubmission, type AssignmentView } from "@/lib/homework/api";
import { fetchCloudPack } from "@/lib/homework/packs";
import type { Pack } from "@/lib/types";

export interface HomeworkContext {
  assignment: AssignmentView;
  pack: Pack;
}

/**
 * Uy vazifasi rejimi.
 *
 * O'yin sahifasi `?vazifa=<id>` bilan ochilsa, savollar bulutdan olinadi
 * (o'quvchi qurilmasida paket yo'q) va o'yin tugagach natija jurnalga yoziladi.
 */
export function useHomework(assignmentId: string | null) {
  const { user } = useAuth();
  const [context, setContext] = useState<HomeworkContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(assignmentId));

  useEffect(() => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }
    let alive = true;

    void (async () => {
      const assignment = await getAssignment(assignmentId);
      if (!alive) return;
      if (!assignment) {
        setError("Topshiriq topilmadi yoki sizga berilmagan.");
        setLoading(false);
        return;
      }

      const pack = assignment.pack_id ? await fetchCloudPack(assignment.pack_id) : null;
      if (!alive) return;
      if (!pack || pack.questions.length === 0) {
        setError("Topshiriq savollari yuklanmadi.");
        setLoading(false);
        return;
      }

      setContext({ assignment, pack });
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [assignmentId]);

  const submitted = useRef(false);
  const [reward, setReward] = useState<{ xp: XpResult; earned: string[] } | null>(null);

  /** Natijani bir marta yozadi — qayta chizilishda takrorlanmaydi. */
  const submit = useCallback(
    async (score: number, maxScore: number, details: Record<string, unknown> = {}) => {
      if (!context || !user || submitted.current) return;
      submitted.current = true;

      await saveSubmission({
        assignmentId: context.assignment.id,
        studentId: user.id,
        score,
        maxScore,
        details,
      });

      // XP va nishonlar — hisob-kitob bazada bajariladi
      const xp = await awardXp(homeworkXp(score, maxScore));
      const earned = await checkAchievements({
        gameId: context.assignment.game_id,
        score,
        maxScore,
        correct: Number(details.correct ?? 0),
        wrong: Number(details.wrong ?? 0),
      });
      if (xp) setReward({ xp, earned });
    },
    [context, user],
  );

  return { context, loading, error, submit, reward, isHomework: Boolean(assignmentId) };
}
