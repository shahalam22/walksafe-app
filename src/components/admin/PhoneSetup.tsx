"use client";

import { appUrl } from "@/lib/routes";
import styles from "./admin.module.css";

/** Steps for setting up a blind person's phone, and what to teach them. */
export function PhoneSetup() {
  return (
    <div className={`card ${styles.prose}`}>
      <h2 className="card-title">Setting up a blind person&apos;s phone</h2>
      <ol>
        <li>Start the server on Colab and save its address in <b>Server</b>.</li>
        <li>Add the person in <b>Users</b> with an email and password.</li>
        <li>On their Android phone, open Chrome at <code>{appUrl()}</code> and sign in with that email and password.</li>
        <li>Open <b>Helper menu</b> (top of the screen): tap <b>Allow camera</b> and allow it, then <b>Test voice</b>.</li>
        <li>
          Install the app: <b>Install app</b> in the helper menu, or Chrome menu (⋮) → <b>Add to Home screen</b>.
          Then open WalkSafe from the new home-screen icon.
        </li>
        <li>Tap <b>Check server</b>, then close the menu and tap the screen once to try a walk.</li>
      </ol>
      <h3>Teach the user</h3>
      <ul>
        <li><b>Open:</b> tap the WalkSafe icon, or say “Hey Google, open WalkSafe”.</li>
        <li><b>Start:</b> tap anywhere on the screen (with TalkBack: double-tap anywhere).</li>
        <li><b>Stop:</b> tap anywhere again, or shake the phone firmly.</li>
        <li>Hold the phone upright at chest height with the back camera facing forward.</li>
        <li>
          The screen stays on but black while guiding. Pressing the power button stops guidance;
          when the screen comes back, WalkSafe starts again by itself.
        </li>
      </ul>
    </div>
  );
}
