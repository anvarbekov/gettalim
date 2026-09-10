"use client";

import { PracticeQuiz } from "@/components/practice/PracticeQuiz";
import { EXCEL_ITEMS } from "@/lib/practice/quiz/excel";

export default function ExcelPage() {
  return (
    <PracticeQuiz
      title="Excel formulalari"
      emoji="📊"
      color="#1f9d63"
      intro="Jadvalni ko'rib turib javob bering. Formulani yodlash emas, ishlash mantiqini tushunish kerak."
      packId="mashq-excel"
      items={EXCEL_ITEMS}
    />
  );
}
