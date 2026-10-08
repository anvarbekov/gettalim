"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cloud, CloudOff, Copy, Download, FileJson, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { JsonImport } from "@/components/JsonImport";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { BUILTIN_PACKS } from "@/data/packs";
import { PRACTICE_PACKS } from "@/lib/practice/packs";
import { packToJson } from "@/lib/packIO";
import { getCustomPacks, removePack, savePack } from "@/lib/storage";
import { fetchCloudPacks, isCloudEnabled, pushPack } from "@/lib/supabase";
import type { Pack } from "@/lib/types";
import { download, slugify, uid } from "@/lib/utils";

export default function PacksPage() {
  const { role } = useAuth();
  const { t } = useI18n();
  const [mine, setMine] = useState<Pack[]>([]);
  const [cloud, setCloud] = useState<Pack[]>([]);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const cloudOn = isCloudEnabled();

  const refresh = useCallback(() => setMine(getCustomPacks()), []);

  useEffect(() => {
    refresh();
    if (isCloudEnabled()) {
      fetchCloudPacks()
        .then(setCloud)
        .catch(() => setCloud([]));
    }
  }, [refresh]);

  const duplicate = (pack: Pack) => {
    const copy: Pack = {
      ...pack,
      id: `${slugify(pack.subject)}-${uid("")}`,
      title: `${pack.title} (2)`,
      builtin: false,
      remoteId: undefined,
      createdAt: new Date().toISOString(),
    };
    savePack(copy);
    refresh();
  };

  const toCloud = async (pack: Pack) => {
    setBusy(pack.id);
    try {
      const stored = await pushPack(pack);
      savePack({ ...pack, remoteId: stored.remoteId });
      setCloud(await fetchCloudPacks());
      refresh();
    } catch {
      /* xatolikni jimgina o'tkazamiz — foydalanuvchi lokal nusxaga ega */
    } finally {
      setBusy(null);
    }
  };

  const Row = ({ pack, own }: { pack: Pack; own: boolean }) => (
    <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-2xl"
        style={{ background: `${pack.color}1a` }}
      >
        {pack.icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-extrabold text-ink">{pack.title}</h3>
        <p className="truncate text-sm text-ink-mute">
          {pack.subject}
          {pack.grade ? ` · ${pack.grade}` : ""} ·{" "}
          {pack.generator ? t("setup.endless") : t("packs.count", { n: pack.questions.length })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={`/arqon?pack=${encodeURIComponent(pack.id)}`}>
          <Button size="sm" variant="primary">
            <Play className="h-4 w-4" fill="currentColor" /> {t("packs.play")}
          </Button>
        </Link>
        {own ? (
          <Link href={`/packs/editor?id=${encodeURIComponent(pack.id)}`}>
            <Button size="sm" variant="outline" aria-label={t("packs.edit")}>
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" onClick={() => duplicate(pack)} aria-label={t("packs.copy")}>
            <Copy className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => download(`${slugify(pack.title) || "paket"}.json`, packToJson(pack))}
          aria-label={t("packs.export")}
        >
          <Download className="h-4 w-4" />
        </Button>
        {own && cloudOn ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy === pack.id}
            onClick={() => void toCloud(pack)}
            aria-label={t("packs.cloudSave")}
          >
            <Cloud className="h-4 w-4" />
          </Button>
        ) : null}
        {own ? (
          <Button
            size="sm"
            variant="outline"
            className="text-teamB"
            onClick={() => {
              removePack(pack.id);
              refresh();
            }}
            aria-label={t("packs.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );

  // Savollar bazasi o'qituvchi uchun: o'quvchi bu yerda javoblarni ko'rib qolmasin
  if (role === "student") {
    return (
      <div className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-ink">Bu bo'lim o'qituvchilar uchun</h1>
          <p className="mt-2 text-ink-mute">Topshiriqlar va o'yinlar kabinetingizda turadi.</p>
          <Link href="/talaba" className="mt-4 inline-block font-bold text-teamA hover:underline">
            Kabinetimga o'tish →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t("packs.title")}</h1>
            <p className="mt-1 text-ink-mute">{t("packs.sub")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImporting(true)}>
              <FileJson className="h-4 w-4" /> {t("packs.import")}
            </Button>
            <Link href="/packs/editor">
              <Button variant="dark">
                <Plus className="h-4 w-4" /> {t("packs.new")}
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-2 text-xs font-bold text-ink-mute">
          {cloudOn ? <Cloud className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
          {cloudOn ? "Supabase" : t("packs.cloudOff")}
        </p>

        <section className="mt-8">
          <h2 className="eyebrow mb-3">{t("packs.mine")}</h2>
          {mine.length ? (
            <div className="grid gap-3">
              {mine.map((pack) => (
                <Row key={pack.id} pack={pack} own />
              ))}
            </div>
          ) : (
            <div className="surface p-6 text-center text-ink-mute">{t("packs.empty")}</div>
          )}
        </section>

        {cloud.length ? (
          <section className="mt-8">
            <h2 className="eyebrow mb-3">{t("packs.cloud")}</h2>
            <div className="grid gap-3">
              {cloud.map((pack) => (
                <Row key={pack.id} pack={pack} own={false} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="eyebrow mb-3">{t("packs.builtin")}</h2>
          <div className="grid gap-3">
            {[...BUILTIN_PACKS, ...PRACTICE_PACKS].map((pack) => (
              <Row key={pack.id} pack={pack} own={false} />
            ))}
          </div>
        </section>
      </main>

      {importing ? (
        <JsonImport
          onDone={() => refresh()}
          onClose={() => {
            setImporting(false);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}
