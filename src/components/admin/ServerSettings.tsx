"use client";

import { useState, type FormEvent } from "react";
import { useLoader } from "@/hooks/useLoader";
import { fmtDateTime } from "@/lib/format";
import { cleanUrl, explain, health, loadServerUrl, saveServerUrl, type ServerAddress } from "@/lib/server-api";
import { Message, type Notice } from "../Message";
import styles from "./admin.module.css";

/** The Colab server's address, saved in Supabase for every phone to read. */
export function ServerSettings() {
  const { data } = useLoader(loadServerUrl);
  if (!data) return <p className="empty">Loading…</p>;
  return <ServerForm initial={data} />;
}

function ServerForm({ initial }: { initial: ServerAddress }) {
  const [url, setUrl] = useState(initial.url);
  const [saved, setSaved] = useState(initial);
  const [result, setResult] = useState<Notice | null>(null);

  async function test() {
    setResult({ text: "Testing…", ok: true });
    try {
      const h = await health(cleanUrl(url));
      setResult({ text: h.ready ? "Server is running and ready." : "Server answers but is still loading.", ok: true });
    } catch (err) {
      setResult({ text: explain(err), ok: false });
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    try {
      const value = await saveServerUrl(url);
      setUrl(value);
      setSaved({ url: value, updatedAt: new Date().toISOString(), cached: false });
      setResult({ text: "Saved. Phones use it from their next start.", ok: true });
    } catch (err) {
      setResult({ text: `Could not save: ${explain(err)}`, ok: false });
    }
  }

  return (
    <form className={`card ${styles.stack}`} onSubmit={save}>
      <h2 className="card-title">Server address</h2>
      <p className="muted">
        Each time you start the Colab notebook, it prints a new address
        (<code>https://….trycloudflare.com</code>). Paste it here and save. Every phone reads it when WalkSafe starts.
      </p>
      <label>
        Address
        <input type="url" placeholder="https://example.trycloudflare.com" autoComplete="off"
          value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <div className="form-actions">
        <button type="button" className="btn" onClick={test}>Test</button>
        <button type="submit" className="btn primary">Save</button>
        <Message notice={result} className="small" />
      </div>
      <p className="muted small">
        {saved.url ? `Saved address, updated ${fmtDateTime(saved.updatedAt)}.` : "No address saved yet."}
      </p>
    </form>
  );
}
