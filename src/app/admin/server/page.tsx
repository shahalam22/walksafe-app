import type { Metadata } from "next";
import { ServerSettings } from "@/components/admin/ServerSettings";

export const metadata: Metadata = { title: "Server" };

export default function ServerPage() {
  return <ServerSettings />;
}
