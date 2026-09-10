"use client";

import { PracticeQuiz } from "@/components/practice/PracticeQuiz";
import { PARTS_ITEMS } from "@/lib/practice/quiz/parts";

export default function PartsPage() {
  return (
    <PracticeQuiz
      title="Kompyuter qismlari"
      emoji="🖥️"
      color="#1f6fd0"
      intro="Qurilmani tanish oson, vazifasini bilish esa muhimroq. Har javobdan keyin tushuntirish o'qing."
      packId="mashq-qismlar"
      items={PARTS_ITEMS}
    />
  );
}
