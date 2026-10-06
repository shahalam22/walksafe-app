"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { resetLink, supabase } from "@/lib/supabase";
import type { Notice } from "../Message";

export const LINK_EXPIRED = "This reset link has expired or was already used. Ask for a new one.";

interface AuthValue {
  session: Session | null;
  ready: boolean;             // the saved login has been read
  recovering: boolean;        // opened from a password-reset link
  notice: Notice | null;      // a line for the sign-in page, e.g. "Password changed"
  setNotice: (notice: Notice | null) => void;
  /** Leave the reset: sign out (so the reset login opens nothing else) and show `notice` on sign-in. */
  endRecovery: (notice: Notice | null) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [recovering, setRecovering] = useState(resetLink.recovery);
  const [notice, setNotice] = useState<Notice | null>(
    resetLink.failed ? { text: LINK_EXPIRED, ok: false } : null,
  );

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      // Run outside the callback: Supabase holds a lock while it runs.
      setTimeout(() => {
        // Supabase has read the reset link by now: keep its login out of the address bar.
        if (window.location.href.includes("#")) {
          history.replaceState(history.state, "", window.location.pathname + window.location.search);
        }
        if (event === "PASSWORD_RECOVERY") setRecovering(true);
        setSession(next);
        setReady(true);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const endRecovery = useCallback(async (next: Notice | null) => {
    await supabase.auth.signOut();
    setSession(null);         // now, not on the sign-out event: the gate must not open a screen first
    setNotice(next);
    setRecovering(false);
  }, []);

  const value = useMemo(
    () => ({ session, ready, recovering, notice, setNotice, endRecovery }),
    [session, ready, recovering, notice, endRecovery],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** For pages behind the gate, which only render with a login. */
export function useSession() {
  const { session } = useAuth();
  if (!session) throw new Error("useSession needs a signed-in user");
  return session;
}
