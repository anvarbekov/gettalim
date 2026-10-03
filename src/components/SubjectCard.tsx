"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Pack } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let disposed = false;
    let instance: { destroy: () => void } | null = null;

    void import("vanilla-tilt").then(({ default: VanillaTilt }) => {
      if (disposed) return;
      VanillaTilt.init(node, {
        max,
        speed: 500,
        glare: true,
        "max-glare": 0.16,
        scale: 1.02,
        gyroscope: false,
      });
      instance = (node as unknown as { vanillaTilt: { destroy: () => void } }).vanillaTilt;
    });

    return () => {
      disposed = true;
      instance?.destroy();
    };
  }, [max]);

  return (
    <div ref={ref} className={className} style={{ transformStyle: "preserve-3d" }}>
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
