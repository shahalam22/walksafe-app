"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useLoader } from "@/hooks/useLoader";
import {
  fetchAllRows, fetchSession, fetchSpeed, fetchStats, fetchUsers, userName, type ExportTable,
} from "@/lib/admin-data";
import { downloadText, toCsv } from "@/lib/csv";
import { fmtDateTime, fmtDuration } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { LineChart } from "../charts/LineChart";
import { StatTiles } from "../charts/StatTiles";
import { ChartCard } from "./AdminShell";
import { StatsCharts } from "./StatsCharts";
import { sessionStats } from "./sessionStats";
import styles from "./admin.module.css";

async function loadSession(id: string) {
  const [row, users, stats, speed] = await Promise.all([
    fetchSession(id), fetchUsers(), fetchStats({ session: id }), fetchSpeed(id),
  ]);
  return { row, user: users.find((u) => u.id === row?.user_id), stats, speed };
}

/** One walk: totals, speed over time, charts and CSV exports. (/admin/session/?id=…) */
export function SessionDetail() {
  const id = useSearchParams().get("id") ?? "";
  const { data, error } = useLoader(useCallback(() => loadSession(id), [id]));
  const row = data?.row;

  return (
    <>
      <div className={styles.toolbar}>
        <Link className="btn" href={ROUTES.sessions}>← All sessions</Link>
        <span className="spacer" />
        {row && (["frames", "agents", "gaps"] as const).map((t) => (
          <ExportButton key={t} table={t} sessionId={row.session_id} />
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {!data && !error && <p className="empty">Loading…</p>}
      {data && !row && <p className="empty">This session does not exist.</p>}
      {data && row && (
        <>
          <h2 className={styles.pageTitle}>{userName(data.user)} · {fmtDateTime(row.started_at)}</h2>
          <p className="muted">
            Session {row.session_id.slice(0, 8)} · {row.ended_at ? fmtDuration(row.started_at, row.ended_at) : "still running"}
          </p>
          <StatTiles stats={sessionStats(data.stats)} />
          <ChartCard title="Walking speed (m/s)">
            <LineChart
              points={data.speed.map((p) => ({ x: p.frame_idx, y: p.ego_speed_ms, label: p.action }))}
              yUnit="m/s"
            />
          </ChartCard>
          <StatsCharts stats={data.stats} />
        </>
      )}
    </>
  );
}

function ExportButton({ table, sessionId }: { table: ExportTable; sessionId: string }) {
  const [progress, setProgress] = useState<number | null>(null);
  const label = `${table[0].toUpperCase()}${table.slice(1)} CSV`;

  async function run() {
    setProgress(0);
    try {
      const rows = await fetchAllRows(table, sessionId, setProgress);
      downloadText(`walksafe-${sessionId.slice(0, 8)}-${table}.csv`, toCsv(rows));
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setProgress(null);
    }
  }

  return (
    <button type="button" className="btn" disabled={progress !== null} onClick={run}>
      {progress === null ? label : `${label} (${progress})…`}
    </button>
  );
}
