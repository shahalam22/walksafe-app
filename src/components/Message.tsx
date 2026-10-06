export interface Notice {
  text: string;
  ok: boolean;
}

/** A result line: green when it worked, red when it did not. Read out by screen readers. */
export function Message({ notice, className = "" }: { notice: Notice | null; className?: string }) {
  if (!notice?.text) return null;
  return (
    <p role={notice.ok ? "status" : "alert"} className={`${notice.ok ? "ok" : "error"} ${className}`.trim()}>
      {notice.text}
    </p>
  );
}
