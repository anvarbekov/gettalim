"use client";

import { PracticeQuiz } from "@/components/practice/PracticeQuiz";
import { FISHING_ITEMS } from "@/lib/practice/quiz/fishing";

export default function FishingPage() {
  return (
    <PracticeQuiz
      title="Firibgar xatni topish"
      emoji="🎣"
      color="#d2402f"
      intro="Har bir xabarda belgilar bor: manzil, havola, shoshiltirish va nima so'ralayotgani. O'shalarni toping."
      packId="mashq-fishing"
      items={FISHING_ITEMS}
    />
  );
}
