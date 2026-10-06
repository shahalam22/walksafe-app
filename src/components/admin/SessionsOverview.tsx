"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useLoader } from "@/hooks/useLoader";
import { fetchSessions, fetchStats, fetchUsers, userName, type SessionRow, type UserRow } from "@/lib/admin-data";
import { fmtDateTime, fmtDuration, fmtNum, pretty } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { StatTiles } from "../charts/StatTiles";
import { StatsCharts } from "./StatsCharts";
import { overviewStats } from "./sessionStats";
import styles from "./admin.module.css";

/** Totals and charts for all walks (or one user's), and the list of sessions. */
export function SessionsOverview() {
  const [userId, setUserId] = useState("");
  const users = useLoader(fetchUsers);
  const stats = useLoader(useCallback(() => fetchStats({ user: userId || null }), [userId]));
  const sessions = useLoader(useCallback(() => fetchSessions(userId || null), [userId]));

  function refresh() {
    users.reload();
    stats.reload();
    sessions.reload();
  }

  return (
    <>
      <div className={styles.toolbar}>
        <label className="inline">
          User
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">All users</option>
            {users.data?.map((u) => (
              <option key={u.id} value={u.id}>{userName(u)} ({u.role})</option>
            ))}
          </select>
        </label>
        <button type="button" className="btn" onClick={refresh}>Refresh</button>
      </div>

      {stats.error && <p className="error">{stats.error}</p>}
      {stats.data && <StatTiles stats={overviewStats(stats.data)} />}
      <StatsCharts stats={stats.data} />

      <div className="card">
        <h2 className="card-title">Sessions</h2>
        {sessions.error
          ? <p className="error">{sessions.error}</p>
          : <SessionsTable rows={sessions.data} users={users.data ?? []} />}
      </div>
    </>
  );
}

function SessionsTable({ rows, users }: { rows: SessionRow[] | undefined; users: UserRow[] }) {
  const byId = new Map(users.map((u) => [u.id, u]));
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Started</th><th>User</th><th>Length</th><th>Frames</th><th>Ended by</th><th />
          </tr>
        </thead>
        <tbody>
          {!rows && <tr><td colSpan={6} className="empty">Loading…</td></tr>}
          {rows?.length === 0 && <tr><td colSpan={6} className="empty">No sessions yet</td></tr>}
          {rows?.map((r) => (
            <tr key={r.session_id}>
              <td>{fmtDateTime(r.started_at)}</td>
              <td>{userName(r.user_id ? byId.get(r.user_id) : undefined)}</td>
              <td>{r.ended_at ? fmtDuration(r.started_at, r.ended_at) : "running"}</td>
              <td className="num">{fmtNum(r.total_frames)}</td>
              <td>{pretty(r.end_reason)}</td>
              <td>
                <Link className="btn small" href={{ pathname: ROUTES.session, query: { id: r.session_id } }}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
