import { BASE_PATH } from "./config";

export const ROUTES = {
  home: "/",
  login: "/login",
  resetPassword: "/reset-password",
  guide: "/guide",
  sessions: "/admin",
  session: "/admin/session",
  users: "/admin/users",
  server: "/admin/server",
  setup: "/admin/setup",
} as const;

/** "/admin/users/" → "/admin/users" (the site uses trailing slashes). */
export const normalizePath = (path: string | null) => (path ?? "/").replace(/\/+$/, "") || "/";

/** The app's own address, e.g. https://shahalam22.github.io/walksafe-app/ (browser only). */
export const appUrl = (path = "/") => `${window.location.origin}${BASE_PATH}${path}`;
