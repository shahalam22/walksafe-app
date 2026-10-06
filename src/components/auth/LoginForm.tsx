"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { Message } from "../Message";
import { AuthCard } from "./AuthCard";
import { useAuth } from "./AuthProvider";

interface Props {
  email: string;
  onEmailChange: (email: string) => void;
  onForgot: () => void;
}

export function LoginForm({ email, onEmailChange, onForgot }: Props) {
  const { notice, setNotice } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);       // a wrong email or password: offer a reset

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const { error: failed } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (!failed) return;                             // <AuthGate> opens the right screen
    if (/invalid/i.test(failed.message)) {
      setError("Wrong credentials.");
      setWrong(true);
    } else {
      setError(failed.message);
    }
  }

  return (
    <AuthCard title="WalkSafe" subtitle="Sign in. A helper does this once on each phone." onSubmit={submit}>
      <label>
        Email
        <input type="email" autoComplete="username" required autoFocus
          value={email} onChange={(e) => onEmailChange(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <Message notice={notice} />
      <Message notice={error ? { text: error, ok: false } : null} />
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {(wrong || notice?.ok === false) && (
        <button type="button" className="link-btn" onClick={onForgot}>Forgot password?</button>
      )}
    </AuthCard>
  );
}
