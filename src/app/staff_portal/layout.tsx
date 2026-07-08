import type { Metadata } from "next";
import { ToastProvider } from "@/components/internal";
import "@/styles/internal.css";

export const metadata: Metadata = {
  title: "Staff Portal | NextUp Mentor",
  description: "Internal staff portal for NextUp Mentor.",
  robots: { index: false, follow: false },
};

/** Root frame for the internal staff portal — applies the dark product theme. */
export default function StaffPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="nx-app">
      <ToastProvider>{children}</ToastProvider>
    </div>
  );
}
