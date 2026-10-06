import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "New password" };

// Opened from the reset link in the email (see AuthProvider).
export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
