"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CloudDisabled } from "@/components/auth/CloudDisabled";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input } from "@/components/ui/card";
import { joinSession } from "@/lib/live/api";
import { storePlayer } from "@/lib/live/protocol";
import { cn } from "@/lib/utils";

function JoinInner() {
  const { cloud, profile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [pin, setPin] = useState(params.get("pin") ?? "");
  const [name, setName] = useState("");
  const [team, setTeam] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Hisobi bor o'quvchining ismi o'zi to'ldiriladi */
  useEffect(() => {
    if (profile?.full_name) setName((prev) => prev || profile.full_name);
  }, [profile]);

  if (!cloud) return <CloudDisabled title="Ulangan rejim uchun bulut sozlanmagan" />;

  const join = async () => {
    setBusy(true);
    setError(null);
    const { result, error: err } = await joinSession(pin, name, team);
    setBusy(false);
    if (err || !result) {
      setError(err ?? "Qo'shilib bo'lmadi.");
      return;
    }
    storePlayer({
      pin: pin.trim(),
      sessionId: result.sessionId,
      participantId: result.participantId,
      nickname: name.trim(),
      teamNo: team,
      gameId: result.gameId,
    });
    router.push(`/play/${pin.trim()}`);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="Gettalim" className="mx-auto h-14 w-14 rounded-full" />
          <h1 className="mt-3 text-2xl font-extrabold text-ink">O'yinga qo'shilish</h1>
          <p className="mt-1 text-sm text-ink-mute">O'qituvchi ekranidagi PIN kodni kiriting</p>
        </div>

        <Card>
          <CardBody className="grid gap-4">
            <Field label="PIN">
              <Input
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="text-center font-mono text-2xl tracking-[0.35em]"
              />
            </Field>

            <Field label="Ismingiz">
              <Input
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alisher"
                className="text-lg"
              />
            </Field>

            <Field label="Jamoangiz" hint="O'qituvchi aytmagan bo'lsa, 1-jamoada qoling">
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTeam(n)}
                    className={cn(
                      "h-11 rounded-xl border-2 text-base font-extrabold transition",
                      team === n
                        ? "border-ink bg-ink text-white"
                        : "border-paper-line bg-white text-ink hover:bg-paper",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>

            {error ? (
              <p className="rounded-xl border-2 border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900">
                {error}
              </p>
            ) : null}

            <Button
              variant="dark"
              size="lg"
              onClick={join}
              disabled={busy || pin.length !== 6 || name.trim().length < 2}
            >
              <LogIn className="h-5 w-5" /> {busy ? "Ulanmoqda…" : "Kirish"}
            </Button>
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-xs text-ink-mute">Hisob kerak emas — ism yozsangiz kifoya.</p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-ink-mute">…</div>}>
      <JoinInner />
    </Suspense>
  );
}
