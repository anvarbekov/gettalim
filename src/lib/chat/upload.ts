"use client";

import type { MessageKind } from "@/lib/chat/api";

/**
 * Fayl yuklash.
 *
 * Fayl brauzerdan **to'g'ridan-to'g'ri** Cloudinary'ga ketadi. Bizning
 * serverimiz faqat imzo beradi — katta fayl u orqali o'tmaydi, shuning uchun
 * yuklash tez va server yuklanmaydi.
 */

export interface Uploaded {
  url: string;
  name: string;
  size: number;
  kind: MessageKind;
  /** Ovoz/video uzunligi (soniya). */
  duration?: number;
}

/** Fayl turidan xabar turini aniqlaydi. */
export function kindOf(file: File): MessageKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "voice";
  return "file";
}

export async function uploadFile(
  file: File,
  options: { folder?: string; duration?: number; onProgress?: (percent: number) => void } = {},
): Promise<{ ok: true; file: Uploaded } | { ok: false; error: string }> {
  const kind = kindOf(file);

  // Hujjat va arxivlar `raw` sifatida yuklanadi — Cloudinary ularni
  // o'zgartirmaydi, aks holda .docx buzilib qolishi mumkin.
  const resourceType = kind === "file" ? "raw" : "auto";

  let sign: {
    cloud: string;
    apiKey: string;
    timestamp: number;
    folder: string;
    signature: string;
    resourceType: string;
    error?: string;
  };

  try {
    const response = await fetch("/api/chat/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: options.folder ?? "chat", size: file.size, resourceType }),
    });
    sign = await response.json();
    if (!response.ok) return { ok: false, error: sign.error ?? "Yuklab bo'lmadi" };
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi" };
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("folder", sign.folder);
  form.append("signature", sign.signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${sign.cloud}/${sign.resourceType}/upload`;

  // `fetch` yuklash jarayonini ko'rsata olmaydi, shuning uchun XHR
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) options.onProgress?.(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as {
          secure_url?: string;
          duration?: number;
          error?: { message?: string };
        };
        if (!data.secure_url) {
          resolve({ ok: false, error: data.error?.message ?? "Yuklab bo'lmadi" });
          return;
        }
        resolve({
          ok: true,
          file: {
            url: data.secure_url,
            name: file.name,
            size: file.size,
            kind,
            duration: options.duration ?? (data.duration ? Math.round(data.duration) : undefined),
          },
        });
      } catch {
        resolve({ ok: false, error: "Javobni o'qib bo'lmadi" });
      }
    };

    xhr.onerror = () => resolve({ ok: false, error: "Tarmoq xatosi" });
    xhr.send(form);
  });
}

/** Hajmni o'qiladigan ko'rinishga o'tkazadi. */
export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Soniyani 1:05 ko'rinishiga o'tkazadi. */
export function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
