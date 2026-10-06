"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { canInstall, install, subscribeInstall } from "@/lib/install";
import { guidePrefs, prefs } from "@/lib/prefs";
import { ROUTES } from "@/lib/routes";
import { explain, health, loadServerUrl } from "@/lib/server-api";
import { speaker } from "@/lib/speaker";
import { roleOf, supabase } from "@/lib/supabase";
import { useSession } from "../auth/AuthProvider";
import styles from "./guide.module.css";

const REPEAT_OPTIONS = [
  { value: 0, label: "Only when it changes" },
  { value: 5, label: "Every 5 seconds" },
  { value: 10, label: "Every 10 seconds" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onShowViewChange: (show: boolean) => void;
}

/** For the sighted helper: set up the phone and change settings. */
export function HelperMenu({ open, onClose, onShowViewChange }: Props) {
  const session = useSession();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const installable = useSyncExternalStore(subscribeInstall, canInstall, () => false);

  const [server, setServer] = useState("Not checked yet.");
  const [camera, setCamera] = useState("Allow camera");
  const [view, setView] = useState(guidePrefs.view);
  const [repeat, setRepeat] = useState(guidePrefs.repeatSeconds);
  const [rate, setRate] = useState(guidePrefs.rate);

  useEffect(() => {
    const dialog = dialogRef.current!;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  async function checkServer() {
    setServer("Checking…");
    const { url, cached } = await loadServerUrl();
    try {
      const h = await health(url);
      setServer(`${h.ready ? "Server is running." : "Server is still loading."} ${url}`
        + (cached ? " (saved address; Supabase not reachable)" : ""));
    } catch (err) {
      setServer(`${explain(err)} ${url}`);
    }
  }

  async function allowCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      s.getTracks().forEach((t) => t.stop());
      speaker.unlock();
      speaker.say("Camera allowed.");
      setCamera("Camera allowed ✓");
    } catch {
      setCamera("Camera blocked: allow it in Chrome's site settings");
    }
  }

  function testVoice() {
    speaker.unlock();
    speaker.rate = rate;
    speaker.alarm();
    speaker.say("This is how WalkSafe sounds. Walk forward. Step left. Stop.", { interrupt: true });
  }

  function changeView(show: boolean) {
    setView(show);
    prefs.set("view", show);
    onShowViewChange(show);
  }

  function changeRepeat(seconds: number) {
    setRepeat(seconds);
    prefs.set("repeat", seconds);
  }

  function changeRate(value: number) {
    setRate(value);
    prefs.set("rate", value);
    speaker.rate = value;
  }

  function openAdmin() {
    prefs.set("admin-screen", "admin");
    router.push(ROUTES.sessions);
  }

  return (
    <dialog ref={dialogRef} className={styles.sheet} aria-labelledby="helper-title" onClose={onClose}>
      <form method="dialog" className={styles.sheetBody}>
        <h2 id="helper-title">Helper menu</h2>
        <p className="muted">Signed in as {session.user.email}</p>

        <h3>Server</h3>
        <p className="muted">{server}</p>
        <button type="button" className="btn" onClick={checkServer}>Check server</button>

        <h3>This phone</h3>
        <div className="row-wrap">
          <button type="button" className="btn" onClick={allowCamera}>{camera}</button>
          <button type="button" className="btn" onClick={testVoice}>Test voice</button>
          {installable && <button type="button" className="btn" onClick={() => install()}>Install app</button>}
        </div>
        {!installable && (
          <p className="muted small">
            To add WalkSafe to the home screen: Chrome menu (⋮) → <b>Add to Home screen</b> → <b>Install</b>.
          </p>
        )}

        <h3>Settings</h3>
        <label className="check">
          <input type="checkbox" checked={view} onChange={(e) => changeView(e.target.checked)} />
          Show camera and analysis on screen (for demos)
        </label>
        <label>
          Repeat the current instruction
          <select value={repeat} onChange={(e) => changeRepeat(Number(e.target.value))}>
            {REPEAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label>
          Speech speed {rate}×
          <input type="range" min={0.6} max={1.6} step={0.1} value={rate}
            onChange={(e) => changeRate(Number(e.target.value))} />
        </label>

        <div className={`row-wrap ${styles.sheetActions}`}>
          {roleOf(session) === "admin" && (
            <button type="button" className="btn" onClick={openAdmin}>Admin dashboard</button>
          )}
          <button type="button" className="btn danger" onClick={() => supabase.auth.signOut()}>Sign out</button>
          <button className="btn primary" value="close">Close</button>
        </div>
      </form>
    </dialog>
  );
}
