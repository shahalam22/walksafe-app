import styles from "./auth/auth.module.css";

export function Splash() {
  return (
    <main className={styles.screen}>
      <p className={styles.brand}>WalkSafe</p>
      <p className="muted">Loading…</p>
    </main>
  );
}
