import styles from "./charts.module.css";

export type Stat = [label: string, value: string];

export function StatTiles({ stats }: { stats: Stat[] }) {
  return (
    <div className={styles.tiles}>
      {stats.map(([label, value]) => (
        <div key={label} className={styles.tile}>
          <div className={styles.tileLabel}>{label}</div>
          <div className={styles.tileValue}>{value}</div>
        </div>
      ))}
    </div>
  );
}
