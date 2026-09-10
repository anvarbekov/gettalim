"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";

export default function RoyxatPage() {
  const { cloud, signUpTeacher } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cloud) return <CloudDisabled title="Ro'yxatdan o'tish uchun bulut sozlanmagan" />;

  const submit = async () => {
    if (password.length < 6) {
      setError("Parol kamida 6 belgidan iborat bo'lsin.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: err } = await signUpTeacher(email, password, fullName);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <Link href="/kirish" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Kirish
        </Link>

        <h1 className="text-3xl font-extrabold text-ink">O'qituvchi hisobi</h1>
        <p className="mt-1 text-ink-mute">
          O'quvchilar ro'yxatdan o'tmaydi — siz ularni sinfga o'zingiz qo'shasiz.
        </p>

        <Card className="mt-6">
          <CardBody className="grid gap-4">
            <Field label="Ism-familiya">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Muhammadnozim" />
            </Field>
            <Field label="Elektron pochta">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ism@maktab.uz"
              />
            </Field>
            <Field label="Parol" hint="Kamida 6 belgi">
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            {error ? (
              <p className="rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {error}
              </p>
            ) : null}

            <Button variant="dark" size="lg" onClick={submit} disabled={busy}>
              <UserPlus className="h-5 w-5" /> {busy ? "Kutilmoqda…" : "Ro'yxatdan o'tish"}
            </Button>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
