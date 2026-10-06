import type { Metadata } from "next";
import { SessionsOverview } from "@/components/admin/SessionsOverview";

export const metadata: Metadata = { title: "Sessions" };

export default function SessionsPage() {
  return <SessionsOverview />;
}
