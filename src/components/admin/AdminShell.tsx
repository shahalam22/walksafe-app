"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { prefs } from "@/lib/prefs";
import { ROUTES, normalizePath } from "@/lib/routes";
import { supabase } from "@/lib/supabase";
import { useSession } from "../auth/AuthProvider";
import styles from "./admin.module.css";

const TABS = [
  { href: ROUTES.sessions, label: "Sessions", also: [ROUTES.session] },
  { href: ROUTES.users, label: "Users" },
  { href: ROUTES.server, label: "Server" },
  { href: ROUTES.setup, label: "Phone setup" },
];

/** The admin dashboard's header and tabs; each tab is its own page. */
export function AdminShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const path = normalizePath(usePathname());

  function openGuide() {
    prefs.set("admin-screen", "guide");
    router.push(ROUTES.guide);
  }

  return (
    <div className={styles.admin}>
      <header className={styles.header}>
        <span className={styles.brand}>WalkSafe <span className="muted">Admin</span></span>
        <span className={`muted small ${styles.who}`}>{session.user.email}</span>
        <span className="spacer" />
        <button type="button" className="btn" onClick={openGuide}>Guidance screen</button>
        <button type="button" className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </header>
      <nav className={styles.tabs} aria-label="Admin">
        {TABS.map((tab) => {
          const current = path === tab.href || tab.also?.some((p) => path === p);
          return (
            <Link key={tab.href} href={tab.href} className={styles.tab} aria-current={current ? "page" : undefined}>
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <main className={styles.panel}>{children}</main>
    </div>
  );
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className={`card ${styles.chartCard}`}>
      <figcaption>{title}</figcaption>
      {children}
    </figure>
  );
}
