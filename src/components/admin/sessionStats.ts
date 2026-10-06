import type { Stat } from "../charts/StatTiles";
import type { SessionStats } from "@/lib/admin-data";
import { fmtNum, fmtSpeed } from "@/lib/format";

export const overviewStats = (s: SessionStats): Stat[] => [
  ["Sessions", fmtNum(s.sessions)],
  ...sessionStats(s),
];

export const sessionStats = (s: SessionStats): Stat[] => [
  ["Frames", fmtNum(s.total_frames)],
  ["Average speed", fmtSpeed(s.avg_speed_ms)],
  ["Agent encounters", fmtNum(s.total_agents)],
  ["Critical events", fmtNum(s.critical_count)],
];
