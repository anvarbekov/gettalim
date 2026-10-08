"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Crown, Mail, Trash2, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardBody, Input } from "@/components/ui/card";
import { getBrowserClient } from "@/lib/supabase/client";

/**
 * O'qituvchilar — faqat platforma egasi uchun.
 *
 * Pochta qo'shiladi:
 *   - shunday hisob bor bo'lsa — u darhol o'qituvchi bo'ladi;
 *   - yo'q bo'lsa — taklif yoziladi, odam `/ustoz` sahifasida shu pochta
 *     bilan ro'yxatdan o'tadi.
 * Ruxsatni baza tekshiradi (migration-15): bu sahifani ochgan boshqa odam
 * hech narsa ko'rmaydi va hech narsani o'zgartira olmaydi.
 */

interface Row {
  id: string | null;
  email: string;
  fullName: string | null;
  isOwner: boolean;
  pending: boolean;
}

const ERRORS: Record<string, string> = {
  BAD_EMAIL: "Pochta manzili noto'g'ri.",
  STUDENT_ACCOUNT: "Bu o'quvchi hisobi — uni o'qituvchi qilib bo'lmaydi.",
  NOT_OWNER: "Bu amal faqat platforma egasi uchun.",
};

export default function UstozlarPage() {
  const { cloud, loading, isOwner } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "ok" | "err" } | null>(null);
  const [link, setLink] = useState("");

  useEffect(() => setLink(`${window.location.origin}/ustoz`), []);

  const load = useCallback(async () => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { data } = await supabase.rpc("owner_teachers");
    setRows(
      ((data as unknown as {
        id: string | null;
        email: string;
        full_name: string | null;
        is_owner: boolean;
        pending: boolean;
      }[] | null) ?? []).map((r) => ({
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        isOwner: r.is_owner,
        pending: r.pending,
      })),
    );
  }, []);

  useEffect(() => {
    if (cloud && isOwner) void load();
  }, [cloud, isOwner, load]);

  const add = async () => {
    const supabase = getBrowserClient();
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setNote(null);
    const { data, error } = await supabase.rpc("owner_add_teacher", { p_email: email });
    setBusy(false);
    if (error) {
      const code = Object.keys(ERRORS).find((k) => error.message.includes(k));
      setNote({ text: code ? ERRORS[code] : error.message, tone: "err" });
      return;
    }
    setNote({
      text:
        data === "promoted"
          ? `${email.trim()} endi o'qituvchi.`
          : `Taklif yozildi. ${email.trim()} /ustoz sahifasida «Taklif bilan ro'yxat» orqali hisob ochadi.`,
      tone: "ok",
    });
    setEmail("");
    void load();
  };

  const remove = async (row: Row) => {
    const what = row.pending ? "taklifni bekor qilish" : "o'qituvchilikdan olish";
    if (!window.confirm(`${row.email} — ${what}?`)) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    await supabase.rpc("owner_remove_teacher", { p_email: row.email });
    void load();
  };

  if (!cloud) return <CloudDisabled title="Bulut sozlanmagan" />;
  if (loading) return <div className="grid min-h-dvh place-items-center text-ink-mute">Yuklanmoqda…</div>;

  if (!isOwner) {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-ink">Sahifa topilmadi</h1>
          <Link href="/" className="mt-4 inline-block font-bold text-teamA hover:underline">
            Bosh sahifa →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/dashboard" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Panel
        </Link>

        <h1 className="text-3xl font-extrabold text-ink">O'qituvchilar</h1>
        <p className="mt-1 text-pretty text-ink-mute">
          O'qituvchi bo'lish faqat siz qo'shgan pochta bilan mumkin. Boshqa hech kim o'qituvchi
          bo'limini va kirish oynasini ko'rmaydi.
        </p>

        <Card className="mt-6">
          <CardBody className="grid gap-3">
            <label className="text-sm font-extrabold text-ink" htmlFor="ustoz-email">
              Yangi o'qituvchi pochtasi
            </label>
            <div className="flex gap-2">
              <Input
                id="ustoz-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void add()}
                placeholder="ism@maktab.uz"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => void add()}
                disabled={busy || !email.trim()}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-ink px-4 font-extrabold text-white hover:bg-ink-soft disabled:opacity-40"
              >
                <UserPlus className="h-4 w-4" /> Qo'shish
              </button>
            </div>

            {note ? (
              <p
                className={
                  note.tone === "ok"
                    ? "rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900"
                    : "rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900"
                }
              >
                {note.text}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(link)}
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-paper-line px-3 py-2 text-left text-sm text-ink-soft hover:bg-paper"
              title="Nusxalash"
            >
              <Copy className="h-4 w-4 shrink-0" />
              <span>
                O'qituvchilar kirish manzili: <b className="font-mono text-ink">{link}</b>
              </span>
            </button>
          </CardBody>
        </Card>

        <ul className="mt-6 space-y-2">
          {rows === null ? <li className="py-6 text-center text-sm text-ink-mute">Yuklanmoqda…</li> : null}
          {rows?.map((r) => (
            <li
              key={r.email}
              className="flex items-center gap-3 rounded-xl2 border-2 border-paper-line bg-white px-4 py-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-ink">
                {r.isOwner ? <Crown className="h-5 w-5 text-amber-500" /> : r.pending ? <Mail className="h-5 w-5" /> : (
                  <span className="font-extrabold">{(r.fullName || r.email).charAt(0).toUpperCase()}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold text-ink">
                  {r.pending ? r.email : r.fullName || r.email}
                </span>
                <span className="block truncate text-xs text-ink-mute">
                  {r.isOwner ? "Ega · " : ""}
                  {r.pending ? "Taklif kutilmoqda — hali ro'yxatdan o'tmagan" : r.email}
                </span>
              </span>
              {!r.isOwner ? (
                <button
                  type="button"
                  onClick={() => void remove(r)}
                  title={r.pending ? "Taklifni bekor qilish" : "O'qituvchilikdan olish"}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-mute hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
