"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/config";

// Registers the service worker (public/sw.js) so the app opens without a
// network. Not in development, where it would serve stale pages.
export function PwaSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => {});
  }, []);
  return null;
}
