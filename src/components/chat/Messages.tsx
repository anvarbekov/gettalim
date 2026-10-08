"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, FileText, Pause, Play, SmilePlus, Trash2 } from "lucide-react";
import type { ChatMessage } from "@/lib/chat/api";
import { REACTIONS, stickerById } from "@/lib/chat/stickers";
import { clock, humanSize } from "@/lib/chat/upload";
import { cn } from "@/lib/utils";

/**
 * Xabarlar oqimi.
 *
 * Ketma-ket kelgan bir xil muallif xabarlari guruhlanadi: ism va vaqt bir
 * marta yoziladi, qolganlari zich turadi. Shu tufayli uzun yozishmani o'qish
 * osonroq.
 */

export interface MessagesProps {
  messages: ChatMessage[];
  /** Mening kimligim — o'z xabarlarim o'ngda chiqadi. */
  meId: string | null;
  meGuestId: string | null;
  /** O'chirish huquqi (o'z xabari yoki o'qituvchi). */
  canDelete: (message: ChatMessage) => boolean;
  onDelete: (id: string) => void;
  /** Stiker bosish mumkinmi (mehmon va yopiq chatda — yo'q). */
  canReact?: boolean;
  onReact?: (id: string, emoji: string) => void;
  /** Tanlash rejimi — bir nechta xabarni birdan o'chirish uchun. */
  selecting?: boolean;
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

const LINK = /(https?:\/\/[^\s<]+)/g;

/** Matndagi havolalarni bosiladigan qiladi. */
function withLinks(text: string) {
  const parts = text.split(LINK);
  return parts.map((part, i) =>
    LINK.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer noopener"
        className="underline decoration-current/40 underline-offset-2 hover:decoration-current"
      >
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Ovozli xabar — oddiy o'ynatgich. */
function Voice({ url, duration, mine }: { url: string; duration: number | null; mine: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const tick = () => setAt(el.currentTime);
    const end = () => {
      setPlaying(false);
      setAt(0);
    };
    el.addEventListener("timeupdate", tick);
    el.addEventListener("ended", end);
    return () => {
      el.removeEventListener("timeupdate", tick);
      el.removeEventListener("ended", end);
    };
  }, []);

  const total = duration || audio.current?.duration || 0;
  const percent = total > 0 ? Math.min(100, (at / total) * 100) : 0;

  return (
    <div className="flex min-w-[190px] items-center gap-2.5">
      <audio ref={audio} src={url} preload="metadata" />
      <button
        type="button"
        onClick={() => {
          const el = audio.current;
          if (!el) return;
          if (playing) {
            el.pause();
            setPlaying(false);
          } else {
            void el.play();
            setPlaying(true);
          }
        }}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full",
          mine ? "bg-white/25 text-white" : "bg-ink text-white",
        )}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>

      <span className="flex-1">
        <span className={cn("block h-1.5 overflow-hidden rounded-full", mine ? "bg-white/25" : "bg-paper-line")}>
          <span
            className={cn("block h-full rounded-full", mine ? "bg-white" : "bg-ink")}
            style={{ width: `${percent}%` }}
          />
        </span>
        <span className={cn("mt-1 block font-mono text-[11px]", mine ? "text-white/70" : "text-ink-mute")}>
          {clock(playing || at > 0 ? at : total)}
        </span>
      </span>
    </div>
  );
}

/** Katta stiker — alohida xabar sifatida yuborilgan. */
function StickerView({ id }: { id: string | null }) {
  const sticker = stickerById(id);
  if (!sticker) return <span className="text-4xl">🙂</span>;
  return (
    <div
      className="animate-pop-in flex w-36 flex-col items-center gap-1 rounded-3xl px-3 pb-3 pt-4 text-white shadow-lift"
      style={{ backgroundImage: `linear-gradient(135deg, ${sticker.from}, ${sticker.to})` }}
    >
      <span className="text-5xl drop-shadow-sm" aria-hidden>
        {sticker.emoji}
      </span>
      <span className="text-center text-sm font-extrabold leading-tight drop-shadow-sm">{sticker.label}</span>
    </div>
  );
}

/** Xabar ostidagi stikerlar: belgi va soni. Meniki ajralib turadi. */
function ReactionRow({
  reactions,
  me,
  mine,
  disabled,
  onPick,
}: {
  reactions: ChatMessage["reactions"];
  me: string | null;
  mine: boolean;
  disabled: boolean;
  onPick: (emoji: string) => void;
}) {
  const entries = Object.entries(reactions ?? {}).filter(([, users]) => users.length > 0);
  if (entries.length === 0) return null;
  return (
    <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "justify-end" : "justify-start")}>
      {entries.map(([emoji, users]) => {
        const pressed = !!me && users.includes(me);
        return (
          <button
            key={emoji}
            type="button"
            disabled={disabled}
            onClick={() => onPick(emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full border-2 px-2 py-0.5 text-sm font-extrabold transition disabled:cursor-default",
              pressed ? "border-ink bg-ink/5 text-ink" : "border-paper-line bg-white text-ink-soft",
              !disabled && "hover:scale-105",
            )}
          >
            <span>{emoji}</span>
            <span className="text-xs">{users.length}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Messages({
  messages,
  meId,
  meGuestId,
  canDelete,
  onDelete,
  canReact = false,
  onReact,
  selecting = false,
  selected,
  onToggleSelect,
}: MessagesProps) {
  const bottom = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  /** Telefonda «hover» yo'q — bosilgan xabarning tugmalari ochiladi. */
  const [active, setActive] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null);

  // O'chirilgan xabarlar umuman ko'rsatilmaydi — Telegram'dagi kabi
  const visible = useMemo(() => messages.filter((m) => !m.deleted), [messages]);

  // Pastda turgan bo'lsak yangi xabarga tushamiz; yuqorini o'qiyotgan bo'lsak
  // joyidan siljitmaymiz — aks holda o'qishning iloji bo'lmaydi.
  useEffect(() => {
    if (stick.current) bottom.current?.scrollIntoView({ block: "end" });
  }, [visible.length]);

  useEffect(() => {
    if (!picker) return;
    const close = () => setPicker(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [picker]);

  const groups = useMemo(() => {
    const out: ChatMessage[][] = [];
    visible.forEach((m) => {
      const last = out[out.length - 1];
      const prev = last?.[last.length - 1];
      const sameAuthor =
        prev &&
        prev.authorId === m.authorId &&
        prev.guestId === m.guestId &&
        new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 4 * 60 * 1000;
      if (sameAuthor) last.push(m);
      else out.push([m]);
    });
    return out;
  }, [visible]);

  return (
    <div
      ref={box}
      onScroll={(e) => {
        const el = e.currentTarget;
        stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      }}
      className="scroll-slim flex-1 space-y-3 overflow-y-auto px-1 py-2"
    >
      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-mute">Hali xabar yo'q.</p>
      ) : null}

      {groups.map((group) => {
        const first = group[0];
        const mine = first.authorId ? first.authorId === meId : first.guestId === meGuestId;

        return (
          <div key={first.id} className={cn("flex flex-col gap-0.5", mine ? "items-end" : "items-start")}>
            <span className="px-2 text-[11px] font-extrabold text-ink-mute">
              {mine ? "Siz" : first.authorName}
              {!first.authorId ? <span className="font-bold text-ink-mute/70"> · mehmon</span> : null}
              <span className="ml-2 font-mono font-bold text-ink-mute/70">
                {new Date(first.createdAt).toLocaleTimeString("uz-UZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </span>

            {group.map((m) => {
              const isSelected = selecting && !!selected?.has(m.id);
              const deletable = canDelete(m);
              const showTools = !selecting && (canReact || deletable);
              const sticker = m.kind === "sticker";

              return (
                <div
                  key={m.id}
                  className={cn("flex max-w-full items-center gap-2", mine ? "flex-row-reverse" : "flex-row")}
                >
                  {/* Tanlash belgisi */}
                  {selecting ? (
                    <button
                      type="button"
                      onClick={() => onToggleSelect?.(m.id)}
                      disabled={!deletable}
                      aria-label="Tanlash"
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition disabled:opacity-20",
                        isSelected ? "border-rose-500 bg-rose-500 text-white" : "border-ink-mute/40 bg-white",
                      )}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                    </button>
                  ) : null}

                  <div className={cn("group relative flex min-w-0 flex-col", mine ? "items-end" : "items-start")}>
                    <div
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("a,button,audio,video")) return;
                        if (selecting) {
                          if (deletable) onToggleSelect?.(m.id);
                        } else {
                          setActive((v) => (v === m.id ? null : m.id));
                        }
                      }}
                      className={cn(
                        "relative max-w-[min(34rem,85vw)] transition",
                        sticker
                          ? "rounded-3xl"
                          : cn(
                              "rounded-2xl px-3.5 py-2.5",
                              mine ? "bg-ink text-white" : "bg-white text-ink shadow-card",
                            ),
                        isSelected && "ring-4 ring-rose-400/60",
                        selecting && deletable && "cursor-pointer",
                      )}
                    >
                      {sticker ? <StickerView id={m.body} /> : null}

                      {m.kind === "image" && m.mediaUrl ? (
                        <a href={m.mediaUrl} target="_blank" rel="noreferrer noopener">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.mediaUrl} alt={m.mediaName ?? ""} className="max-h-80 rounded-xl" loading="lazy" />
                        </a>
                      ) : null}

                      {m.kind === "video" && m.mediaUrl ? (
                        <video src={m.mediaUrl} controls className="max-h-80 rounded-xl" preload="metadata" />
                      ) : null}

                      {m.kind === "voice" && m.mediaUrl ? (
                        <Voice url={m.mediaUrl} duration={m.duration} mine={mine} />
                      ) : null}

                      {m.kind === "file" && m.mediaUrl ? (
                        <a
                          href={m.mediaUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-1 py-1",
                            mine ? "hover:bg-white/10" : "hover:bg-paper",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                              mine ? "bg-white/20" : "bg-paper",
                            )}
                          >
                            <FileText className="h-5 w-5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-extrabold">{m.mediaName}</span>
                            <span className={cn("block text-xs", mine ? "text-white/60" : "text-ink-mute")}>
                              {m.mediaSize ? humanSize(m.mediaSize) : ""}
                            </span>
                          </span>
                          <Download className="h-4 w-4 shrink-0 opacity-60" />
                        </a>
                      ) : null}

                      {m.body && !sticker ? (
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">{withLinks(m.body)}</p>
                      ) : null}

                      {/* Tugmalar: stiker va o'chirish */}
                      {showTools ? (
                        <div
                          className={cn(
                            "absolute -top-3 z-10 flex gap-1 transition",
                            mine ? "-left-2 -translate-x-full" : "-right-2 translate-x-full",
                            active === m.id || picker === m.id
                              ? "opacity-100"
                              : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
                          )}
                        >
                          {canReact ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPicker((v) => (v === m.id ? null : m.id));
                              }}
                              title="Stiker"
                              className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink shadow-card hover:bg-paper"
                            >
                              <SmilePlus className="h-4 w-4" />
                            </button>
                          ) : null}
                          {deletable ? (
                            <button
                              type="button"
                              onClick={() => onDelete(m.id)}
                              title="O'chirish"
                              className="grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white shadow-card hover:bg-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Stiker tanlash oynasi */}
                      {picker === m.id ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "animate-pop-in absolute top-full z-20 mt-2 grid w-[17rem] grid-cols-6 gap-1 rounded-2xl border-2 border-paper-line bg-white p-2 shadow-lift",
                            mine ? "right-0" : "left-0",
                          )}
                        >
                          {REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                onReact?.(m.id, emoji);
                                setPicker(null);
                                setActive(null);
                              }}
                              className="grid h-10 w-10 place-items-center rounded-xl text-2xl transition hover:scale-125 hover:bg-paper"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <ReactionRow
                      reactions={m.reactions}
                      me={meId}
                      mine={mine}
                      disabled={!canReact || selecting}
                      onPick={(emoji) => onReact?.(m.id, emoji)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div ref={bottom} />
    </div>
  );
}
