"use client";

import { useRef, useState } from "react";
import { ExternalLink, Paperclip } from "lucide-react";
import { Field, Input } from "@/components/ui/card";
import { WorkFiles } from "@/components/works/WorkFiles";
import { uploadFile } from "@/lib/chat/upload";
import { GETMOTION_URL, isGetMotion } from "@/lib/links";
import type { WorkFile } from "@/lib/works/api";

/**
 * Matn + havola + fayllar muharriri.
 * O'quvchi ishi, uy vazifasi materiallari va topshiriq javobi — hammasi shu.
 */

export interface Attachments {
  body: string;
  link: string;
  files: WorkFile[];
}

export function AttachmentEditor({
  value,
  onChange,
  folder,
  bodyLabel = "Izoh (ixtiyoriy)",
  bodyPlaceholder = "Qisqacha yozing…",
  maxFiles = 10,
  onBusyChange,
}: {
  value: Attachments;
  onChange: (next: Attachments) => void;
  folder: "ishlar" | "vazifalar";
  bodyLabel?: string;
  bodyPlaceholder?: string;
  maxFiles?: number;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [uploading, setUploading] = useState<{ name: string; percent: number } | null>(null);
  const [note, setNote] = useState("");
  const input = useRef<HTMLInputElement>(null);
  // Bir nechta fayl ketma-ket yuklanadi — har safar eng so'nggi qiymatga qo'shamiz
  const latest = useRef(value);
  latest.current = value;

  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list).slice(0, Math.max(0, maxFiles - value.files.length));
    setNote("");
    onBusyChange?.(true);
    for (const file of files) {
      setUploading({ name: file.name, percent: 0 });
      const res = await uploadFile(file, {
        folder,
        onProgress: (percent) => setUploading({ name: file.name, percent }),
      });
      if (!res.ok) {
        setNote(`${file.name}: ${res.error}`);
        break;
      }
      const { url, name, size, kind } = res.file;
      latest.current = { ...latest.current, files: [...latest.current.files, { url, name, size, kind }] };
      onChange(latest.current);
    }
    setUploading(null);
    onBusyChange?.(false);
    if (input.current) input.current.value = "";
  };

  return (
    <div className="grid gap-4">
      <Field label={bodyLabel}>
        <textarea
          value={value.body}
          onChange={(e) => onChange({ ...value, body: e.target.value })}
          rows={3}
          maxLength={4000}
          placeholder={bodyPlaceholder}
          className="w-full rounded-xl border-2 border-paper-line bg-white px-3.5 py-2.5 text-base text-ink outline-none focus:border-teamA focus:ring-4 focus:ring-teamA/15"
        />
      </Field>

      <div>
        <Field label="Havola (ixtiyoriy)" hint="GetMotion, Scratch, Google Docs, YouTube yoki boshqa manzil">
          <Input
            value={value.link}
            onChange={(e) => onChange({ ...value, link: e.target.value })}
            placeholder="https://…"
            inputMode="url"
          />
        </Field>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <a
            href={GETMOTION_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 font-extrabold text-violet-800 ring-1 ring-violet-200 hover:bg-violet-100"
          >
            🎬 GetMotion'ni ochish <ExternalLink className="h-3 w-3" />
          </a>
          {folder === "vazifalar" && !value.link ? (
            <button
              type="button"
              onClick={() => onChange({ ...value, link: GETMOTION_URL })}
              className="rounded-full bg-paper px-3 py-1.5 font-bold text-ink-soft ring-1 ring-paper-line hover:bg-white"
            >
              GetMotion havolasini qo'yish
            </button>
          ) : null}
          {isGetMotion(value.link) && folder === "ishlar" ? (
            <span className="font-bold text-violet-700">✓ GetMotion loyihasi</span>
          ) : null}
        </div>
      </div>

      <div>
        <span className="eyebrow mb-1.5 block">
          Fayllar ({value.files.length}/{maxFiles})
        </span>
        <WorkFiles
          files={value.files}
          onRemove={(i) => onChange({ ...value, files: value.files.filter((_, j) => j !== i) })}
        />
        {uploading ? (
          <div className="mt-2 rounded-xl bg-paper px-3 py-2 text-sm">
            <div className="flex justify-between gap-2 font-bold text-ink">
              <span className="truncate">{uploading.name}</span>
              <span>{uploading.percent}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full bg-teamA transition-[width]" style={{ width: `${uploading.percent}%` }} />
            </div>
          </div>
        ) : null}
        <input ref={input} type="file" multiple hidden onChange={(e) => void pick(e.target.files)} />
        {value.files.length < maxFiles ? (
          <button
            type="button"
            disabled={!!uploading}
            onClick={() => input.current?.click()}
            className="mt-2 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-xl border-2 border-dashed border-paper-line px-3 py-4 font-bold text-ink-soft hover:bg-paper disabled:opacity-50"
          >
            <Paperclip className="h-5 w-5" /> Fayl qo'shish
            <span className="text-sm font-normal text-ink-mute">rasm, video, hujjat, arxiv — 25 MB gacha</span>
          </button>
        ) : null}
        {note ? <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">{note}</p> : null}
      </div>
    </div>
  );
}
