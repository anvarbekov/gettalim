"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Clock, Send, Unlock, Users, X } from "lucide-react";
import { CLASS_EVENT, classChannelName, type ClassPresence } from "@/lib/live/classChannel";
import { closeRoster, openRoster } from "@/lib/roster/api";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MINUTES = 15;

/**
 * Kirish ma'lumotlarini ko'rsatish.
 *
 * Ikkita yo'l bir tugmada:
 *  1. **Ro'yxatni ochish** — sinf kodini bilgan har kim `/kod` sahifasida
 *     o'z ismini topib PIN kodini ko'radi. Hisob kerak emas, shuning uchun
 *     kodini unutgan o'quvchi ham tizimga kira oladi. Belgilangan vaqtdan
 *     keyin ro'yxat o'zi yopiladi.
 *  2. **Onlayn o'quvchilarga yuborish** — allaqachon tizimda turganlarning
 *     ekranida ma'lumot oynasi ochiladi.
 */
export function BroadcastCredentials({
  classId,
  joinCode,
  openUntil,
  onChange,
  className,
}: {
  classId: string;
  joinCode?: string;
  /** Bazadagi joriy holat (ISO sana yoki null). */
  openUntil?: string | null;
  /** Ro'yxat holati o'zgargach ro'yxatni yangilash uchun. */
  onChange?: () => void;
  className?: string;
}) {
  const channel = useRef<RealtimeChannel | null>(null);
  const [online, setOnline] = useState<ClassPresence[]>([]);
  const [sent, setSent] = useState(false);
  const [until, setUntil] = useState<Date | null>(openUntil ? new Date(openUntil) : null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUntil(openUntil ? new Date(openUntil) : null);
  }, [openUntil]);

  /* Qolgan vaqt */
  useEffect(() => {
    if (!until) {
      setLeft(0);
      return;
    }
    const tick = () => {
      const seconds = Math.max(0, Math.round((until.getTime() - Date.now()) / 1000));
      setLeft(seconds);
      if (seconds === 0) setUntil(null);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  /* Kanal — kim onlayn */
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase || !classId) return;

    const ch = supabase.channel(classChannelName(classId));
    channel.current = ch;

    const sync = () => setOnline(Object.values(ch.presenceState<ClassPresence>()).flat());
    ch.on("presence", { event: "sync" }, sync);
    ch.on("presence", { event: "join" }, sync);
    ch.on("presence", { event: "leave" }, sync);
    void ch.subscribe();

    return () => {
      void supabase.removeChannel(ch);
      channel.current = null;
      setOnline([]);
    };
  }, [classId]);

  const send = useCallback((event: string) => {
    void channel.current?.send({ type: "broadcast", event, payload: { at: Date.now() } });
  }, []);

  const open = async () => {
    setBusy(true);
    const result = await openRoster(classId, MINUTES);
    setBusy(false);
    if (result) {
      setUntil(result);
      // Tizimda turganlarga ham darhol ko'rsatamiz
      send(CLASS_EVENT.show);
      setSent(true);
      setTimeout(() => setSent(false), 2500);
      onChange?.();
    }
  };

  const close = async () => {
    setBusy(true);
    await closeRoster(classId);
    setBusy(false);
    setUntil(null);
    send(CLASS_EVENT.hide);
    onChange?.();
  };

  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  const joinUrl = typeof window !== "undefined" ? `${window.location.host}/kod` : "/kod";

  return (
    <span className={cn("flex flex-wrap items-center gap-2", className)}>
      <span
        className="flex items-center gap-1.5 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink-soft"
        title={online.map((p) => p.name).join(", ") || "Hozircha hech kim tizimda emas"}
      >
        <span
          className={cn("h-2 w-2 rounded-full", online.length ? "bg-emerald-500" : "bg-ink-mute/40")}
          aria-hidden
        />
        <Users className="h-4 w-4" /> {online.length} onlayn
      </span>

      {until ? (
        <>
          <span className="flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-900">
            <Clock className="h-4 w-4" />
            <span className="font-mono tabular-nums">{clock}</span>
            <span className="hidden sm:inline">— ro'yxat ochiq</span>
          </span>

          <span className="rounded-xl bg-ink px-3 py-2 text-sm font-extrabold text-white">
            {joinUrl}
            {joinCode ? ` · ${joinCode}` : ""}
          </span>

          <button
            type="button"
            onClick={() => {
              send(CLASS_EVENT.show);
              setSent(true);
              setTimeout(() => setSent(false), 2000);
            }}
            className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <Send className="h-4 w-4" /> {sent ? "Yuborildi ✓" : "Onlaynlarga yuborish"}
          </button>

          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
          >
            <X className="h-4 w-4" /> Yopish
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={open}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2 text-sm font-extrabold text-white transition hover:bg-ink-soft disabled:opacity-50"
        >
          <Unlock className="h-4 w-4" /> Ma'lumotlarni ko'rsatish ({MINUTES} daq)
        </button>
      )}
    </span>
  );
}
