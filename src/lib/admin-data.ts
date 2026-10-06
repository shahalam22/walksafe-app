// Session data and the user list, read straight from Supabase with the admin's
// login (so it works while the server is off). Row level security limits this
// to admins.
import { supabase, type Role } from "./supabase";

export interface UserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  sessions: { count: number }[];
}

export interface SessionRow {
  session_id: string;
  user_id: string | null;
  started_at: string;
  ended_at: string | null;
  total_frames: number;
  end_reason: string | null;
}

export interface LabelCount {
  label: string | null;
  count: number;
}

export interface SessionStats {
  sessions: number;
  total_frames: number;
  avg_speed_ms: number | null;
  total_agents: number;
  critical_count: number;
  commands: LabelCount[];
  actions: LabelCount[];
  risks: LabelCount[];
}

export interface SpeedPoint {
  frame_idx: number;
  ego_speed_ms: number | null;
  action: string | null;
}

export type ExportTable = "frames" | "agents" | "gaps";

const SESSION_COLUMNS = "session_id, user_id, started_at, ended_at, total_frames, end_reason";
const PAGE = 1000;

export const userName = (u: UserRow | undefined) => (u ? u.display_name || u.email || "—" : "Deleted user");

export async function fetchUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, is_active, created_at, sessions(count)")
    .order("created_at");
  if (error) throw error;
  return data as UserRow[];
}

export async function fetchSessions(userId: string | null): Promise<SessionRow[]> {
  let q = supabase.from("sessions").select(SESSION_COLUMNS).order("started_at", { ascending: false }).limit(200);
  if (userId) q = q.eq("user_id", userId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function fetchSession(sessionId: string): Promise<SessionRow | null> {
  const { data, error } = await supabase.from("sessions").select(SESSION_COLUMNS)
    .eq("session_id", sessionId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchStats(filter: { session?: string | null; user?: string | null }): Promise<SessionStats> {
  const { data, error } = await supabase.rpc("session_stats", {
    p_session: filter.session ?? null,
    p_user: filter.user ?? null,
  });
  if (error) throw error;
  return data as SessionStats;
}

export async function fetchSpeed(sessionId: string, points = 400): Promise<SpeedPoint[]> {
  const { data, error } = await supabase.rpc("session_speed", { p_session: sessionId, p_points: points });
  if (error) throw error;
  return data as SpeedPoint[];
}

/** Every row of one table for one session, in pages of 1000. */
export async function fetchAllRows(table: ExportTable, sessionId: string, onProgress: (n: number) => void) {
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE) {
    onProgress(rows.length);
    const { data, error } = await supabase.from(table).select("*")
      .eq("session_id", sessionId)
      .order(table === "frames" ? "frame_idx" : "id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}
