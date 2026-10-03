import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MatchResult, Pack } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Supabase sozlangan bo'lsa mijozni qaytaradi, aks holda null. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key || url.includes("xxxxxxxx")) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const isCloudEnabled = () => getSupabase() !== null;

/* ------------------------------------------------------------------ */
/*  Paketlar                                                           */
/* ------------------------------------------------------------------ */

interface PackRow {
  id: string;
  title: string;
  subject: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  grade: string | null;
  author: string | null;
  language: string | null;
  questions: Pack["questions"];
  created_at: string;
}

const rowToPack = (row: PackRow): Pack => ({
  id: `cloud_${row.id}`,
  remoteId: row.id,
  title: row.title,
  subject: row.subject,
  icon: row.icon ?? "📚",
  color: row.color ?? "#1f6fd0",
  description: row.description ?? undefined,
  grade: row.grade ?? undefined,
  author: row.author ?? undefined,
  language: (row.language as Pack["language"]) ?? "uz",
  questions: row.questions ?? [],
  createdAt: row.created_at,
});

export async function fetchCloudPacks(): Promise<Pack[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("question_packs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data as PackRow[]).map(rowToPack);
}

export async function pushPack(pack: Pack): Promise<Pack> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase sozlanmagan.");
  const payload = {
    title: pack.title,
    subject: pack.subject,
    icon: pack.icon,
    color: pack.color,
    description: pack.description ?? null,
    grade: pack.grade ?? null,
    author: pack.author ?? null,
    language: pack.language ?? "uz",
    questions: pack.questions,
  };
  const query = pack.remoteId
    ? sb.from("question_packs").update(payload).eq("id", pack.remoteId).select().single()
    : sb.from("question_packs").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return rowToPack(data as PackRow);
}

export async function deleteCloudPack(remoteId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("question_packs").delete().eq("id", remoteId);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Natijalar                                                          */
/* ------------------------------------------------------------------ */

export async function pushMatch(result: MatchResult) {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from("matches").insert({
    pack_title: result.packTitle,
    subject: result.subject,
    team_a: result.teamA,
    team_b: result.teamB,
    score_a: result.scoreA,
    score_b: result.scoreB,
    winner: result.winner,
    duration_sec: result.durationSec,
    stats: { a: result.statsA, b: result.statsB },
  });
  if (error) throw new Error(error.message);
}

export async function fetchMatches(limit = 50): Promise<MatchResult[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: Record<string, any>) => ({
    id: String(row.id),
    packId: "",
    packTitle: row.pack_title,
    subject: row.subject,
    teamA: row.team_a,
    teamB: row.team_b,
    scoreA: row.score_a,
    scoreB: row.score_b,
    winner: row.winner,
    statsA: row.stats?.a ?? { correct: 0, wrong: 0, score: row.score_a, bestStreak: 0 },
    statsB: row.stats?.b ?? { correct: 0, wrong: 0, score: row.score_b, bestStreak: 0 },
    durationSec: row.duration_sec ?? 0,
    playedAt: row.created_at,
  }));
}
