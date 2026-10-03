"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckSquare,
  Copy,
  Eye,
  Hash,
  Lock,
  LockOpen,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { SiteHeader } from "@/components/SiteHeader";
import { Composer } from "@/components/chat/Composer";
import { Messages } from "@/components/chat/Messages";
import {
  chatContacts,
  deleteMessages,
  dmChannel,
  fetchChannels,
  fetchMessages,
  markRead,
  myChatState,
  react,
  sendMessage,
  setChannelLock,
  setStudentsChat,
  subscribeMessages,
  type ChatChannel,
  type ChatMessage,
  type ChatState,
  type Contact,
} from "@/lib/chat/api";
import { listClasses } from "@/lib/classes";
import { classChannel, openChannel } from "@/lib/chat/channels";
import { cn } from "@/lib/utils";

/**
 * Chat.
 *
 * Chap tomonda kanallar, o'ngda yozishma. Telefonda ikkalasi navbat bilan
 * ko'rinadi.
 *
 * O'qituvchi:
 *   - o'quvchilar chatini birdan yopadi/ochadi yoki har kanalni alohida;
 *   - istalgan xabarni o'chiradi: bittasini, tanlanganlarini yoki hammasini;
 *   - o'quvchilar orasidagi shaxsiy yozishmalarni ham ko'radi.
 * Hamma: xabarlarga stiker bosadi, katta stiker yuboradi.
 */

type SendInput = Omit<Parameters<typeof sendMessage>[0], "channelId" | "authorName">;

const POLL_MS = 15_000;

export default function ChatPage() {
  const { cloud, loading, user, profile } = useAuth();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<string | null>(null);
  const [state, setState] = useState<ChatState | null>(null);

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<"all" | "selected" | null>(null);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const staff = state?.staff ?? (profile?.role === "teacher" || profile?.role === "admin");

  const say = useCallback((text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    const [list, st] = await Promise.all([fetchChannels(), myChatState()]);
    setChannels(list);
    setState(st);
  }, []);

  // Ro'yxat va yopiq/ochiq holat muntazam yangilanadi: o'qituvchi chatni
  // yopsa, o'quvchida yozish maydoni bir necha soniyada yopiladi.
  useEffect(() => {
    if (!cloud || !user) return;
    void load();
    const id = setInterval(() => {
      if (!document.hidden) void load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [cloud, user, load]);

  /* ---------------- Tanlangan kanal ---------------- */

  useEffect(() => {
    setSelecting(false);
    setSelected(new Set());
    if (!active) return;
    setBusy(true);
    void fetchMessages(active, 150).then((list) => {
      setMessages(list);
      setBusy(false);
    });
    void markRead(active);

    const off = subscribeMessages(
      active,
      (message) => {
        setMessages((list) => (list.some((m) => m.id === message.id) ? list : [...list, message]));
        void markRead(active);
      },
      (message) => {
        setMessages((list) => list.map((m) => (m.id === message.id ? message : m)));
      },
    );
    return off;
  }, [active]);

  const channel = useMemo(() => channels.find((c) => c.id === active) ?? null, [channels, active]);
  const mainChannels = useMemo(() => channels.filter((c) => !c.watching), [channels]);
  const watched = useMemo(() => channels.filter((c) => c.watching), [channels]);

  /* ---------------- Amallar ---------------- */

  const send = useCallback(
    async (input: SendInput) => {
      if (!active) return;
      const ok = await sendMessage({
        ...input,
        channelId: active,
        authorName: profile?.full_name ?? "Foydalanuvchi",
      });
      if (!ok) say("Yuborilmadi — chat yopilgan bo'lishi mumkin");
      void load();
    },
    [active, profile?.full_name, load, say],
  );

  const removeLocally = (ids: string[] | null) =>
    setMessages((list) => list.map((m) => (ids === null || ids.includes(m.id) ? { ...m, deleted: true } : m)));

  const remove = useCallback(
    async (ids: string[] | null) => {
      if (!active) return;
      const count = await deleteMessages(active, ids);
      if (count > 0) {
        removeLocally(ids);
        say(`${count} ta xabar o'chirildi`);
      } else {
        say("O'chirilmadi");
      }
      setSelecting(false);
      setSelected(new Set());
      void load();
    },
    [active, load, say],
  );

  const onReact = useCallback(async (id: string, emoji: string) => {
    const next = await react(id, emoji);
    if (next) setMessages((list) => list.map((m) => (m.id === id ? { ...m, reactions: next } : m)));
  }, []);

  const toggleLock = useCallback(async () => {
    if (!channel) return;
    const ok = await setChannelLock(channel.id, !channel.locked);
    if (ok) say(channel.locked ? "Suhbat o'quvchilarga ochildi" : "Suhbat o'quvchilar uchun yopildi");
    void load();
  }, [channel, load, say]);

  const toggleAll = useCallback(async () => {
    if (!state) return;
    const ok = await setStudentsChat(!state.studentsEnabled);
    if (ok) say(state.studentsEnabled ? "O'quvchilar chati yopildi" : "O'quvchilar chati ochildi");
    void load();
  }, [state, load, say]);

  const openDm = useCallback(
    async (person: Contact) => {
      const id = await dmChannel(person.id);
      setContactsOpen(false);
      if (!id) {
        say("Suhbat ochilmadi");
        return;
      }
      await load();
      setActive(id);
    },
    [load, say],
  );

  /* ---------------- Holatlar ---------------- */

  if (!cloud) return <CloudDisabled title="Chat uchun bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  if (!user) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-ink">Chat uchun tizimga kiring</h1>
          <p className="mt-2 text-ink-mute">
            Ochiq kanalga havola orqali ro'yxatdan o'tmasdan ham qo'shilish mumkin.
          </p>
          <Link href="/kirish" className="mt-4 inline-block font-bold text-teamA hover:underline">
            Kirish →
          </Link>
        </main>
      </div>
    );
  }

  const lockedText =
    channel && !channel.canWrite
      ? channel.locked
        ? "O'qituvchi bu suhbatni yopgan — faqat o'qish mumkin"
        : "O'qituvchi chatni vaqtincha yopgan — faqat o'qish mumkin"
      : null;

  const studentsClosed = staff && state && !state.studentsEnabled;

  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 gap-3 px-3 py-3">
        {/* ================= Kanallar ================= */}
        <aside
          className={cn(
            "flex w-full flex-col rounded-2xl border-2 border-paper-line bg-white sm:w-80 sm:shrink-0",
            active && "hidden sm:flex",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-paper-line px-4 py-3">
            <h1 className="font-extrabold text-ink">Suhbatlar</h1>
            <button
              type="button"
              onClick={() => setContactsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-extrabold text-white hover:bg-ink-soft"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" /> Yangi
            </button>
          </div>

          {staff ? (
            <div className="space-y-2 border-b border-paper-line p-3">
              {/* Umumiy kalit */}
              <button
                type="button"
                onClick={() => void toggleAll()}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition",
                  studentsClosed ? "border-rose-300 bg-rose-50" : "border-emerald-300 bg-emerald-50",
                )}
              >
                {studentsClosed ? (
                  <Lock className="h-5 w-5 shrink-0 text-rose-700" />
                ) : (
                  <LockOpen className="h-5 w-5 shrink-0 text-emerald-700" />
                )}
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm font-extrabold", studentsClosed ? "text-rose-900" : "text-emerald-900")}>
                    O'quvchilar chati: {studentsClosed ? "yopiq" : "ochiq"}
                  </span>
                  <span className={cn("block text-xs", studentsClosed ? "text-rose-800/70" : "text-emerald-800/70")}>
                    {studentsClosed ? "Faqat o'qiy oladi. Ochish uchun bosing" : "Hamma yoza oladi. Yopish uchun bosing"}
                  </span>
                </span>
                <span
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition",
                    studentsClosed ? "bg-rose-300" : "bg-emerald-500",
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
                      studentsClosed ? "left-0.5" : "left-[1.375rem]",
                    )}
                  />
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const classes = await listClasses();
                    for (const k of classes) await classChannel(k.id);
                    await load();
                    say("Sinf kanallari tayyor");
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-paper-line px-2 py-2 text-xs font-extrabold text-ink hover:bg-paper"
                >
                  <Users className="h-4 w-4" /> Sinf kanallari
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const result = await openChannel("Ochiq suhbat");
                    if (result) {
                      setMade(`${window.location.origin}/suhbat/${result.slug}`);
                      await load();
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-paper-line px-2 py-2 text-xs font-extrabold text-ink hover:bg-paper"
                >
                  <Plus className="h-4 w-4" /> Ochiq kanal
                </button>
              </div>

              {made ? (
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(made);
                    say("Havola nusxalandi");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-left text-xs font-bold text-emerald-900"
                >
                  <Copy className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{made}</span>
                </button>
              ) : null}
            </div>
          ) : state && !state.openForMe ? (
            <div className="flex items-center gap-2 border-b border-paper-line bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-rose-900">
              <Lock className="h-4 w-4 shrink-0" /> O'qituvchi chatni vaqtincha yopgan
            </div>
          ) : null}

          <div className="scroll-slim flex-1 overflow-y-auto p-2">
            {channels.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-ink-mute">
                Hali suhbat yo'q. «Yangi» tugmasi bilan kimgadir yozing.
              </p>
            ) : null}

            <ChannelList items={mainChannels} active={active} onPick={setActive} />

            {watched.length > 0 ? (
              <>
                <p className="mt-4 flex items-center gap-1.5 px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-ink-mute">
                  <Eye className="h-3.5 w-3.5" /> O'quvchilar yozishmalari
                </p>
                <ChannelList items={watched} active={active} onPick={setActive} />
              </>
            ) : null}
          </div>
        </aside>

        {/* ================= Yozishma ================= */}
        <section
          className={cn("flex min-w-0 flex-1 flex-col rounded-2xl bg-paper/40 p-3", !active && "hidden sm:flex")}
        >
          {!channel ? (
            <div className="grid flex-1 place-items-center text-center text-ink-mute">
              <p>Suhbatni tanlang</p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-paper sm:hidden"
                  aria-label="Orqaga"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="mr-auto flex min-w-0 items-center gap-2 font-extrabold text-ink">
                  <span className="truncate">{channel.title}</span>
                  {channel.locked ? (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-extrabold text-rose-800">
                      <Lock className="h-3 w-3" /> yopiq
                    </span>
                  ) : null}
                </h2>

                {/* O'qituvchi tugmalari */}
                {staff && !selecting ? (
                  <div className="flex flex-wrap gap-1.5">
                    <HeaderButton
                      onClick={() => void toggleLock()}
                      icon={channel.locked ? LockOpen : Lock}
                      tone={channel.locked ? "green" : "plain"}
                    >
                      {channel.locked ? "Ochish" : "Yopish"}
                    </HeaderButton>
                    <HeaderButton onClick={() => setSelecting(true)} icon={CheckSquare}>
                      Tanlash
                    </HeaderButton>
                    <HeaderButton onClick={() => setConfirm("all")} icon={Trash2} tone="red">
                      Hammasini o'chirish
                    </HeaderButton>
                  </div>
                ) : null}
              </div>

              {/* Tanlash rejimi */}
              {selecting ? (
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-card">
                  <span className="mr-auto text-sm font-extrabold text-ink">
                    {selected.size ? `${selected.size} ta tanlandi` : "O'chirmoqchi bo'lgan xabarlarni bosing"}
                  </span>
                  <button
                    type="button"
                    disabled={selected.size === 0}
                    onClick={() => setConfirm("selected")}
                    className="flex items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-rose-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" /> O'chirish
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelecting(false);
                      setSelected(new Set());
                    }}
                    className="rounded-lg px-3 py-1.5 text-sm font-extrabold text-ink-soft hover:bg-paper"
                  >
                    Bekor
                  </button>
                </div>
              ) : null}

              {busy ? (
                <div className="grid flex-1 place-items-center text-sm text-ink-mute">Yuklanmoqda…</div>
              ) : (
                <Messages
                  messages={messages}
                  meId={user.id}
                  meGuestId={null}
                  canDelete={(m) => staff || m.authorId === user.id}
                  onDelete={(id) => void remove([id])}
                  canReact={channel.canWrite}
                  onReact={(id, emoji) => void onReact(id, emoji)}
                  selecting={selecting}
                  selected={selected}
                  onToggleSelect={(id) =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    })
                  }
                />
              )}

              <div className="mt-2">
                <Composer onSend={send} lockedText={lockedText} disabled={selecting} />
              </div>
            </>
          )}
        </section>
      </main>

      {/* ================= Tasdiqlash ================= */}
      {confirm ? (
        <Modal onClose={() => setConfirm(null)}>
          <h2 className="text-xl font-extrabold text-ink">
            {confirm === "all" ? "Hamma xabarlarni o'chirish" : `${selected.size} ta xabarni o'chirish`}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            {confirm === "all"
              ? `«${channel?.title ?? ""}» suhbatidagi barcha xabarlar hamma uchun o'chiriladi. Qaytarib bo'lmaydi.`
              : "Tanlangan xabarlar hamma uchun o'chiriladi. Qaytarib bo'lmaydi."}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirm(null)}
              className="rounded-xl px-4 py-2.5 font-extrabold text-ink-soft hover:bg-paper"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={() => {
                const ids = confirm === "all" ? null : Array.from(selected);
                setConfirm(null);
                void remove(ids);
              }}
              className="rounded-xl bg-rose-500 px-5 py-2.5 font-extrabold text-white hover:bg-rose-600"
            >
              O'chirish
            </button>
          </div>
        </Modal>
      ) : null}

      {/* ================= Yangi suhbat ================= */}
      {contactsOpen ? <ContactPicker onClose={() => setContactsOpen(false)} onPick={(c) => void openDm(c)} /> : null}

      {toast ? (
        <div
          role="status"
          className="animate-pop-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink px-5 py-3 text-sm font-extrabold text-white shadow-lift"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}

/* ==================================================================== */

function ChannelList({
  items,
  active,
  onPick,
}: {
  items: ChatChannel[];
  active: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <ul>
      {items.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onPick(c.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
              c.id === active ? "bg-ink text-white" : "hover:bg-paper",
            )}
          >
            <span
              className={cn(
                "relative grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                c.id === active ? "bg-white/15" : "bg-paper",
              )}
            >
              {c.kind === "class" ? (
                <Users className="h-4 w-4" />
              ) : c.kind === "dm" ? (
                <MessageSquare className="h-4 w-4" />
              ) : (
                <Hash className="h-4 w-4" />
              )}
              {c.locked ? (
                <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-rose-500 text-white">
                  <Lock className="h-2.5 w-2.5" />
                </span>
              ) : null}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold">{c.title}</span>
              <span className={cn("block truncate text-xs", c.id === active ? "text-white/60" : "text-ink-mute")}>
                {c.lastBody ?? "—"}
              </span>
            </span>

            {c.unread > 0 ? (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-extrabold text-white">
                {c.unread}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

function HeaderButton({
  icon: Icon,
  children,
  onClick,
  tone = "plain",
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "plain" | "red" | "green";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-extrabold transition",
        tone === "red" && "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100",
        tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
        tone === "plain" && "border-paper-line bg-white text-ink hover:bg-paper",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 px-4" onMouseDown={onClose}>
      <div
        className="animate-pop-in w-full max-w-md rounded-2xl bg-white p-6 shadow-lift"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ContactPicker({ onClose, onPick }: { onClose: () => void; onPick: (c: Contact) => void }) {
  const [list, setList] = useState<Contact[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void chatContacts().then(setList);
  }, []);

  const shown = (list ?? []).filter((c) => c.fullName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-ink">Kimga yozasiz?</h2>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-paper">
          <X className="h-4 w-4" />
        </button>
      </div>

      <label className="mt-4 flex items-center gap-2 rounded-xl border-2 border-paper-line px-3 py-2 focus-within:border-ink">
        <Search className="h-4 w-4 text-ink-mute" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ism bo'yicha qidirish"
          className="flex-1 bg-transparent font-bold text-ink outline-none placeholder:text-ink-mute"
        />
      </label>

      <ul className="scroll-slim mt-3 max-h-80 overflow-y-auto">
        {list === null ? <li className="py-6 text-center text-sm text-ink-mute">Yuklanmoqda…</li> : null}
        {list && shown.length === 0 ? (
          <li className="py-6 text-center text-sm text-ink-mute">Hech kim topilmadi</li>
        ) : null}
        {shown.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onPick(c)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-paper"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-sm font-extrabold text-white">
                {c.fullName.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-ink">{c.fullName}</span>
                <span className="block text-xs text-ink-mute">
                  {c.role === "teacher" ? "O'qituvchi" : c.className ?? "O'quvchi"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
