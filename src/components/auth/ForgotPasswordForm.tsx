"use client";

import { useState, type FormEvent } from "react";
import { ROUTES, appUrl } from "@/lib/routes";
import { supabase } from "@/lib/supabase";
import { Message, type Notice } from "../Message";
import { AuthCard } from "./AuthCard";

export function ForgotPasswordForm({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail.trim());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Notice | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    // The link comes back to the new-password page.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: appUrl(`${ROUTES.resetPassword}/`),
    });
    setSending(false);
    if (!error) setResult({ text: "Link has been sent.", ok: true });
    else if (error.status === 429) setResult({ text: "Too many reset emails. Wait a few minutes and try again.", ok: false });
    else setResult({ text: error.message, ok: false });
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter the account's email. We will send a link to choose a new password."
      onSubmit={submit}
    >
      <label>
        Email
        <input type="email" autoComplete="username" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <Message notice={result} />
      <button type="submit" className="btn primary" disabled={sending}>
        {sending ? "Sending…" : "Send Reset Link"}
      </button>
      <button type="button" className="link-btn" onClick={onBack}>Back to sign in</button>
    </AuthCard>
  );
}
