import { createClient, type Session } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

// The password-reset link in the email opens the app with a login for that
// account in the address (#access_token=…&type=recovery), or an error when the
// link has expired. Read it before the client below takes it out of the address.
function readResetLink() {
  if (typeof window === "undefined") return { recovery: false, failed: false };
  const hash = new URLSearchParams(window.location.hash.slice(1));
  return {
    recovery: hash.get("type") === "recovery" && hash.has("access_token"),
    failed: hash.has("error_code") || hash.has("error_description"),
  };
}

export const resetLink = readResetLink();

// The login is kept on the phone and refreshed automatically, so a phone set
// up once stays signed in.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "walksafe-auth" },
});

export type Role = "admin" | "blind";

export const roleOf = (session: Session | null): Role =>
  session?.user?.app_metadata?.role === "admin" ? "admin" : "blind";
