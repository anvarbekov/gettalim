"use client";

import { ExternalLink, FileText, Link2, Music, X } from "lucide-react";
import { humanSize } from "@/lib/chat/upload";
import { isGetMotion } from "@/lib/links";
import type { WorkFile } from "@/lib/works/api";

/**
 * Cloudinary rasmini kichik nusxada oladi — sahifa yengil ochiladi.
 * Asl fayl bosilganda to'liq hajmda ochiladi.
 */
export function thumb(url: string, width = 480): string {
  return url.includes("/image/upload/")
    ? url.replace("/image/upload/", `/image/upload/c_limit,w_${width},q_auto,f_auto/`)
    : url;
}

export function WorkFiles({
  files,
  link,
  onRemove,
}: {
  files: WorkFile[];
  link?: string | null;
  onRemove?: (index: number) => void;
}) {
  const images = files.map((f, i) => ({ f, i })).filter(({ f }) => f.kind === "image");
  const videos = files.map((f, i) => ({ f, i })).filter(({ f }) => f.kind === "video");
  const others = files.map((f, i) => ({ f, i })).filter(({ f }) => f.kind !== "image" && f.kind !== "video");

  if (!files.length && !link) return null;

  return (
    <div className="mt-3 grid gap-2">
      {images.length ? (
        <div className="flex flex-wrap gap-2">
          {images.map(({ f, i }) => (
            <div key={f.url} className="relative">
              <a href={f.url} target="_blank" rel="noreferrer" title={f.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumb(f.url)}
                  alt={f.name}
                  loading="lazy"
                  decoding="async"
                  className="h-28 w-28 rounded-xl border-2 border-paper-line object-cover sm:h-32 sm:w-32"
                />
              </a>
              {onRemove ? <RemoveButton onClick={() => onRemove(i)} /> : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Video — faqat bosilganda yuklanadi (preload="none"), sahifa og'irlashmaydi */}
      {videos.map(({ f, i }) => (
        <div key={f.url} className="relative max-w-xl">
          <video
            src={f.url}
            controls
            preload="none"
            playsInline
            className="aspect-video w-full rounded-xl border-2 border-paper-line bg-ink"
          />
          <span className="mt-1 block truncate text-xs text-ink-mute">
            🎞 {f.name} · {humanSize(f.size)}
          </span>
          {onRemove ? <RemoveButton onClick={() => onRemove(i)} /> : null}
        </div>
      ))}

      {others.map(({ f, i }) => {
        const Icon = f.kind === "voice" ? Music : FileText;
        return (
          <div key={f.url} className="relative flex items-center gap-2">
            <a
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border-2 border-paper-line bg-white px-3 py-2 hover:bg-paper"
            >
              <Icon className="h-5 w-5 shrink-0 text-ink-soft" />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{f.name}</span>
              <span className="shrink-0 text-xs text-ink-mute">{humanSize(f.size)}</span>
            </a>
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(i)}
                title="Olib tashlash"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        );
      })}

      {link && isGetMotion(link) ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3.5 py-2.5 text-white hover:opacity-95"
        >
          <span className="text-2xl" aria-hidden>
            🎬
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold">GetMotion loyihasi</span>
            <span className="block truncate text-xs text-white/80">{link}</span>
          </span>
          <ExternalLink className="h-4 w-4 shrink-0" />
        </a>
      ) : link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-bold text-teamA hover:bg-paper"
        >
          <Link2 className="h-5 w-5 shrink-0" />
          <span className="min-w-0 truncate">{link}</span>
        </a>
      ) : null}
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Olib tashlash"
      className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-ink text-white shadow"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export function GradeBadge({ grade, className = "" }: { grade: number | null; className?: string }) {
  if (grade == null) {
    return (
      <span className={`rounded-full bg-paper px-2.5 py-1 text-xs font-extrabold text-ink-mute ${className}`}>
        Baholanmagan
      </span>
    );
  }
  const tone =
    grade === 5
      ? "bg-emerald-500 text-white"
      : grade === 4
        ? "bg-sky-500 text-white"
        : grade === 3
          ? "bg-amber-400 text-ink"
          : "bg-rose-500 text-white";
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-xl font-bold ${tone} ${className}`}
      title={`Baho: ${grade}`}
    >
      {grade}
    </span>
  );
}
