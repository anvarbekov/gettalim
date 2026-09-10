"use client";

export interface CharacterModel {
  id: string;
  name: string;
  /** Chap tomon (o'ngga qarab tortadi) uchun rasm. */
  leftSrc: string;
  /** O'ng tomon uchun rasm. Bo'lmasa `leftSrc` gorizontal aylantiriladi. */
  rightSrc?: string;
  /** Chap rasmda arqon (musht) balandligi — rasm balandligining ulushi (0..1). */
  ropeRatio: number;
  /** O'ng rasmdagi balandlik. Berilmasa `ropeRatio` ishlatiladi. */
  ropeRatioRight?: number;
  /** Arqon qalinligi — rasm balandligining ulushi. */
  ropeThickness?: number;
  /** Chap rasmda musht qayerda — rasm kengligining ulushi (0..1). */
  gripX?: number;
  /** O'ng rasmdagi musht joyi. Berilmasa `1 - gripX`. */
  gripXRight?: number;
  /** Orqa qatordagi personaj uchun rasm (arqon dumi bilan). Berilmasa oldingisi ishlatiladi. */
  backLeftSrc?: string;
  backRightSrc?: string;
  builtin?: boolean;
}

/**
 * Tayyor modellar. Yangi personaj qo'shish uchun:
 *   1. Shaffof fonli PNG'ni `public/img/` ga soling
 *   2. Shu ro'yxatga bitta yozuv qo'shing (yoki dastur ichidan «Rasm yuklash»)
 * `ropeRatio` — rasmdagi arqonning tepadan hisoblangan balandlik ulushi.
 */
/** Rasm versiyasi — kesh uchun (`racers.ts` dagi bilan bir xil mantiq). */
export const ASSET_VERSION = "4";
const v = (src: string) => `${src}?v=${ASSET_VERSION}`;

export const BUILTIN_CHARACTERS: CharacterModel[] = [
  {
    id: "bola",
    name: "O'g'il bolalar",
    leftSrc: v("/img/puller-left.png"),
    rightSrc: v("/img/puller-right.png"),
    backLeftSrc: v("/img/puller-left-back.png"),
    backRightSrc: v("/img/puller-right-back.png"),
    ropeRatio: 0.4593,
    ropeRatioRight: 0.4703,
    ropeThickness: 0.025,
    gripX: 0.7726,
    gripXRight: 0.2254,
    builtin: true,
  },
  {
    id: "qiz",
    name: "Qizlar",
    leftSrc: v("/img/girl-left.png"),
    rightSrc: v("/img/girl-right.png"),
    backLeftSrc: v("/img/girl-left-back.png"),
    backRightSrc: v("/img/girl-right-back.png"),
    ropeRatio: 0.4118,
    ropeRatioRight: 0.4404,
    ropeThickness: 0.027,
    gripX: 0.7940,
    gripXRight: 0.2343,
    builtin: true,
  },
];

const KEY = "arqon.characters.v1";

export function getCustomCharacters(): CharacterModel[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CharacterModel[]) : [];
  } catch {
    return [];
  }
}

export function getAllCharacters(): CharacterModel[] {
  return [...BUILTIN_CHARACTERS, ...getCustomCharacters()];
}

export function getCharacter(id: string): CharacterModel {
  return getAllCharacters().find((c) => c.id === id) ?? BUILTIN_CHARACTERS[0];
}

export function saveCustomCharacter(model: CharacterModel) {
  if (typeof window === "undefined") return;
  const list = getCustomCharacters();
  const index = list.findIndex((c) => c.id === model.id);
  if (index >= 0) list[index] = model;
  else list.push(model);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* rasm juda katta bo'lsa saqlanmaydi */
  }
}

export function removeCustomCharacter(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(getCustomCharacters().filter((c) => c.id !== id)));
}

/** Yuklangan rasmni kichraytirib data-URL qaytaradi (localStorage cheklovi uchun). */
export function fileToScaledDataUrl(file: File, maxHeight = 640): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasmni ochib bo'lmadi"));
      img.onload = () => {
        const scale = Math.min(1, maxHeight / img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas mavjud emas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
