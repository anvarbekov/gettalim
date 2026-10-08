"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Pack } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Karta ustiga kelganda yengil ko'tariladi. Avval vanilla-tilt (sichqoncha
 * bilan 3D aylanish) edi — kuchsiz kompyuterlarda qotishga sabab bo'lardi,
 * endi faqat CSS: GPU bajaradi, JavaScript ishlamaydi.
 */
export function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  return (
    <div
      className={cn(
        "transition-transform duration-200 ease-out hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SubjectCard({ pack, label }: { pack: Pack; label: string }) {
  const count = pack.generator ? "∞" : pack.questions.length;
  return (
    <TiltCard>
      <Link
        href={`/arqon?pack=${encodeURIComponent(pack.id)}`}
        className={cn(
          "group flex h-full flex-col justify-between rounded-xl2 border border-paper-line bg-white p-5",
          "shadow-card transition hover:shadow-lift",
        )}
        style={{ transform: "translateZ(24px)" }}
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
              style={{ background: `${pack.color}1a` }}
            >
              {pack.icon}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider"
              style={{ background: `${pack.color}14`, color: pack.color }}
            >
              {pack.subject}
            </span>
          </div>
          <h3 className="mt-4 text-lg font-extrabold leading-tight text-ink">{pack.title}</h3>
          {pack.description ? (
            <p className="mt-1.5 line-clamp-2 text-sm text-ink-mute">{pack.description}</p>
          ) : null}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm font-bold text-ink-soft">
          <span>
            {count} {label}
            {pack.grade ? <span className="text-ink-mute"> · {pack.grade}</span> : null}
          </span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" style={{ color: pack.color }} />
        </div>
      </Link>
    </TiltCard>
  );
}
