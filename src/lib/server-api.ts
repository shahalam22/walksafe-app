// The WalkSafe server's address (saved by the admin in Supabase) and calls to it.
import { prefs } from "./prefs";
import { supabase } from "./supabase";

export class ApiError extends Error {
  constructor(
    readonly status: number,   // 0 when the server could not be reached
    readonly detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export function cleanUrl(url: string | null | undefined) {
  let u = (url ?? "").trim().replace(/\/+$/, "");
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

export interface ServerAddress {
  url: string;
  updatedAt: string | null;
  cached: boolean;            // Supabase was unreachable: the last address seen on this phone
}

// Read fresh from Supabase each time; fall back to the last one seen on this phone.
export async function loadServerUrl(): Promise<ServerAddress> {
  try {
    const { data, error } = await supabase
      .from("app_config").select("value, updated_at").eq("key", "server_url").maybeSingle();
    if (error) throw error;
    const url = cleanUrl(data?.value);
    prefs.set("server-url", url);
    return { url, updatedAt: data?.updated_at ?? null, cached: false };
  } catch {
    return { url: prefs.get("server-url", ""), updatedAt: null, cached: true };
  }
}

/** The saved address, or an ApiError("no_address"). */
export async function serverBase() {
  const { url } = await loadServerUrl();
  if (!url) throw new ApiError(0, "no_address");
  return url;
}

export async function saveServerUrl(url: string) {
  const value = cleanUrl(url);
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.from("app_config").upsert({
    key: "server_url", value, updated_at: new Date().toISOString(), updated_by: session?.user?.id ?? null,
  });
  if (error) throw error;
  prefs.set("server-url", value);
  return value;
}

async function timedFetch(url: string, options: RequestInit = {}, timeout = 10000, outer?: AbortSignal) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  const onAbort = () => ctl.abort();
  outer?.addEventListener("abort", onAbort);
  try {
    return await fetch(url, { ...options, signal: ctl.signal });
  } catch {
    throw new ApiError(0, outer?.aborted ? "cancelled" : ctl.signal.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener("abort", onAbort);
  }
}

export interface Health {
  ok: boolean;
  app: string;
  ready: boolean;
  busy: boolean;
}

export async function health(base: string, timeout = 8000): Promise<Health> {
  if (!base) throw new ApiError(0, "no_address");
  const r = await timedFetch(`${base}/api/health`, {}, timeout);
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.app !== "walksafe") throw new ApiError(r.status || 0, "not_walksafe");
  return data as Health;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  json?: unknown;             // a JSON body…
  body?: BodyInit;            // …or raw bytes with their content type
  type?: string;
  timeout?: number;
  signal?: AbortSignal;
}

/** A call that sends the login token. */
export async function api<T = unknown>(
  base: string,
  path: string,
  { method = "POST", json, body, type, timeout = 20000, signal }: ApiOptions = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new ApiError(401, "login_required");
  const headers: Record<string, string> = { Authorization: `Bearer ${session.access_token}` };
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (type) {
    headers["Content-Type"] = type;
  }
  const r = await timedFetch(`${base}${path}`, { method, headers, body }, timeout, signal);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, data.detail || r.statusText);
  return data as T;
}

// Plain-language reasons, spoken to the user or shown to the admin.
export function explain(err: unknown): string {
  if (!(err instanceof ApiError)) return err instanceof Error && err.message ? err.message : "Something went wrong.";
  const d = err.detail;
  if (d === "no_address") return "No server address is saved. The admin sets it under Server.";
  if (err.status === 0) return d === "timeout" ? "The server took too long to answer." : "The server could not be reached.";
  if (d === "not_walksafe") return "That address is not a WalkSafe server.";
  if (d === "models_loading") return "The server is still loading. Try again in a minute.";
  if (d === "account_disabled") return "This account has been turned off by the admin.";
  if (err.status === 401) return "The sign-in has expired. Sign in again.";
  if (err.status === 403) return "This account is not allowed to do that.";
  return d || "Something went wrong.";
}
