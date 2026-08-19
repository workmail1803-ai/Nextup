import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/internal";
import "@/styles/internal.css";
import "@/styles/portal.css";

export const metadata: Metadata = {
  title: "My NextUp",
  description: "Your study-abroad journey with NextUp Mentor.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e1117",
};

/**
 * The portal runs on its own layer (`.pf`), not the staff Studio Dark chrome.
 * A student should not feel they have been handed the company's internal tool.
 * internal.css is still loaded for the shared primitives (Toast, Avatar).
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nx-app pf">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
