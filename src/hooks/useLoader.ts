"use client";

import { useCallback, useEffect, useState } from "react";

interface Loaded<T> {
  data: T | undefined;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs `load` (keep it stable with useCallback) and again whenever it changes
 * or reload() is called. While reloading, the previous data stays shown.
 */
export function useLoader<T>(load: () => Promise<T>): Loaded<T> {
  const [state, setState] = useState<{ data?: T; error: string | null; loading: boolean }>({
    error: null,
    loading: true,
  });
  const [run, setRun] = useState(0);

  useEffect(() => {
    let current = true;
    load().then(
      (data) => current && setState({ data, error: null, loading: false }),
      (e: unknown) => current && setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e), loading: false })),
    );
    return () => {
      current = false;
    };
  }, [load, run]);

  const reload = useCallback(() => setRun((n) => n + 1), []);
  return { data: state.data, error: state.error, loading: state.loading, reload };
}
