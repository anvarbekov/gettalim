"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, GraduationCap, LogIn, User } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tab = "teacher" | "student";

function KirishInner() {
  const { cloud, signInTeacher, signInStudent } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("keyin");

  const [tab, setTab] = useState<Tab>(params.get("rol") === "oquvchi" ? "student" : "teacher");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classCode, setClassCode] = useState((params.get("kod") ?? "").toUpperCase());
  const [fullName, setFullName] = useState(params.get("ism") ?? "");
  const [pin, setPin] = useState("");

  if (!cloud) return <CloudDisabled title="Kirish uchun bulut sozlanmagan" />;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result =
      tab === "teacher"
        ? await signInTeacher(email, password)
        : await signInStudent(classCode, fullName, pin);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(next ?? (tab === "teacher" ? "/dashboard" : "/talaba"));
    router.refresh();
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <Link href="/" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Bosh sahifa
        </Link>

        <h1 className="text-3xl font-extrabold text-ink">Kirish</h1>
        <p className="mt-1 text-ink-mute">Doskada o'ynash uchun hisob kerak emas — bu bo'lim jurnal uchun.</p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl2 bg-paper p-1.5">
          {(
            [
              ["teacher", "O'qituvchi", GraduationCap],
              ["student", "O'quvchi", User],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setError(null);
              }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-extrabold transition",
                tab === id ? "bg-white text-ink shadow-card" : "text-ink-mute hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <Card className="mt-4">
          <CardBody className="grid gap-4">
            {tab === "teacher" ? (
              <>
                <Field label="Elektron pochta">
                  <Input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ism@maktab.uz"
                  />
                </Field>
                <Field label="Parol">
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Sinf kodi" hint="O'qituvchingiz bergan 6 belgili kod">
                  <Input
                    value={classCode}
                    maxLength={8}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="font-mono uppercase tracking-widest"
                  />
                </Field>
                <Field label="Ism-familiya" hint="Jurnaldagidek yozing">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alisher Nazarov" />
                </Field>
                <Field label="PIN" hint="4 xonali shaxsiy kod">
                  <Input
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="0000"
                    className="font-mono tracking-[0.4em]"
                  />
                </Field>
              </>
            )}

            {error ? (
              <p className="rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {error}
              </p>
            ) : null}

            <Button variant="dark" size="lg" onClick={submit} disabled={busy}>
              <LogIn className="h-5 w-5" /> {busy ? "Kutilmoqda…" : "Kirish"}
            </Button>
          </CardBody>
        </Card>

        {tab === "teacher" ? (
          <p className="mt-4 text-center text-sm text-ink-mute">
            Hisobingiz yo'qmi?{" "}
            <Link href="/royxat" className="font-bold text-teamA hover:underline">
              Ro'yxatdan o'tish
            </Link>
          </p>
        ) : (
          <p className="mt-4 text-center text-sm text-ink-mute">
            Kod yoki PIN esingizdan chiqdimi?{" "}
            <Link href="/kod" className="font-bold text-teamA hover:underline">
              Ma'lumotimni topish
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}

export default function KirishPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <KirishInner />
    </Suspense>
  );
}
