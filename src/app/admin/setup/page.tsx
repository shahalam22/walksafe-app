import type { Metadata } from "next";
import { PhoneSetup } from "@/components/admin/PhoneSetup";

export const metadata: Metadata = { title: "Phone setup" };

export default function PhoneSetupPage() {
  return <PhoneSetup />;
}
