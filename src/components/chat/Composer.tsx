"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Mic, Paperclip, Send, Smile, Square, Trash2, X } from "lucide-react";
import { clock, humanSize, kindOf, uploadFile } from "@/lib/chat/upload";
import type { MessageKind } from "@/lib/chat/api";
import { STICKERS } from "@/lib/chat/stickers";
import { cn } from "@/lib/utils";

/**
 * Xabar yozish paneli: matn, fayl va ovozli xabar.
 *
 * Ovoz brauzerning `MediaRecorder` i bilan yoziladi va `opus` formatida
 * saqlanadi — bir daqiqalik xabar taxminan 250 KB bo'ladi.
 */

export interface ComposerProps {
  disabled?: boolean;
  /** Chat yopiq bo'lsa — yozish maydoni o'rniga shu matn chiqadi. */
  lockedText?: string | null;
  onSend: (input: {
    kind: MessageKind;
    body?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    duration?: number;
  }) => Promise<void> | void;
}

export function Composer({ disabled, lockedText, onSend }: ComposerProps) {
  const [text, setText] = useState("");
  const [stickers, setStickers] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  /* ---------------- Matn maydoni balandligi ---------------- */

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(160, el.scrollHeight)}px`;
  }, [text]);

  const say = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 3500);
  };

  /* ---------------- Matn ---------------- */

  const sendText = useCallback(async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    await onSend({ kind: "text", body });
    setBusy(false);
    setText("");
  }, [text, busy, onSend]);

  /* ---------------- Fayl ---------------- */

  const pickFile = useCallback(
    async (file: File) => {
      setBusy(true);
      setProgress(0);
      const result = await uploadFile(file, { onProgress: setProgress });
      setProgress(null);
      setBusy(false);

      if (!result.ok) {
        say(result.error);
        return;
      }
      await onSend({
        kind: result.file.kind,
        mediaUrl: result.file.url,
        mediaName: result.file.name,
        mediaSize: result.file.size,
        duration: result.file.duration,
        body: text.trim() || undefined,
      });
      setText("");
    },
    [onSend, text],
  );

  /* ---------------- Ovozli xabar ---------------- */

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelled = useRef(false);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 32000 });
      chunks.current = [];
      cancelled.current = false;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        stopTimer();
        const length = seconds;
        setRecording(false);
        setSeconds(0);

        if (cancelled.current || chunks.current.length === 0) return;

        const blob = new Blob(chunks.current, { type: mime });
        const file = new File([blob], `ovoz-${Date.now()}.webm`, { type: mime });

        setBusy(true);
        setProgress(0);
        const result = await uploadFile(file, { folder: "ovoz", duration: length, onProgress: setProgress });
        setProgress(null);
        setBusy(false);

        if (!result.ok) {
          say(result.error);
          return;
        }
        await onSend({
          kind: "voice",
          mediaUrl: result.file.url,
          mediaName: file.name,
          mediaSize: file.size,
          duration: length,
        });
      };

      rec.start();
      recorder.current = rec;
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => setSeconds((n) => n + 1), 1000);
    } catch {
      say("Mikrofonga ruxsat berilmadi");
    }
  }, [onSend, seconds]);

  const stopRecording = (cancel: boolean) => {
    cancelled.current = cancel;
    recorder.current?.stop();
    recorder.current = null;
  };

  useEffect(() => stopTimer, []);

  /* ---------------- Ko'rinish ---------------- */

  if (lockedText) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-paper-line bg-white/70 px-4 py-3.5 text-sm font-extrabold text-ink-mute">
        <Lock className="h-4 w-4" /> {lockedText}
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-3">
        <span className="h-3 w-3 animate-pulse rounded-full bg-rose-500" aria-hidden />
        <span className="font-mono text-lg font-extrabold text-rose-900">{clock(seconds)}</span>
        <span className="flex-1 text-sm font-bold text-rose-800">Yozilmoqda…</span>

        <button
          type="button"
          onClick={() => stopRecording(true)}
          title="Bekor qilish"
          className="grid h-10 w-10 place-items-center rounded-xl bg-white text-rose-700 hover:bg-rose-100"
        >
          <Trash2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => stopRecording(false)}
          title="Yuborish"
          className="grid h-10 w-10 place-items-center rounded-xl bg-rose-600 text-white hover:bg-rose-700"
        >
          <Square className="h-4 w-4" fill="currentColor" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="animate-pop-in flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
          <X className="h-4 w-4" /> {error}
        </p>
      ) : null}

      {progress !== null ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-ink transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {stickers ? (
        <div className="animate-pop-in grid max-h-64 grid-cols-4 gap-2 overflow-y-auto rounded-2xl border-2 border-paper-line bg-white p-2 sm:grid-cols-5">
          {STICKERS.map((st) => (
            <button
              key={st.id}
              type="button"
              disabled={busy}
              onClick={async () => {
                setStickers(false);
                setBusy(true);
                await onSend({ kind: "sticker", body: st.id });
                setBusy(false);
              }}
              className="flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-white transition hover:scale-105"
              style={{ backgroundImage: `linear-gradient(135deg, ${st.from}, ${st.to})` }}
            >
              <span className="text-3xl" aria-hidden>
                {st.emoji}
              </span>
              <span className="text-[11px] font-extrabold leading-tight">{st.label}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-2xl border-2 border-paper-line bg-white p-2">
        <input
          ref={fileInput}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void pickFile(file);
          }}
        />

        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => fileInput.current?.click()}
          title="Fayl yoki rasm"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-ink-soft hover:bg-paper disabled:opacity-40"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => setStickers((v) => !v)}
          title="Stikerlar"
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-paper disabled:opacity-40",
            stickers ? "bg-paper text-ink" : "text-ink-soft",
          )}
        >
          <Smile className="h-5 w-5" />
        </button>

        <textarea
          ref={area}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter — yuborish, Shift+Enter — yangi qator
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendText();
            }
          }}
          placeholder="Xabar yozing…"
          className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 font-medium text-ink outline-none placeholder:text-ink-mute"
        />

        {text.trim() ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void sendText()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white hover:bg-ink-soft disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => void startRecording()}
            title="Ovozli xabar"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper text-ink hover:bg-paper-line disabled:opacity-40"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export { humanSize, kindOf };
