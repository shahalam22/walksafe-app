import type { SessionStats } from "@/lib/admin-data";
import { BarChart } from "../charts/BarChart";
import { ChartCard } from "./AdminShell";
import styles from "./admin.module.css";

/** Commands, risk levels and actions: the same three charts for all sessions or one. */
export function StatsCharts({ stats }: { stats: SessionStats | undefined }) {
  return (
    <div className={styles.chartGrid}>
      <ChartCard title="Navigation commands"><BarChart items={stats?.commands} /></ChartCard>
      <ChartCard title="Agent risk levels"><BarChart items={stats?.risks} status /></ChartCard>
      <ChartCard title="Walking actions"><BarChart items={stats?.actions} /></ChartCard>
    </div>
  );
}
