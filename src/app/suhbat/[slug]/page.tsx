"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Composer } from "@/components/chat/Composer";
import { Messages } from "@/components/chat/Messages";
import {
  deleteMessages,
  sendMessage,
  subscribeMessages,
  toMessage,
  type ChatMessage,
  type MessageRow,
} from "@/lib/chat/api";
import { readGuest, saveGuest, type Guest } from "@/lib/chat/guest";
import { getBrowserClient } from "@/lib/supabase/client";

/**
 * Ochiq suhbat — havola orqali kiriladi, ro'yxatdan o'tish shart emas.
 *
 * Mehmon butunlay anonim emas: u ism yozadi va brauzerida barqaror kalit
 * saqlanadi. Shu tufayli o'qituvchi kim yozganini ko'radi va kerak bo'lsa
 * bloklaydi — maktab muhitida bu shart.
 */

interface Channel {
  id: string;
  title: string;
  allowGuests: boolean;
  archived: boolean;
  locked: boolean;
}

export default function OpenChatPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params.slug ?? "");
  const { user, profile } = useAuth();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [name, setName] = useState("");

  /* ---------------- Kanalni topish ---------------- */

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      setError("Bulut sozlanmagan");
      return;
    }
    void supabase.rpc("channel_by_slug", { p_slug: slug }).then(({ data, error: e }) => {
      const row = (data as unknown as {
        id: string;
        title: string;
        allow_guests: boolean;
        archived: boolean;
        locked?: boolean;
      }[] | null)?.[0];
      if (e || !row) {
        setError("Bunday suhbat topilmadi");
        return;
      }
      if (row.archived) {
        setError("Bu suhbat yopilgan");
        return;
      }
      setChannel({
        id: row.id,
        title: row.title,
        allowGuests: row.allow_guests,
        archived: row.archived,
        locked: !!row.locked,
      });
    });
  }, [slug]);

  useEffect(() => {
    setGuest(readGuest());
  }, []);

  /* ---------------- Xabarlar ---------------- */

  const load = useCallback(async (channelId: string) => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { data } = await supabase.rpc("guest_messages", { p_channel: channelId, p_limit: 120 });
    setMessages(((data as unknown as MessageRow[]) ?? []).map(toMessage).reverse());
  }, []);

  useEffect(() => {
    if (!channel) return;
    void load(channel.id);
    return subscribeMessages(
      channel.id,
      (message) =>
        setMessages((list) => (list.some((m) => m.id === message.id) ? list : [...list, message])),
      (message) => setMessages((list) => list.map((m) => (m.id === message.id ? message : m))),
    );
  }, [channel, load]);

  /* ---------------- Yuborish ---------------- */

  const send = useCallback(
    async (input: {
      kind: ChatMessage["kind"];
      body?: string;
      mediaUrl?: string;
      mediaName?: string;
      mediaSize?: number;
      duration?: number;
    }) => {
      if (!channel) return;
      await sendMessage({
        ...input,
        channelId: channel.id,
        authorName: profile?.full_name ?? guest?.name ?? "Mehmon",
        guest: user ? undefined : guest ? { id: guest.id, name: guest.name } : undefined,
      });
    },
    [channel, user, guest, profile?.full_name],
  );

  /* ---------------- Ko'rinish ---------------- */

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper px-4 text-center">
        <div>
          <p className="text-xl font-extrabold text-ink">{error}</p>
          <Link href="/" className="mt-4 inline-block font-bold text-teamA hover:underline">
            Bosh sahifa →
          </Link>
        </div>
      </div>
    );
  }

  if (!channel) {
    return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;
  }

  // Mehmon hali ism yozmagan
  if (!user && !guest) {
    return (
      <div className="grid min-h-dvh place-items-center bg-paper px-4">
        <div className="w-full max-w-sm rounded-2xl border-2 border-paper-line bg-white p-6">
          <h1 className="text-xl font-extrabold text-ink">{channel.title}</h1>
          <p className="mt-1 text-sm text-ink-mute">
            Ro'yxatdan o'tish shart emas. Ismingizni yozing — suhbatdoshlar sizni shu nom bilan
            ko'radi.
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim().length > 1) setGuest(saveGuest(name));
            }}
            placeholder="Ism familiya"
            maxLength={40}
            className="mt-4 w-full rounded-xl border-2 border-paper-line px-4 py-3 font-bold text-ink outline-none focus:border-ink"
          />
          <button
            type="button"
            disabled={name.trim().length < 2}
            onClick={() => setGuest(saveGuest(name))}
            className="mt-3 w-full rounded-xl bg-ink px-4 py-3 font-extrabold text-white disabled:opacity-40"
          >
            Kirish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-paper">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-paper-line bg-white px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate font-extrabold text-ink">{channel.title}</h1>
          <p className="text-xs text-ink-mute">
            {user ? profile?.full_name : `${guest?.name} · mehmon`}
          </p>
        </div>
        <Link href="/" className="link-quiet shrink-0 text-xs font-bold">
          Bosh sahifa
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col px-3 py-3">
        <Messages
          messages={messages}
          meId={user?.id ?? null}
          meGuestId={guest?.id ?? null}
          canDelete={(m) => !!user && m.authorId === user.id}
          onDelete={(id) => {
            void deleteMessages(channel.id, [id]);
          }}
        />
        <div className="mt-2">
          <Composer
            onSend={send}
            lockedText={channel.locked ? "Bu suhbat yopilgan — faqat o'qish mumkin" : null}
          />
        </div>
      </main>
    </div>
  );
}
