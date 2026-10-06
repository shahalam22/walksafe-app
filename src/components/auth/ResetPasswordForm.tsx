"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Message } from "../Message";
import { AuthCard } from "./AuthCard";
import { LINK_EXPIRED, useAuth } from "./AuthProvider";

const MIN_LENGTH = 6;

/** Opened from the reset link: the link has signed in as that account for this. */
export function ResetPasswordForm() {
  const { session, endRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password.length < MIN_LENGTH) return setError(`The password needs at least ${MIN_LENGTH} characters.`);
    if (password !== confirm) return setError("The two passwords do not match.");
    setError(null);
    setBusy(true);
    const { error: failed } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (!failed) await endRecovery({ text: "Password changed. Sign in with your new password.", ok: true });
    else if (/session/i.test(failed.message)) await endRecovery({ text: LINK_EXPIRED, ok: false });
    else setError(failed.message);
  }

  return (
    <AuthCard
      title="New password"
      subtitle={session?.user.email ? `Choose a new password for ${session.user.email}.` : "Choose a new password for your account."}
      onSubmit={submit}
    >
      <label>
        New Password
        <input type="password" autoComplete="new-password" minLength={MIN_LENGTH} maxLength={72} required autoFocus
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label>
        Confirm New Password
        <input type="password" autoComplete="new-password" minLength={MIN_LENGTH} maxLength={72} required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <Message notice={error ? { text: error, ok: false } : null} />
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? "Saving…" : "Reset password"}
      </button>
      <button type="button" className="link-btn" onClick={() => endRecovery(null)}>Cancel</button>
    </AuthCard>
  );
}
