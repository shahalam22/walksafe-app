import type { FormEventHandler, ReactNode } from "react";
import { Logo } from "../Logo";
import styles from "./auth.module.css";

interface Props {
  title: string;
  subtitle: ReactNode;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
}

/** The logo, a title and a short line above a narrow form: sign-in and password screens. */
export function AuthCard({ title, subtitle, onSubmit, children }: Props) {
  return (
    <main className={styles.screen}>
      <form className={`card ${styles.card}`} onSubmit={onSubmit}>
        <Logo className={styles.logo} />
        <h1 className={styles.brand}>{title}</h1>
        <p className={`muted ${styles.subtitle}`}>{subtitle}</p>
        {children}
      </form>
    </main>
  );
}
