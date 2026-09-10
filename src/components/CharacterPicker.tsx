/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Upload, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/card";
import {
  fileToScaledDataUrl,
  getAllCharacters,
  removeCustomCharacter,
  saveCustomCharacter,
  type CharacterModel,
} from "@/lib/characters";
import { cn, uid } from "@/lib/utils";

function Thumb({ model, flip }: { model: CharacterModel; flip?: boolean }) {
  const src = flip && model.rightSrc ? model.rightSrc : model.leftSrc;
  return (
    <img
      src={src}
      alt={model.name}
      className="h-20 w-auto object-contain"
      style={{ transform: flip && !model.rightSrc ? "scaleX(-1)" : undefined }}
    />
  );
}

export function CharacterPicker({
  side,
  value,
  onChange,
}: {
  side: "a" | "b";
  value: string;
  onChange: (id: string) => void;
}) {
  const { t } = useI18n();
  const [models, setModels] = useState<CharacterModel[]>([]);
  const [uploading, setUploading] = useState(false);

  const refresh = () => setModels(getAllCharacters());
  useEffect(refresh, []);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 scroll-slim">
        {models.map((model) => {
          const active = model.id === value;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onChange(model.id)}
              className={cn(
                "group relative flex w-28 shrink-0 flex-col items-center gap-1 rounded-xl border-2 p-2 transition",
                active
                  ? side === "a"
                    ? "border-teamA bg-teamA-soft"
                    : "border-teamB bg-teamB-soft"
                  : "border-paper-line bg-white hover:bg-paper",
              )}
            >
              <Thumb model={model} flip={side === "b"} />
              <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight text-ink-soft">
                {model.name}
              </span>
              {!model.builtin ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCustomCharacter(model.id);
                    if (active) onChange("bola");
                    refresh();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
                  className="absolute right-1 top-1 hidden rounded-md bg-white/90 p-1 text-teamB shadow group-hover:block"
                  aria-label={t("packs.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setUploading(true)}
          className="flex w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-paper-line bg-white p-2 text-ink-mute transition hover:border-ink/30 hover:text-ink"
        >
          <Upload className="h-6 w-6" />
          <span className="text-[11px] font-bold leading-tight">{t("char.upload")}</span>
        </button>
      </div>

      {uploading ? (
        <CharacterUpload
          onClose={() => setUploading(false)}
          onSaved={(model) => {
            refresh();
            onChange(model.id);
            setUploading(false);
          }}
        />
      ) : null}
    </div>
  );
}

function CharacterUpload({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (model: CharacterModel) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const [ratio, setRatio] = useState(0.46);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (file: File) => {
    setError(null);
    try {
      const dataUrl = await fileToScaledDataUrl(file);
      setSrc(dataUrl);
      if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const save = () => {
    if (!src) return;
    const model: CharacterModel = {
      id: uid("char"),
      name: name.trim() || t("char.custom"),
      leftSrc: src,
      ropeRatio: ratio,
    };
    saveCustomCharacter(model);
    onSaved(model);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-ink/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg animate-pop-in rounded-xl2 bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-ink">{t("char.uploadTitle")}</h3>
            <p className="mt-1 text-sm text-ink-mute">{t("char.uploadHint")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink-mute hover:bg-paper"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/webp,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pick(file);
          }}
        />

        {src ? (
          <div className="relative mt-4 grid h-56 place-items-center rounded-xl border-2 border-paper-line bg-paper">
            <img src={src} alt="" className="h-52 w-auto object-contain" />
            {/* Arqon balandligi ko'rsatkichi */}
            <div
              className="rope-line pointer-events-none absolute inset-x-4 h-[6px]"
              style={{ top: `calc(2rem + ${ratio} * 13rem)` }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-4 grid h-40 w-full place-items-center rounded-xl border-2 border-dashed border-paper-line text-ink-mute hover:border-ink/30 hover:text-ink"
          >
            <span className="flex flex-col items-center gap-2">
              <Upload className="h-7 w-7" />
              <span className="text-sm font-bold">{t("import.file")}</span>
            </span>
          </button>
        )}

        {src ? (
          <div className="mt-4 grid gap-4">
            <Field label={t("char.name")}>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={28} />
            </Field>
            <Field label={t("char.ropeHeight")} hint={t("char.ropeHint")}>
              <input
                type="range"
                min={10}
                max={90}
                value={Math.round(ratio * 100)}
                onChange={(e) => setRatio(Number(e.target.value) / 100)}
                className="w-full accent-teamA"
              />
            </Field>
            <button type="button" onClick={() => fileRef.current?.click()} className="link-quiet text-sm font-bold">
              {t("char.another")}
            </button>
          </div>
        ) : null}

        {error ? <p className="mt-3 text-sm font-bold text-teamB">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="dark" disabled={!src} onClick={save}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
