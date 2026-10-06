"use client";

import { useEffect, useRef, useState } from "react";
import { GuideController, IDLE_SNAPSHOT } from "@/lib/guide-controller";
import { guidePrefs } from "@/lib/prefs";
import { HelperMenu } from "./HelperMenu";
import styles from "./guide.module.css";

/**
 * The blind user's screen. One full-screen button: tap anywhere to start, tap
 * again (or shake the phone) to stop. Everything is spoken, so nothing here
 * has to be seen.
 */
export function GuideScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const guideRef = useRef<GuideController | null>(null);
  const [snap, setSnap] = useState(IDLE_SNAPSHOT);
  const [showView, setShowView] = useState(guidePrefs.view);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const guide = new GuideController(videoRef.current!);
    const unsubscribe = guide.subscribe(setSnap);
    guideRef.current = guide;
    return () => {
      unsubscribe();
      guide.destroy();
      guideRef.current = null;
    };
  }, []);

  function openMenu() {
    guideRef.current?.stop("user");
    setMenuOpen(true);
  }

  return (
    <main className={styles.guide} data-on={snap.on} data-view={showView}>
      <section className={styles.view} aria-hidden="true">
        <video ref={videoRef} playsInline muted />
        {/* eslint-disable-next-line @next/next/no-img-element -- a live data: URL, nothing to optimize */}
        {snap.panel && <img src={snap.panel} alt="" />}
      </section>

      <button
        type="button"
        className={styles.toggle}
        aria-label={snap.on ? "Stop WalkSafe" : "Start WalkSafe"}
        onClick={() => guideRef.current?.onTap()}
        autoFocus
      >
        <span className={styles.title}>{snap.on ? "Tap anywhere to stop" : "Tap anywhere to start"}</span>
        <span className={styles.command}>{snap.command}</span>
        <span className={styles.status}>{snap.status}</span>
      </button>

      <button type="button" className={styles.menuBtn} onClick={openMenu}>Helper menu</button>

      <HelperMenu open={menuOpen} onClose={() => setMenuOpen(false)} onShowViewChange={setShowView} />
    </main>
  );
}
