"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CLASS_EVENT, classChannelName } from "@/lib/live/classChannel";
import { getBrowserClient } from "@/lib/supabase/client";

interface Credentials {
  classId: string;
  className: string;
  joinCode: string;
  pin: string | null;
}

/**
 * Har bir o'quvchi qurilmasida ishlaydigan tinglovchi.
 *
 * Ilova ochiq turganda sinf kanaliga ulanadi va o'qituvchi signal berganda
 * kirish ma'lumotini ko'rsatadi. Ma'lumot kanaldan emas, bazadan olinadi —
 * shuning uchun har kim faqat o'zinikini ko'radi.
 */
export function StudentCredentials() {
  const { cloud, role, user, profile } = useAuth();
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [open, setOpen] = useState(false);
  const channel = useRef<RealtimeChannel | null>(null);

  /* O'z ma'lumotimni bazadan olamiz */
  const load = useCallback(async () => {
    const supabase = getBrowserClient();
    if (!supabase || !user) return null;

    const { data } = await supabase
      .from("class_students")
      .select("pin, class_id, classes(name, join_code)")
      .eq("student_id", user.id)
      .limit(1)
      .maybeSingle();

    const row = data as unknown as {
      pin: string | null;
      class_id: string;
      classes: { name: string; join_code: string } | null;
    } | null;

    if (!row?.classes) return null;
    const next: Credentials = {
      classId: row.class_id,
      className: row.classes.name,
      joinCode: row.classes.join_code,
      pin: row.pin,
    };
    setCreds(next);
    return next;
  }, [user]);

  useEffect(() => {
    if (!cloud || role !== "student" || !user) return;
    const supabase = getBrowserClient();
    if (!supabase) return;

    let cancelled = false;

    void load().then((data) => {
      if (cancelled || !data) return;

      const ch = supabase.channel(classChannelName(data.classId), {
        config: { presence: { key: user.id } },
      });
      channel.current = ch;

      ch.on("broadcast", { event: CLASS_EVENT.show }, () => {
        void load();
        setOpen(true);
      });
      ch.on("broadcast", { event: CLASS_EVENT.hide }, () => setOpen(false));

      void ch.subscribe((status) => {
        if (status !== "SUBSCRIBED") return;
        // O'qituvchi kim onlayn ekanini ko'rishi uchun
        void ch.track({ name: profile?.full_name || "O'quvchi", at: Date.now() });
      });
    });

    return () => {
      cancelled = true;
      if (channel.current) {
        void supabase.removeChannel(channel.current);
        channel.current = null;
      }
    };
  }, [cloud, role, user, profile?.full_name, load]);

  if (!open || !creds) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="animate-pop-in w-full max-w-sm overflow-hidden rounded-xl2 bg-white shadow-lift">
        <div
          className="flex items-center justify-between px-5 py-3 text-white"
          style={{ background: "linear-gradient(90deg,#1f6fd0,#7a3fd0)" }}
        >
          <span className="text-sm font-extrabold uppercase tracking-wider">Kirish ma'lumotlaringiz</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 transition hover:bg-white/20"
            aria-label="Yopish"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-center text-2xl font-extrabold text-ink">{profile?.full_name}</p>
          <p className="mt-0.5 text-center text-sm text-ink-mute">{creds.className}</p>

          <div className="mt-5 grid gap-3">
            <span className="rounded-xl2 bg-paper px-4 py-3 text-center">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">
                Sinf kodi
              </span>
              <span className="mt-0.5 block font-mono text-3xl font-bold tracking-[0.25em] text-ink">
                {creds.joinCode}
              </span>
            </span>

            <span className="rounded-xl2 bg-paper px-4 py-3 text-center">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">
                PIN kodingiz
              </span>
              <span className="mt-0.5 block font-mono text-3xl font-bold tracking-[0.35em] text-ink">
                {creds.pin ?? "—"}
              </span>
            </span>
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-ink-mute">
            Bu ma'lumotlarni yozib oling. PIN shaxsiy — boshqalarga aytmang.
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-xl2 bg-ink py-3 text-sm font-extrabold text-white hover:bg-ink-soft"
          >
            Yozib oldim
          </button>
        </div>
      </div>
    </div>
  );
}
