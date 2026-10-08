"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, LogIn, UserPlus } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * O'qituvchi kirishi — yashirin sahifa.
 *
 * Saytning hech bir joyida unga havola yo'q: o'qituvchilar manzilni
 * (`/ustoz`) egadan oladi. Ro'yxatdan o'tish faqat ega taklif qilgan pochta
 * bilan ishlaydi — buni baza tekshiradi, sahifa faqat tushunarli xabar beradi.
 */
type Tab = "login" | "signup";

function UstozInner() {
  const { cloud, signInTeacher, signUpTeacher } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("keyin");

  const [tab, setTab] = useState<Tab>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cloud) return <CloudDisabled title="Kirish uchun bulut sozlanmagan" />;

  const submit = async () => {
    if (tab === "signup" && password.length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lsin.");
      return;
    }
    if (tab === "signup" && !fullName.trim()) {
      setError("Ism-familiyangizni yozing.");
      return;
    }
    setBusy(true);
    setError(null);
    const result =
      tab === "login" ? await signInTeacher(email, password) : await signUpTeacher(email, password, fullName);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <main className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl2 bg-ink text-white">
            <GraduationCap className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">O'qituvchi</h1>
            <p className="text-sm text-ink-mute">Gettalim boshqaruv paneliga kirish</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl2 bg-white p-1.5 shadow-card">
          {(
            [
              ["login", "Kirish"],
              ["signup", "Taklif bilan ro'yxat"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setError(null);
              }}
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm font-extrabold transition",
                tab === id ? "bg-ink text-white" : "text-ink-mute hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Card className="mt-4">
          <CardBody className="grid gap-4">
            {tab === "signup" ? (
              <>
                <p className="rounded-xl bg-paper px-3 py-2 text-sm text-ink-soft">
                  Faqat administrator taklif qilgan pochta bilan ro'yxatdan o'tish mumkin.
                </p>
                <Field label="Ism-familiya">
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Field>
              </>
            ) : null}

            <Field label="Elektron pochta">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ism@maktab.uz"
              />
            </Field>
            <Field label="Parol" hint={tab === "signup" ? "Kamida 6 belgi" : undefined}>
              <Input
                type="password"
                autoComplete={tab === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void submit()}
              />
            </Field>

            {error ? (
              <p className="rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {error}
              </p>
            ) : null}

            <Button variant="dark" size="lg" onClick={submit} disabled={busy}>
              {tab === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {busy ? "Kutilmoqda…" : tab === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
            </Button>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

export default function UstozPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <UstozInner />
    </Suspense>
  );
}
