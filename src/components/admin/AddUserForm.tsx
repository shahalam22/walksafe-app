"use client";

import { useState, type FormEvent } from "react";
import { createAccount } from "@/lib/accounts";
import { explain } from "@/lib/server-api";
import type { Role } from "@/lib/supabase";
import { Message, type Notice } from "../Message";
import styles from "./admin.module.css";

const EMPTY = { role: "blind" as Role, display_name: "", email: "", password: "" };

export function AddUserForm({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Notice | null>(null);
  const set = (field: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setResult({ text: "Adding…", ok: true });
    try {
      await createAccount(form);
      setResult({
        ok: true,
        text: form.role === "admin"
          ? `Added ${form.email} as an admin. They can sign in to this dashboard.`
          : `Added ${form.email}. Sign in with it on their phone.`,
      });
      setForm(EMPTY);
      onAdded();
    } catch (err) {
      setResult({ text: explain(err), ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={`card ${styles.formGrid}`} onSubmit={submit}>
      <h2 className="card-title">Add a user</h2>
      <label>
        User type
        <select value={form.role} onChange={set("role")}>
          <option value="blind">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label>
        Name
        <input maxLength={80} placeholder="e.g. Rahim" value={form.display_name} onChange={set("display_name")} />
      </label>
      <label>
        Email
        <input type="email" required placeholder="used to sign in" value={form.email} onChange={set("email")} />
      </label>
      <label>
        Password
        <input type="text" minLength={6} required placeholder="at least 6 characters"
          value={form.password} onChange={set("password")} />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={busy}>Add user</button>
        <Message notice={result} className="small" />
      </div>
    </form>
  );
}
