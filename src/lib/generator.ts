import type { GeneratorConfig, Question } from "./types";
import { uid } from "./utils";

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generator paketlari uchun bitta yangi misol yaratadi.
 * Savollar tugamaydi — har chaqiruvda yangi son tanlanadi.
 */
export function generateQuestion(cfg: GeneratorConfig): Question {
  const op = cfg.ops[rnd(0, cfg.ops.length - 1)];
  const { min, max } = cfg;

  if (op === "+") {
    const a = rnd(min, max);
    const b = rnd(min, max);
    return { id: uid("g"), type: "number", prompt: `${a} + ${b} = ?`, answer: String(a + b) };
  }

  if (op === "-") {
    let a = rnd(min, max);
    let b = rnd(min, max);
    if (cfg.noNegative !== false && b > a) [a, b] = [b, a];
    return { id: uid("g"), type: "number", prompt: `${a} − ${b} = ?`, answer: String(a - b) };
  }

  if (op === "*") {
    const a = rnd(min, max);
    const b = rnd(min, max);
    return { id: uid("g"), type: "number", prompt: `${a} × ${b} = ?`, answer: String(a * b) };
  }

  // Bo'lish — natija butun bo'lishi uchun ko'paytmadan boshlaymiz
  const b = rnd(Math.max(2, min), max);
  const result = rnd(min, max);
  return { id: uid("g"), type: "number", prompt: `${b * result} : ${b} = ?`, answer: String(result) };
}
