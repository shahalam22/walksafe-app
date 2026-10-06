import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionDetail } from "@/components/admin/SessionDetail";

export const metadata: Metadata = { title: "Session" };

// The session id is in the address (?id=…), read in the browser: static pages
// cannot list every session ahead of time.
export default function SessionPage() {
  return (
    <Suspense>
      <SessionDetail />
    </Suspense>
  );
}
