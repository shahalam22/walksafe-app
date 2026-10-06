import type { Metadata } from "next";
import { UsersPanel } from "@/components/admin/UsersPanel";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  return <UsersPanel />;
}
