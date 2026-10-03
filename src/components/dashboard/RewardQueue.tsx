"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Gift, Undo2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { decideClaim, fetchTeacherClaims, type TeacherClaim } from "@/lib/gamification/shop";
import { cn } from "@/lib/utils";

/**
 * Sovg'a kuponlari navbati.
 *
 * O'quvchi XP ga haqiqiy imtiyoz sotib olganda kupon shu yerga tushadi.
 * Oxirgi qaror o'qituvchida: «Berildi» yoki «Bermayman» (bunda XP qaytadi).
 *
 * Panelga faqat kupon bo'lganda ko'rinadi — bo'sh blok joy egallamaydi.
 */
export function RewardQueue() {
  const [claims, setClaims] = useState<TeacherClaim[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchTeacherClaims("pending").then(setClaims);
  }, []);

  useEffect(load, [load]);

  const decide = async (claim: TeacherClaim, status: "approved" | "refunded") => {
    setBusy(claim.id);
    const ok = await decideClaim(claim.id, status);
    setBusy(null);
    if (ok) setClaims((list) => list.filter((c) => c.id !== claim.id));
  };

  if (claims.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="eyebrow mb-2 flex items-center gap-2">
        <Gift className="h-4 w-4" /> Sovg'a kuponlari · {claims.length}
      </h2>

      <Card>
        <CardBody className="space-y-2.5">
          <p className="text-sm text-ink-mute">
            O'quvchilar XP ga sinf imtiyozlarini sotib oldi. Berilsa — «Berildi»; to'g'ri kelmasa —
            «Bermayman», bunda XP o'quvchiga qaytariladi.
          </p>

          {claims.map((claim) => (
            <div
              key={claim.id}
              className="flex flex-wrap items-center gap-3 rounded-xl2 border-2 border-paper-line px-4 py-3"
            >
              <span className="text-3xl" aria-hidden>
                {claim.emoji}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate font-extrabold text-ink">{claim.title}</span>
                <span className="block text-xs text-ink-mute">
                  {claim.fullName}
                  {claim.className ? ` · ${claim.className}` : ""} ·{" "}
                  {new Date(claim.createdAt).toLocaleDateString("uz-UZ")} · {claim.price} XP
                </span>
              </span>

              <button
                type="button"
                disabled={busy === claim.id}
                onClick={() => void decide(claim, "approved")}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold text-white",
                  "hover:bg-emerald-700 disabled:opacity-50",
                )}
              >
                <Check className="h-4 w-4" strokeWidth={3} /> Berildi
              </button>

              <button
                type="button"
                disabled={busy === claim.id}
                onClick={() => void decide(claim, "refunded")}
                className="flex items-center gap-1.5 rounded-xl border-2 border-paper-line bg-white px-4 py-2 text-sm font-extrabold text-ink hover:bg-paper disabled:opacity-50"
              >
                <Undo2 className="h-4 w-4" /> Bermayman
              </button>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
