"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LogIn } from "lucide-react";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";

function KirishInner() {
  const { cloud, signInStudent } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("keyin");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [classCode, setClassCode] = useState((params.get("kod") ?? "").toUpperCase());
  const [fullName, setFullName] = useState(params.get("ism") ?? "");
  const [pin, setPin] = useState("");

  if (!cloud) return <CloudDisabled title="Kirish uchun bulut sozlanmagan" />;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await signInStudent(classCode, fullName, pin);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push(next && next.startsWith("/") ? next : "/talaba");
    router.refresh();
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-10">
        <Link href="/" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> Bosh sahifa
        </Link>

        <h1 className="text-3xl font-extrabold text-ink">O'quvchi kirishi</h1>
        <p className="mt-1 text-ink-mute">O'qituvchingiz bergan sinf kodi, ismingiz va PIN bilan kiring.</p>

        <Card className="mt-6">
          <CardBody className="grid gap-4">
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

          <p className="mt-4 text-center text-sm text-ink-mute">
            Kod yoki PIN esingizdan chiqdimi?{" "}
            <Link href="/kod" className="font-bold text-teamA hover:underline">
              Ma'lumotimni topish
            </Link>
          </p>
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
