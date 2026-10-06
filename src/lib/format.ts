export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export function fmtDuration(startIso: string | null, endIso: string | null) {
  if (!startIso || !endIso) return "—";
  const s = Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
  if (s < 60) return `${Math.round(s)} s`;
  if (s < 3600) return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
  return `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`;
}

export const fmtNum = (n: number | null | undefined) => (n == null ? "—" : Number(n).toLocaleString());

export const fmtSpeed = (ms: number | null | undefined) => (ms == null ? "—" : `${ms} m/s`);

/** "walk_forward" → "walk forward". */
export const pretty = (s: unknown) => String(s ?? "—").replaceAll("_", " ");
