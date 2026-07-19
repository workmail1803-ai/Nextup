import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/internal";
import "@/styles/internal.css";
import "@/styles/crm.css";

export const metadata: Metadata = {
  title: "My NextUp",
  description: "Your study-abroad journey with NextUp Mentor.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#100d09",
};

/** Theme frame for the student portal. Reuses Studio Dark + the CRM app chrome. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nx-app crm-app">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
