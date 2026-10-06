import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PwaSetup } from "@/components/PwaSetup";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "WalkSafe", template: "%s · WalkSafe" },
  description: "Walking guidance for blind and low-vision pedestrians",
  appleWebApp: { capable: true, title: "WalkSafe", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* For screen readers: text put here is read out (see lib/announce.ts). */}
        <div id="live" className="sr-only" aria-live="assertive" aria-atomic="true" />
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
        <PwaSetup />
      </body>
    </html>
  );
}
