"use client";

import { getBrowserClient } from "@/lib/supabase/client";
import type { ParticipantRow, SessionRow } from "@/lib/supabase/types";

export interface CreatedSession {
  id: string;
  pin: string;
}

/** Tasodifiy 6 xonali PIN. Bazada takrorlanmasligi tekshiriladi. */
const randomPin = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * O'qituvchi sessiya ochadi. Savollar bazaga ko'chirilmaydi — ular
 * o'qituvchi kompyuteridagi paketdan olinadi va broadcast bilan tarqatiladi.
 */
export async function createSession(
  hostId: string,
  gameId: string,
  config: Record<string, unknown>,
): Promise<{ session: CreatedSession | null; error: string | null }> {
  const supabase = getBrowserClient();
  if (!supabase) return { session: null, error: "Supabase sozlanmagan." };

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const pin = randomPin();
    const { data, error } = await supabase
      .from("sessions")
      .insert({ pin, game_id: gameId, host_id: hostId, config, status: "waiting" })
      .select("id, pin")
      .single();

    if (!error && data) return { session: data as CreatedSession, error: null };
    if (error && !error.message.includes("duplicate key")) return { session: null, error: error.message };
  }
  return { session: null, error: "PIN yaratilmadi, qaytadan urinib ko'ring." };
}

export async function setSessionStatus(id: string, status: SessionRow["status"]) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  const patch: Partial<SessionRow> = { status };
  if (status === "running") patch.started_at = new Date().toISOString();
  if (status === "finished") patch.ended_at = new Date().toISOString();
  await supabase.from("sessions").update(patch).eq("id", id);
}

export async function loadSession(id: string): Promise<SessionRow | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data } = await supabase.from("sessions").select("*").eq("id", id).maybeSingle();
  return (data as SessionRow | null) ?? null;
}

export async function listParticipants(sessionId: string): Promise<ParticipantRow[]> {
  const supabase = getBrowserClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("participants")
    .select("*")
    .eq("session_id", sessionId)
    .order("score", { ascending: false });
  return (data as ParticipantRow[] | null) ?? [];
}

export interface JoinResult {
  sessionId: string;
  participantId: string;
  gameId: string;
  config: Record<string, unknown>;
}

/** O'quvchi PIN bilan qo'shiladi. Hisob shart emas. */
export async function joinSession(
  pin: string,
  nickname: string,
  teamNo: number,
): Promise<{ result: JoinResult | null; error: string | null }> {
  const supabase = getBrowserClient();
  if (!supabase) return { result: null, error: "Supabase sozlanmagan." };

  const { data, error } = await supabase.rpc("join_session", {
    p_pin: pin.trim(),
    p_nickname: nickname.trim(),
    p_team: teamNo,
  });

  if (error) {
    if (error.message.includes("SESSION_NOT_FOUND")) {
      return { result: null, error: "Bunday PIN topilmadi yoki o'yin tugagan." };
    }
    if (error.message.includes("NICKNAME_REQUIRED")) {
      return { result: null, error: "Ismingizni yozing." };
    }
    return { result: null, error: error.message };
  }

  const row = (data as unknown as {
    session_id: string;
    participant_id: string;
    game_id: string;
    config: Record<string, unknown>;
  }[])?.[0];

  if (!row) return { result: null, error: "Sessiya topilmadi." };
  return {
    result: {
      sessionId: row.session_id,
      participantId: row.participant_id,
      gameId: row.game_id,
      config: row.config ?? {},
    },
    error: null,
  };
}

/** O'quvchini boshqa jamoaga o'tkazish (faqat sessiya egasi). */
export async function setParticipantTeam(participantId: string, teamNo: number) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  await supabase.from("participants").update({ team_no: teamNo }).eq("id", participantId);
}

/** Javobni bazaga yozadi va yangi umumiy ballni qaytaradi. */
export async function submitAnswer(
  participantId: string,
  question: string,
  answer: string,
  correct: boolean,
  ms: number,
  /** To'g'ri javob — keyinchalik «Mening xatolarim» da ko'rsatiladi. */
  right?: string,
): Promise<number | null> {
  const supabase = getBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("submit_answer", {
    p_participant: participantId,
    p_question: question,
    p_answer: answer,
    p_correct: correct,
    p_ms: Math.round(ms),
    p_right: right ?? null,
  });

  if (error) return null;
  return (data as number | null) ?? null;
}
