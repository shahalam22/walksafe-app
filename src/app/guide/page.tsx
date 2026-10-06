import type { Metadata } from "next";
import { GuideScreen } from "@/components/guide/GuideScreen";

export const metadata: Metadata = { title: "Guidance" };

export default function GuidePage() {
  return <GuideScreen />;
}
