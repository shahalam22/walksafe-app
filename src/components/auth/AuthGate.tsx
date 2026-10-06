"use client";

import type { Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { prefs, type AdminScreen } from "@/lib/prefs";
import { ROUTES, normalizePath } from "@/lib/routes";
import { roleOf } from "@/lib/supabase";
import { Splash } from "../Splash";
import { useAuth } from "./AuthProvider";

/** Where a signed-in user starts: the guidance screen, or for admins the dashboard. */
export function homeFor(session: Session) {
  const admin = roleOf(session) === "admin" && prefs.get<AdminScreen>("admin-screen", "admin") === "admin";
  return admin ? ROUTES.sessions : ROUTES.guide;
}

function redirectFor(path: string, session: Session | null, recovering: boolean): string | null {
  if (recovering) return path === ROUTES.resetPassword ? null : ROUTES.resetPassword;
  if (!session) return path === ROUTES.login ? null : ROUTES.login;
  if (path === ROUTES.home || path === ROUTES.login || path === ROUTES.resetPassword) return homeFor(session);
  if (path.startsWith(ROUTES.sessions) && roleOf(session) !== "admin") return ROUTES.guide;
  return null;
}

/** Sends each visitor to a page they may see; shows the splash until then. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, ready, recovering } = useAuth();
  const path = normalizePath(usePathname());
  const router = useRouter();
  const target = ready ? redirectFor(path, session, recovering) : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  if (!ready || target) return <Splash />;
  return children;
}
