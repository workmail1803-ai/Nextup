import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/internal";
import { StaffAuthProvider } from "@/lib/auth/StaffAuthContext";
import "@/styles/internal.css";
import "@/styles/crm.css";

export const metadata: Metadata = {
  title: "NextUp CRM",
  description: "Staff workspace for NextUp Mentor.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#100d09",
};

/**
 * Theme frame for the whole CRM surface (login + app share the look).
 * StaffAuthProvider wraps both, so the login page can see an existing session
 * and skip straight through instead of asking a signed-in user to sign in.
 */
export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nx-app crm-app">
      <StaffAuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </StaffAuthProvider>
    </div>
  );
}
