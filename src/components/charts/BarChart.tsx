"use client";

import type { LabelCount } from "@/lib/admin-data";
import { pretty } from "@/lib/format";
import { useTooltip } from "./Tooltip";
import styles from "./charts.module.css";

// Risk levels get their status colour and an icon, so colour is not the only cue.
const RISK: Record<string, { color: string; icon: string }> = {
  critical: { color: "var(--status-critical)", icon: "‼" },
  high: { color: "var(--status-serious)", icon: "!" },
  moderate: { color: "var(--status-warning)", icon: "•" },
  low: { color: "var(--status-good)", icon: "✓" },
};

/** Horizontal bars, largest first. `status`: colour the bars as risk levels. */
export function BarChart({ items, status = false }: { items: LabelCount[] | undefined; status?: boolean }) {
  const { tooltip, show, hide } = useTooltip();
  const rows = (items ?? []).filter((i) => i.count > 0);
  if (!rows.length) return <p className="empty">No data yet</p>;

  const total = rows.reduce((s, i) => s + i.count, 0);
  const max = Math.max(...rows.map((i) => i.count));

  return (
    <div className={styles.bars} role="list">
      {rows.map((item) => {
        const risk = status ? RISK[item.label ?? ""] : undefined;
        const label = pretty(item.label);
        const pct = ((item.count / total) * 100).toFixed(1);
        return (
          <div
            key={label}
            className={styles.barRow}
            role="listitem"
            aria-label={`${label}: ${item.count}`}
            onPointerMove={(e) => show(e, <><b>{label}</b><br />{item.count.toLocaleString()} ({pct}%)</>)}
            onPointerLeave={hide}
          >
            <span className={styles.barLabel}>
              {risk && <span className={styles.barIcon} aria-hidden="true">{risk.icon}</span>}
              {label}
            </span>
            <span className={styles.barTrack}>
              <span
                className={styles.bar}
                style={{
                  width: `${Math.max(1, (item.count / max) * 100)}%`,
                  background: risk?.color ?? "var(--series-1)",
                }}
              />
              <span className={styles.barValue}>{item.count.toLocaleString()}</span>
            </span>
          </div>
        );
      })}
      {tooltip}
    </div>
  );
}
