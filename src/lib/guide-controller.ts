// The guidance loop: camera → server → spoken command. Kept outside React so
// the screen only shows its state.
//
// While guiding, the screen is kept awake (it shows black) because a browser
// cannot use the camera with the screen off. If the screen does go off, the
// session ends, and it starts again by itself when the screen comes back.
import { announce } from "./announce";
import { guidePrefs } from "./prefs";
import { ApiError, api, explain, health, loadServerUrl } from "./server-api";
import { speaker } from "./speaker";
import { supabase } from "./supabase";

const UPLOAD_WIDTH = 518;           // the server works at this width
const JPEG_QUALITY = 0.7;
const FIRST_FRAME_TIMEOUT = 120000; // the first frame waits for a depth map
const FRAME_TIMEOUT = 20000;
const MIN_FRAME_MS = 150;           // at most ~7 frames a second, so the page stays responsive
const MAX_FAILURES = 4;             // in a row, before giving up
const TAP_GUARD_MS = 1500;          // ignore a second tap this soon (double taps)
const SHAKE_MS2 = 25;               // acceleration that counts as a shake
const SHAKE_PEAKS = 3;              // ...this many times within SHAKE_WINDOW_MS
const SHAKE_WINDOW_MS = 1200;

export type GuideState = "idle" | "starting" | "running" | "stopping";

export interface GuideSnapshot {
  on: boolean;                // starting or running
  command: string;            // the phrase being said, e.g. "Step left"
  status: string;
  panel: string | null;       // the server's analysis image (demo view), as a data URL
}

interface FrameResult {
  command: string;
  phrase: string;
  detail: string;
  view: string | null;
}

export const IDLE_SNAPSHOT: GuideSnapshot = { on: false, command: "", status: "", panel: null };

type StopReason = "user" | "hidden" | "shake" | "ended" | "auth" | "offline";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

export class GuideController {
  private state: GuideState = "idle";
  private gen = 0;                  // which start() is current
  private base = "";
  private sessionId: string | null = null;
  private stream: MediaStream | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private abort: AbortController | null = null;
  private lastToggle = 0;
  private lastPhrase = "";
  private lastSpokenAt = 0;
  private resumeOnShow = false;
  private shakes: number[] = [];
  private readonly canvas = document.createElement("canvas");
  private snapshot = IDLE_SNAPSHOT;
  private readonly listeners = new Set<(s: GuideSnapshot) => void>();

  constructor(private readonly video: HTMLVideoElement) {
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("devicemotion", this.onMotion);
  }

  /** Leaving the screen: stop guiding and let go of the camera. */
  destroy() {
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("devicemotion", this.onMotion);
    this.resumeOnShow = false;
    this.stop("user");
    this.listeners.clear();
  }

  /** Calls fn on every change (starting from IDLE_SNAPSHOT). */
  subscribe(fn: (s: GuideSnapshot) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  get running() {
    return this.state !== "idle";
  }

  // ── Start / stop ───────────────────────────────────────────────────────────

  onTap() {
    const now = Date.now();
    if (now - this.lastToggle < TAP_GUARD_MS) return;
    this.lastToggle = now;
    speaker.unlock();
    if (this.state === "idle") void this.start();
    else if (this.state === "running" || this.state === "starting") this.stop("user");
  }

  private async start({ resumed = false } = {}) {
    if (this.state !== "idle") return;
    this.state = "starting";
    const gen = ++this.gen;
    const alive = () => this.state === "starting" && this.gen === gen;
    this.lastPhrase = "";
    this.abort = new AbortController();
    speaker.rate = guidePrefs.rate();
    this.render("Starting…");
    speaker.say(resumed ? "Starting WalkSafe again." : "Starting WalkSafe.", { interrupt: true });
    navigator.vibrate?.(80);

    try {
      const { url } = await loadServerUrl();
      this.base = url;
      const h = await health(url);
      if (!h.ready) throw new ApiError(503, "models_loading");
      if (!alive()) return;

      const stream = await this.openCamera();
      if (!alive()) return stream.getTracks().forEach((t) => t.stop());
      this.stream = stream;

      const { session_id } = await api<{ session_id: string }>(this.base, "/api/session/start", {
        json: {}, signal: this.abort.signal,
      });
      if (!alive()) return;
      this.sessionId = session_id;
      await this.keepAwake();
      if (!alive()) return;

      this.state = "running";
      this.render("Guiding");
      speaker.say("WalkSafe is on. Tap anywhere to stop.");
      void this.loop();
    } catch (err) {
      if (!alive()) return;
      const name = err instanceof DOMException ? err.name : "";
      const why = name === "NotAllowedError" || name === "NotFoundError"
        ? "The camera is not available. Ask your helper to allow the camera."
        : explain(err);
      this.finish(`${why} WalkSafe is off.`);
    }
  }

  stop(reason: StopReason, message?: string) {
    if (this.state === "idle" || this.state === "stopping") return;
    this.state = "stopping";
    this.abort?.abort();
    if (this.sessionId) {
      api(this.base, "/api/session/stop", { json: { session_id: this.sessionId }, timeout: 5000 }).catch(() => {});
    }
    this.finish(message ?? (reason === "hidden" ? null : "WalkSafe stopped."));
  }

  private finish(message: string | null) {
    this.sessionId = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
    this.wakeLock?.release().catch(() => {});
    this.wakeLock = null;
    this.state = "idle";
    this.render(message ? message.replace(" WalkSafe is off.", "") : "Stopped");
    if (message) {
      speaker.say(message, { interrupt: true });
      announce(message);
      navigator.vibrate?.([60, 60, 60]);
    }
  }

  private async openCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    this.video.srcObject = stream;
    await this.video.play();
    return stream;
  }

  // ── The frame loop: one frame in flight at a time ─────────────────────────

  private async loop() {
    let failures = 0;
    let first = true;
    const sid = this.sessionId;
    while (this.state === "running" && this.sessionId === sid) {
      const began = Date.now();
      const jpeg = await this.grab();
      if (!jpeg) {
        await sleep(100);
        continue;
      }
      try {
        const res = await api<FrameResult>(this.base, `/api/frame?session_id=${sid}&view=${guidePrefs.view() ? 1 : 0}`, {
          body: jpeg,
          type: "image/jpeg",
          timeout: first ? FIRST_FRAME_TIMEOUT : FRAME_TIMEOUT,
          signal: this.abort?.signal,
        });
        if (this.state !== "running") return;
        if (failures > 0) speaker.say("Connected again.");
        failures = 0;
        first = false;
        this.onResult(res);
        await sleep(MIN_FRAME_MS - (Date.now() - began));
      } catch (err) {
        if (this.state !== "running") return;
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 409) return this.stop("ended", "The session ended on the server. WalkSafe stopped.");
        if (status === 401) {
          await supabase.auth.refreshSession().catch(() => {});
          if (++failures < 2) continue;
          return this.stop("auth", "The sign-in has expired. Ask your helper. WalkSafe stopped.");
        }
        failures++;
        if (failures === 1) speaker.say("Connection lost. Trying again.", { interrupt: true });
        if (failures >= MAX_FAILURES) {
          return this.stop("offline", "Cannot reach the WalkSafe server. WalkSafe stopped.");
        }
        await sleep(1000 * failures);
      }
    }
  }

  private onResult(res: FrameResult) {
    const phrase = res.phrase || "";
    const repeat = guidePrefs.repeatSeconds() * 1000;
    const now = Date.now();
    if (phrase !== this.lastPhrase || (repeat && now - this.lastSpokenAt >= repeat)) {
      const urgent = res.command === "stop";
      if (urgent && phrase !== this.lastPhrase) speaker.alarm();
      speaker.say(phrase, { interrupt: urgent });
      this.lastPhrase = phrase;
      this.lastSpokenAt = now;
    }
    this.emit({
      command: phrase,
      status: res.detail || "",
      panel: guidePrefs.view() && res.view ? `data:image/jpeg;base64,${res.view}` : this.snapshot.panel,
    });
  }

  private grab(): Promise<Blob | null> {
    const v = this.video;
    if (v.readyState < 2 || !v.videoWidth) return Promise.resolve(null);
    const w = UPLOAD_WIDTH;
    const h = Math.round((v.videoHeight * w) / v.videoWidth);
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.getContext("2d")?.drawImage(v, 0, 0, w, h);      // never mirrored
    return new Promise((resolve) => this.canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  }

  // ── Screen, motion ─────────────────────────────────────────────────────────

  private async keepAwake() {
    try {
      this.wakeLock = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      /* not allowed now */
    }
  }

  private onVisibility = () => {
    if (document.hidden) {
      if (this.state === "running" || this.state === "starting") {
        this.resumeOnShow = true;
        this.stop("hidden");
      }
    } else if (this.resumeOnShow) {
      this.resumeOnShow = false;
      void this.start({ resumed: true });
    }
  };

  private onMotion = (e: DeviceMotionEvent) => {
    if (this.state !== "running") return;
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const g = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    if (g < SHAKE_MS2) return;
    const now = Date.now();
    if (this.shakes.length && now - this.shakes[this.shakes.length - 1] < 150) return;     // same peak
    this.shakes = [...this.shakes.filter((t) => now - t < SHAKE_WINDOW_MS), now];
    if (this.shakes.length >= SHAKE_PEAKS) {
      this.shakes = [];
      this.lastToggle = now;
      this.stop("shake");
    }
  };

  // ── State for the screen ───────────────────────────────────────────────────

  private render(status: string) {
    const on = this.state === "running" || this.state === "starting";
    this.emit(on ? { on, status } : { on, status, command: "", panel: null });
  }

  private emit(patch: Partial<GuideSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((fn) => fn(this.snapshot));
  }
}
