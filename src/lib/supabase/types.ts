/**
 * Baza tiplari.
 * Diqqat: `interface` emas, `type` ishlatilgan — Supabase generiklari
 * satrlarni `Record<string, unknown>` sifatida ko'rishi shart. `supabase/schema.sql` ga mos qo'lda yozilgan —
 * shunda kod generatorisiz ham TypeScript to'liq tekshiradi.
 */

export type UserRole = "admin" | "teacher" | "student";
export type SessionStatus = "waiting" | "running" | "finished";
export type QuestionType = "choice" | "number" | "text";

export type ProfileRow = {
  id: string;
  full_name: string;
  role: UserRole;
  avatar: string | null;
  student_code: string | null;
  xp: number;
  level: number;
  streak_days: number;
  last_active: string | null;
  created_at: string;
};

export type ClassRow = {
  id: string;
  name: string;
  teacher_id: string;
  join_code: string;
  archived: boolean;
  /** Ro'yxat shu vaqtgacha ochiq (kirish ma'lumotlarini ko'rsatish uchun). */
  roster_open_until: string | null;
  /** O'quvchilarga ko'rinadigan paketlar. null — cheklov yo'q. */
  visible_packs: string[] | null;
  created_at: string;
};

export type ClassStudentRow = {
  class_id: string;
  student_id: string;
  pin: string | null;
  added_at: string;
};

export type PackRow = {
  id: string;
  owner_id: string | null;
  title: string;
  subject: string;
  grade: number | null;
  icon: string | null;
  color: string | null;
  description: string | null;
  language: string | null;
  is_public: boolean;
  created_at: string;
};

export type QuestionRow = {
  id: string;
  pack_id: string;
  type: QuestionType;
  text: string;
  answer: string;
  options: string[];
  alt: string[];
  difficulty: number;
  image_url: string | null;
  explanation: string | null;
  position: number;
  created_at: string;
};

export type SessionRow = {
  id: string;
  pin: string;
  game_id: string;
  pack_id: string | null;
  host_id: string;
  class_id: string | null;
  status: SessionStatus;
  config: Record<string, unknown>;
  current_question_index: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

export type ParticipantRow = {
  id: string;
  session_id: string;
  student_id: string | null;
  nickname: string;
  team_no: number;
  score: number;
  joined_at: string;
};

export type AnswerRow = {
  id: string;
  session_id: string;
  participant_id: string;
  question_id: string | null;
  question_text: string | null;
  given_answer: string | null;
  is_correct: boolean;
  ms_taken: number | null;
  created_at: string;
};

export type AssignmentRow = {
  id: string;
  teacher_id: string;
  class_id: string;
  game_id: string;
  pack_id: string | null;
  title: string;
  config: Record<string, unknown>;
  due_at: string | null;
  max_attempts: number;
  created_at: string;
};

export type SubmissionRow = {
  id: string;
  assignment_id: string;
  student_id: string;
  attempt_no: number;
  score: number;
  max_score: number;
  details: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      classes: Table<ClassRow>;
      class_students: Table<ClassStudentRow>;
      packs: Table<PackRow>;
      questions: Table<QuestionRow>;
      sessions: Table<SessionRow>;
      participants: Table<ParticipantRow>;
      answers: Table<AnswerRow>;
      assignments: Table<AssignmentRow>;
      submissions: Table<SubmissionRow>;
      achievements: Table<{ id: string; code: string; title: string; description: string | null; icon: string | null }>;
      user_achievements: Table<{ user_id: string; achievement_id: string; earned_at: string }>;
      chat_channels: Table<{
        id: string;
        kind: string;
        title: string | null;
        class_id: string | null;
        lesson_id: string | null;
        owner_id: string | null;
        slug: string | null;
        allow_guests: boolean;
        archived: boolean;
        locked: boolean;
        created_at: string;
      }>;
      chat_settings: Table<{
        teacher_id: string;
        students_enabled: boolean;
        updated_at: string;
      }>;
      chat_members: Table<{
        channel_id: string;
        user_id: string;
        joined_at: string;
        read_at: string;
        muted: boolean;
      }>;
      chat_messages: Table<{
        id: string;
        channel_id: string;
        author_id: string | null;
        guest_id: string | null;
        author_name: string;
        kind: string;
        body: string | null;
        media_url: string | null;
        media_name: string | null;
        media_size: number | null;
        duration: number | null;
        reply_to: string | null;
        deleted: boolean;
        reactions: Record<string, string[]>;
        created_at: string;
      }>;
      chat_blocks: Table<{
        channel_id: string;
        guest_id: string;
        blocked_by: string | null;
        blocked_at: string;
      }>;
      lessons: Table<{
        id: string;
        teacher_id: string;
        class_id: string | null;
        pin: string;
        title: string;
        status: "live" | "ended";
        allow_guests: boolean;
        started_at: string;
        ended_at: string | null;
      }>;
    };
    Views: { [_ in never]: never };
    Functions: {
      find_class_by_code: {
        Args: { code: string };
        Returns: { id: string; name: string }[];
      };
      generate_session_pin: { Args: { [_ in never]: never }; Returns: string };
      join_session: {
        Args: { p_pin: string; p_nickname: string; p_team?: number };
        Returns: {
          session_id: string;
          participant_id: string;
          game_id: string;
          config: Record<string, unknown>;
          status: SessionStatus;
        }[];
      };
      submit_answer: {
        Args: {
          p_participant: string;
          p_question: string;
          p_answer: string;
          p_correct: boolean;
          p_ms?: number;
          p_right?: string | null;
        };
        Returns: number;
      };
      my_mistakes: {
        Args: { p_limit?: number };
        Returns: {
          question_text: string;
          correct_answer: string | null;
          last_answer: string | null;
          times_wrong: number;
          last_at: string;
        }[];
      };
      my_shop: {
        Args: { [_ in never]: never };
        Returns: {
          id: string;
          kind: string;
          title: string;
          emoji: string | null;
          description: string | null;
          value: string | null;
          price: number;
          min_level: number;
          consumable: boolean;
          owned: boolean;
          qty: number;
          equipped: boolean;
        }[];
      };
      my_loadout: {
        Args: { [_ in never]: never };
        Returns: {
          kind: string;
          id: string;
          title: string;
          emoji: string | null;
          value: string | null;
        }[];
      };
      my_boosts: {
        Args: { [_ in never]: never };
        Returns: {
          id: string;
          title: string;
          emoji: string | null;
          value: string | null;
          qty: number;
        }[];
      };
      buy_item: {
        Args: { p_item: string };
        Returns: { ok: boolean; message: string; xp: number }[];
      };
      equip_item: { Args: { p_item: string }; Returns: undefined };
      use_boost: { Args: { p_item: string }; Returns: number };
      open_lesson: {
        Args: { p_title?: string; p_class?: string | null; p_guests?: boolean };
        Returns: { id: string; pin: string }[];
      };
      close_lesson: { Args: { p_lesson: string }; Returns: boolean };
      my_live_lesson: {
        Args: { [_ in never]: never };
        Returns: { id: string; pin: string; title: string; class_id: string | null; started_at: string }[];
      };
      my_channels: {
        Args: { [_ in never]: never };
        Returns: {
          id: string;
          kind: string;
          title: string;
          last_body: string | null;
          last_at: string | null;
          unread: number;
          locked: boolean;
          can_write: boolean;
          watching: boolean;
        }[];
      };
      delete_messages: { Args: { p_channel: string; p_ids: string[] | null }; Returns: number };
      react: { Args: { p_message: string; p_emoji: string }; Returns: Record<string, string[]> | null };
      set_channel_lock: { Args: { p_channel: string; p_locked: boolean }; Returns: boolean };
      set_students_chat: { Args: { p_enabled: boolean }; Returns: boolean };
      my_chat_state: {
        Args: { [_ in never]: never };
        Returns: { staff: boolean; students_enabled: boolean; open_for_me: boolean }[];
      };
      chat_contacts: {
        Args: { [_ in never]: never };
        Returns: { id: string; full_name: string; role: string; class_name: string | null }[];
      };
      class_channel: { Args: { p_class: string }; Returns: string };
      open_channel: { Args: { p_title: string }; Returns: { id: string; slug: string }[] };
      channel_by_slug: {
        Args: { p_slug: string };
        Returns: { id: string; title: string; allow_guests: boolean; archived: boolean; locked: boolean }[];
      };
      guest_messages: { Args: { p_channel: string; p_limit?: number }; Returns: unknown[] };
      block_guest: { Args: { p_channel: string; p_guest: string }; Returns: boolean };
      dm_channel: { Args: { p_other: string }; Returns: string };
      mark_read: { Args: { p_channel: string }; Returns: undefined };
      can_see_channel: { Args: { p_channel: string }; Returns: boolean };
      guest_send: {
        Args: {
          p_channel: string;
          p_guest: string;
          p_name: string;
          p_kind: string;
          p_body?: string | null;
          p_media_url?: string | null;
          p_media_name?: string | null;
          p_media_size?: number | null;
          p_duration?: number | null;
        };
        Returns: string;
      };
      lesson_for_me: {
        Args: { [_ in never]: never };
        Returns: { pin: string; title: string; teacher: string; started_at: string }[];
      };
      my_claims: {
        Args: { [_ in never]: never };
        Returns: {
          id: string;
          item_id: string;
          title: string;
          emoji: string | null;
          status: string;
          created_at: string;
          decided_at: string | null;
        }[];
      };
      teacher_claims: {
        Args: { p_status?: string | null };
        Returns: {
          id: string;
          student_id: string;
          full_name: string;
          class_name: string | null;
          item_id: string;
          title: string;
          emoji: string | null;
          price: number;
          status: string;
          created_at: string;
        }[];
      };
      decide_claim: {
        Args: { p_claim: string; p_status: string; p_note?: string | null };
        Returns: boolean;
      };
      session_state: {
        Args: { p_pin: string };
        Returns: { status: SessionStatus; game_id: string; current_question_index: number }[];
      };
      assignment_stats: {
        Args: { p_assignment: string };
        Returns: {
          student_id: string;
          full_name: string;
          attempts: number;
          best_score: number;
          max_score: number;
          finished_at: string | null;
        }[];
      };
      pack_assigned_to_me: { Args: { target: string }; Returns: boolean };
      award_xp: {
        Args: { p_amount: number };
        Returns: { xp: number; level: number; streak_days: number; leveled_up: boolean }[];
      };
      grant_achievement: { Args: { p_code: string }; Returns: boolean };
      set_visible_packs: { Args: { p_class: string; p_packs: string[] | null }; Returns: undefined };
      my_visible_packs: {
        Args: { [_ in never]: never };
        Returns: { unlimited: boolean; packs: string[] }[];
      };
      open_roster: { Args: { p_class: string; p_minutes?: number }; Returns: string };
      close_roster: { Args: { p_class: string }; Returns: undefined };
      roster_open: {
        Args: { p_code: string };
        Returns: { class_name: string; open_until: string }[];
      };
      public_roster: {
        Args: { p_code: string };
        Returns: { student_id: string; full_name: string; class_name: string }[];
      };
      public_credentials: {
        Args: { p_code: string; p_student: string };
        Returns: { full_name: string; class_name: string; join_code: string; pin: string | null }[];
      };
      my_achievements: {
        Args: { [_ in never]: never };
        Returns: {
          code: string;
          title: string;
          description: string | null;
          icon: string | null;
          earned_at: string | null;
        }[];
      };
      class_leaderboard: {
        Args: { p_class?: string };
        Returns: {
          student_id: string;
          full_name: string;
          xp: number;
          level: number;
          streak_days: number;
          class_name: string;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      session_status: SessionStatus;
      question_type: QuestionType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
