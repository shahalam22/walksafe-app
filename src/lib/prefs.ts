// Per-phone settings, kept in this browser only.
export const prefs = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(`walksafe-${key}`);
      return v === null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`walksafe-${key}`, JSON.stringify(value));
    } catch {
      /* private mode */
    }
  },
};

export type AdminScreen = "admin" | "guide";

export const guidePrefs = {
  view: () => prefs.get("view", false),
  repeatSeconds: () => Number(prefs.get("repeat", 0)),
  rate: () => Number(prefs.get("rate", 1)),
};
