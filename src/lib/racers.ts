"use client";

export type RacerKind = "horse" | "car";

/**
 * Rasm versiyasi. `public/img/` dagi biror rasmni almashtirsangiz, shu raqamni
 * oshiring — shunda brauzer eski nusxani keshdan olmaydi.
 */
export const ASSET_VERSION = "5";
const v = (src: string) => `${src}?v=${ASSET_VERSION}`;

export interface RacerModel {
  kind: RacerKind;
  /** 1..4 — jamoa raqami. */
  lane: number;
  src: string;
  /** Rasmning eng/bo'y nisbati — chiziqda joy hisoblash uchun. */
  aspect: number;
}

export interface RacerSet {
  kind: RacerKind;
  name: Record<"uz" | "ru" | "en", string>;
  /** Yo'lakcha balandligiga nisbatan o'lcham (mashinalar uzun, shuning uchun pastroq). */
  scale: number;
  models: RacerModel[];
}

/** Jamoa ranglari — yo'lakchalar shu tartibda bo'yaladi. */
export const LANE_COLORS = ["#1f6fd0", "#d2402f", "#e0a92e", "#1f9d63"];

export const RACER_SETS: RacerSet[] = [
  {
    kind: "horse",
    name: { uz: "Otlar", ru: "Лошади", en: "Horses" },
    scale: 0.94,
    models: [
      { kind: "horse", lane: 1, src: v("/img/horse-1.webp"), aspect: 273 / 220 },
      { kind: "horse", lane: 2, src: v("/img/horse-2.webp"), aspect: 270 / 220 },
      { kind: "horse", lane: 3, src: v("/img/horse-3.webp"), aspect: 294 / 220 },
      { kind: "horse", lane: 4, src: v("/img/horse-4.webp"), aspect: 306 / 220 },
    ],
  },
  {
    kind: "car",
    name: { uz: "Mashinalar", ru: "Машины", en: "Cars" },
    scale: 0.72,
    models: [
      { kind: "car", lane: 1, src: v("/img/supercar-1.webp"), aspect: 713 / 220 },
      { kind: "car", lane: 2, src: v("/img/supercar-2.webp"), aspect: 756 / 220 },
      { kind: "car", lane: 3, src: v("/img/supercar-3.webp"), aspect: 746 / 220 },
      { kind: "car", lane: 4, src: v("/img/supercar-4.webp"), aspect: 762 / 220 },
    ],
  },
];

export const getRacerSet = (kind: RacerKind) => RACER_SETS.find((s) => s.kind === kind) ?? RACER_SETS[0];

export const getRacer = (kind: RacerKind, lane: number): RacerModel => {
  const set = getRacerSet(kind);
  return set.models[(lane - 1) % set.models.length];
};
