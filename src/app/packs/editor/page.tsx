"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Copy, Plus, Save, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Field, Input, Select, Textarea } from "@/components/ui/card";
import { packToJson } from "@/lib/packIO";
import { getPack, savePack } from "@/lib/storage";
import type { Pack, Question, QuestionType } from "@/lib/types";
import { slugify, uid } from "@/lib/utils";

const emptyQuestion = (): Question => ({ id: uid("q"), type: "number", prompt: "", answer: "" });

const blankPack = (): Pack => ({
  id: `paket-${uid("")}`,
  title: "",
  subject: "",
  icon: "📚",
  color: "#1f6fd0",
  language: "uz",
  questions: [emptyQuestion()],
  createdAt: new Date().toISOString(),
});

const ICONS = ["📚", "➕", "💻", "📖", "🌿", "🏛️", "🗺️", "🧲", "⚗️", "🇬🇧", "🎨", "🎵", "⚽", "🧮"];
const COLORS = ["#1f6fd0", "#d2402f", "#0f9b8e", "#7a3fd0", "#b07e1f", "#1f9d63", "#0e7fa8"];

function EditorInner() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [pack, setPack] = useState<Pack>(blankPack);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = params.get("id");
    if (!id) return;
    const found = getPack(id);
    if (found) setPack({ ...found, builtin: false });
  }, [params]);

  const json = useMemo(() => packToJson(pack), [pack]);

  const patch = (part: Partial<Pack>) => setPack((p) => ({ ...p, ...part }));

  const patchQuestion = (index: number, part: Partial<Question>) =>
    setPack((p) => {
      const questions = [...p.questions];
      questions[index] = { ...questions[index], ...part };
      return { ...p, questions };
    });

  const removeQuestion = (index: number) =>
    setPack((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== index) }));

  const addQuestion = () => setPack((p) => ({ ...p, questions: [...p.questions, emptyQuestion()] }));

  const canSave = pack.title.trim() && pack.subject.trim() && pack.questions.some((q) => q.prompt && q.answer);

  const save = () => {
    const cleaned: Pack = {
      ...pack,
      id: pack.id.startsWith("paket-") ? `${slugify(pack.subject) || "fan"}-${uid("")}` : pack.id,
      questions: pack.questions
        .filter((q) => q.prompt.trim() && q.answer.trim())
        .map((q) => ({
          ...q,
          options:
            q.type === "choice"
              ? Array.from(new Set([q.answer, ...(q.options ?? [])].map((o) => o.trim()).filter(Boolean)))
              : undefined,
        })),
    };
    savePack(cleaned);
    setPack(cleaned);
    setSavedAt(Date.now());
    setTimeout(() => router.push("/packs"), 600);
  };

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/packs" className="link-quiet mb-4 inline-flex items-center gap-1.5 text-sm font-bold">
          <ArrowLeft className="h-4 w-4" /> {t("nav.packs")}
        </Link>
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{t("editor.title")}</h1>

        <Card className="mt-6">
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <h2 className="eyebrow sm:col-span-2">{t("editor.meta")}</h2>
            <Field label={t("editor.name")}>
              <Input value={pack.title} onChange={(e) => patch({ title: e.target.value })} />
            </Field>
            <Field label={t("editor.subject")}>
              <Input value={pack.subject} onChange={(e) => patch({ subject: e.target.value })} />
            </Field>
            <Field label={t("editor.grade")}>
              <Input value={pack.grade ?? ""} onChange={(e) => patch({ grade: e.target.value })} />
            </Field>
            <Field label={t("editor.desc")}>
              <Input value={pack.description ?? ""} onChange={(e) => patch({ description: e.target.value })} />
            </Field>
            <Field label={t("editor.icon")}>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => patch({ icon })}
                    className={`grid h-10 w-10 place-items-center rounded-lg border-2 text-xl ${
                      pack.icon === icon ? "border-teamA bg-teamA-soft" : "border-paper-line bg-white"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t("editor.color")}>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => patch({ color })}
                    aria-label={color}
                    className={`h-10 w-10 rounded-lg border-2 ${
                      pack.color === color ? "border-ink" : "border-transparent"
                    }`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </Field>
          </CardBody>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink">
            {t("editor.questions")}{" "}
            <span className="font-mono text-base text-ink-mute">({pack.questions.length})</span>
          </h2>
          <Button size="sm" variant="outline" onClick={addQuestion}>
            <Plus className="h-4 w-4" /> {t("editor.add")}
          </Button>
        </div>

        <div className="mt-3 grid gap-3">
          {pack.questions.map((question, index) => (
            <Card key={question.id}>
              <CardBody className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
                <span className="mt-1 font-mono text-sm font-bold text-ink-mute">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="grid gap-3">
                  <Field label={t("editor.prompt")}>
                    <Input
                      value={question.prompt}
                      onChange={(e) => patchQuestion(index, { prompt: e.target.value })}
                    />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                    <Field label={t("editor.type")}>
                      <Select
                        value={question.type}
                        onChange={(e) => patchQuestion(index, { type: e.target.value as QuestionType })}
                      >
                        <option value="number">{t("type.number")}</option>
                        <option value="text">{t("type.text")}</option>
                        <option value="choice">{t("type.choice")}</option>
                      </Select>
                    </Field>
                    <Field label={t("editor.answer")}>
                      <Input
                        value={question.answer}
                        onChange={(e) => patchQuestion(index, { answer: e.target.value })}
                      />
                    </Field>
                  </div>
                  {question.type !== "choice" ? (
                    <p className="rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-ink-mute">
                      {t("editor.autoOptions")}
                    </p>
                  ) : null}
                  {question.type === "choice" ? (
                    <Field label={t("editor.options")}>
                      <Input
                        value={(question.options ?? []).filter((o) => o !== question.answer).join(", ")}
                        onChange={(e) =>
                          patchQuestion(index, {
                            options: [
                              question.answer,
                              ...e.target.value
                                .split(",")
                                .map((o) => o.trim())
                                .filter(Boolean),
                            ],
                          })
                        }
                      />
                    </Field>
                  ) : null}
                  <div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-teamB"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="h-4 w-4" /> {t("editor.remove")}
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardBody>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="eyebrow">{t("editor.json")}</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(json);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1400);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Textarea readOnly value={json} className="h-56" spellCheck={false} />
          </CardBody>
        </Card>

        <div className="sticky bottom-4 mt-6">
          <Button size="lg" variant="dark" className="w-full" disabled={!canSave} onClick={save}>
            <Save className="h-5 w-5" /> {savedAt ? t("editor.saved") : t("editor.save")}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-ink-mute">…</div>}>
      <EditorInner />
    </Suspense>
  );
}
