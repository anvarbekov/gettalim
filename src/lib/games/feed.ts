import { generateQuestion } from "@/lib/generator";
import { answerPool, buildQuizItem, type QuizItem } from "@/lib/quiz";
import type { Pack, Question } from "@/lib/types";
import { shuffle, uid } from "@/lib/utils";

/**
 * Savol oqimi — har bir jamoa (yo'lakcha) uchun alohida navbat yuritadi.
 *
 * Bitta joyda turgani uchun uchala o'yin ham bir xil qoidalarga bo'ysunadi:
 *  - jamoalar boshqa-boshqa savoldan boshlaydi;
 *  - ayni damda ekranda turgan savol boshqa jamoaga tushmaydi;
 *  - navbat tugaganda savollar qayta aralashtiriladi;
 *  - generatorli paketlarda (arifmetika) savollar cheksiz yaratiladi.
 */
export interface QuestionFeed {
  next(lane: number): QuizItem;
  /** Savolni ekrandan olib tashlash — boshqa jamoa uni olishi mumkin bo'ladi. */
  release(lane: number): void;
}

const FALLBACK: QuizItem = {
  key: "empty",
  question: { id: "empty", type: "choice", prompt: "—", answer: "—" },
  options: ["—"],
  answer: "—",
};

export function createFeed(pack: Pack | undefined, lanes: number, shuffleOn: boolean): QuestionFeed {
  const base: Question[] = pack?.questions ?? [];
  const pool = answerPool(base);

  const queues: Question[][] = Array.from({ length: lanes }, (_, i) => {
    const queue = shuffleOn ? shuffle(base) : [...base];
    // har bir jamoa navbatning boshqa nuqtasidan boshlaydi
    const offset = Math.floor((queue.length / Math.max(1, lanes)) * i);
    return [...queue.slice(offset), ...queue.slice(0, offset)];
  });
  const cursors: number[] = Array.from({ length: lanes }, () => 0);
  const active: (string | null)[] = Array.from({ length: lanes }, () => null);

  return {
    next(lane) {
      if (!pack) return FALLBACK;
      if (pack.generator) return buildQuizItem(generateQuestion(pack.generator));

      const queue = queues[lane] ?? [];
      if (!queue.length) return FALLBACK;

      let question = queue[cursors[lane] % queue.length];
      for (let tries = 0; tries < queue.length; tries += 1) {
        const busy = active.some((id, i) => i !== lane && id === question.id);
        if (!busy) break;
        cursors[lane] += 1;
        question = queue[cursors[lane] % queue.length];
      }

      cursors[lane] += 1;
      active[lane] = question.id;
      if (cursors[lane] % queue.length === 0 && shuffleOn) {
        queues[lane] = shuffle(queue);
      }
      return buildQuizItem({ ...question, id: `${question.id}_${uid("r")}` }, pool);
    },

    release(lane) {
      if (lane >= 0 && lane < active.length) active[lane] = null;
    },
  };
}
