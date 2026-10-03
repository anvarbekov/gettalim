"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardBody } from "@/components/ui/card";

/**
 * Uy vazifasi bu ekrandan emas, o'qituvchi panelidan beriladi —
 * chunki sinf, muddat va urinishlar soni kerak. Shuning uchun bu yerda
 * qisqa yo'riqnoma va panelga havola ko'rsatiladi.
 */
export function HomeworkHint() {
  const { cloud, role } = useAuth();

  return (
    <Card className="mt-4 border-2 border-[#7a3fd0]/30">
      <CardBody className="flex flex-wrap items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#7a3fd0]/10 text-[#7a3fd0]">
          <BookOpen className="h-6 w-6" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-extrabold text-ink">Uy vazifasi panelidan beriladi</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft">
            Sinf, muddat va urinishlar sonini belgilash kerak — shuning uchun topshiriq
            o'qituvchi panelidan beriladi. Savollar bulutga ko'chiriladi, o'quvchi uyda
            o'z kabinetidan ochadi, natija esa jurnalga o'zi tushadi.
          </span>
        </span>

        {cloud && role === "teacher" ? (
          <Link
            href="/dashboard/assignments"
            className="flex items-center gap-1.5 rounded-xl2 bg-ink px-4 py-2.5 text-sm font-extrabold text-white hover:bg-ink-soft"
          >
            Topshiriq berish <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={cloud ? "/kirish" : "/"}
            className="rounded-xl2 border-2 border-paper-line px-4 py-2.5 text-sm font-extrabold text-ink hover:bg-paper"
          >
            {cloud ? "O'qituvchi sifatida kirish" : "Bulut sozlanmagan"}
          </Link>
        )}
      </CardBody>
    </Card>
  );
}
