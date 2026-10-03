"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileUp, X } from "lucide-react";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/card";
import { parsePackJson, SAMPLE_JSON } from "@/lib/packIO";
import { savePack } from "@/lib/storage";
import type { Pack } from "@/lib/types";

export function JsonImport({ onDone, onClose }: { onDone: (pack: Pack) => void; onClose: () => void }) {
  const { t } = useI18n();
  const [raw, setRaw] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ok, setOk] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = async (file: File) => {
    const text = await file.text();
    setRaw(text);
    setErrors([]);
    setOk(null);
  };

  const apply = () => {
    const result = parsePackJson(raw);
    setErrors(result.errors);
    setWarnings(result.warnings);
    if (result.pack) {
      savePack(result.pack);
      setOk(result.pack.questions.length);
      onDone(result.pack);
    } else {
      setOk(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-auto bg-ink/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl animate-pop-in rounded-xl2 bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">{t("import.title")}</h2>
            <p className="mt-1 text-sm text-ink-mute">
              {t("import.format")}: <code className="font-mono">{`{ title, subject, questions: [...] }`}</code>
            </p>
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

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void readFile(file);
            }}
          />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <FileUp className="h-4 w-4" /> {t("import.file")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRaw(SAMPLE_JSON)}>
            {t("import.sample")}
          </Button>
        </div>

        <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-xs leading-relaxed text-ink-mute">
          {t("quiz.note")}
        </p>

        <Textarea
          className="mt-3 h-72"
          spellCheck={false}
          placeholder={t("import.paste")}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setOk(null);
          }}
        />

        {errors.length ? (
          <div className="mt-3 rounded-xl border-2 border-teamB/40 bg-teamB-soft p-3">
            <p className="flex items-center gap-2 font-extrabold text-teamB-deep">
              <AlertTriangle className="h-4 w-4" /> {t("import.errors")}
            </p>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-teamB-deep">
              {errors.slice(0, 8).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {warnings.length ? (
          <div className="mt-3 rounded-xl border-2 border-gold/40 bg-gold/10 p-3 text-sm font-bold text-ink-soft">
            {warnings.join(" · ")}
          </div>
        ) : null}

        {ok !== null ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border-2 border-teamA/30 bg-teamA-soft p-3 font-extrabold text-teamA-deep">
            <CheckCircle2 className="h-5 w-5" /> {t("import.ok", { n: ok })}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button variant="dark" onClick={apply} disabled={!raw.trim()}>
            {t("import.check")}
          </Button>
        </div>
      </div>
    </div>
  );
}
