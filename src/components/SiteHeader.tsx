"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Dumbbell, Layers, Play, Trophy, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useI18n } from "@/components/providers";
import { LANGS, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang)!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 140)}
        className="flex items-center gap-2 rounded-xl border-2 border-paper-line bg-white px-3 py-2 text-sm font-extrabold text-ink hover:bg-paper"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{current.flag}</span>
        {!compact ? <span className="uppercase">{current.code}</span> : null}
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute right-0 z-40 mt-2 w-44 overflow-hidden rounded-xl border border-paper-line bg-white py-1 shadow-lift"
        >
          {LANGS.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                role="option"
                aria-selected={option.code === lang}
                onClick={() => {
                  setLang(option.code as Lang);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-bold hover:bg-paper",
                  option.code === lang ? "text-teamA" : "text-ink",
                )}
              >
                <span>{option.flag}</span>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  const { cloud, user, role } = useAuth();
  const pathname = usePathname();

  const isStudent = role === "student";

  const links = [
    { href: "/mashq", label: "Mashqlar", icon: Dumbbell },
    // Savollar bazasi — o'qituvchi asbobi. O'quvchiga ko'rsatilmaydi,
    // aks holda barcha fanlar va to'g'ri javoblar ochilib qoladi.
    ...(isStudent ? [] : [{ href: "/packs", label: t("nav.packs"), icon: Layers }]),
    { href: "/leaderboard", label: t("nav.board"), icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-paper-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.png" alt="Gettalim" className="h-10 w-10 rounded-full shadow-card" />
          <span className="hidden text-lg font-extrabold leading-none text-ink sm:block">Gettalim</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition",
                pathname.startsWith(href) ? "bg-white text-ink shadow-card" : "text-ink-soft hover:bg-white/70",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          {cloud ? (
            <Link
              href={user ? (role === "student" ? "/talaba" : "/dashboard") : "/kirish"}
              className="hidden items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-bold text-ink-soft transition hover:text-ink sm:flex"
            >
              <UserRound className="h-4 w-4" />
              {user ? (role === "student" ? "Kabinet" : "Panel") : "Kirish"}
            </Link>
          ) : null}

          <Link
            href="/arqon"
            className="ml-1 flex items-center gap-1.5 rounded-xl bg-teamA px-3.5 py-2 text-sm font-extrabold text-white shadow-lift hover:bg-teamA-deep"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            <span className="hidden sm:inline">{t("nav.play")}</span>
          </Link>
          <div className="ml-1">
            <LanguageSwitcher compact />
          </div>
        </nav>
      </div>
    </header>
  );
}


