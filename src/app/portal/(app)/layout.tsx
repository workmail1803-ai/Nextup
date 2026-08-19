"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { PortalProvider, usePortal } from "@/lib/portal/PortalContext";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalOnboarding } from "@/components/portal/PortalOnboarding";

function Gate({ children }: { children: React.ReactNode }) {
  const { status, session, refresh } = usePortal();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthed") router.replace("/portal/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthed") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin" style={{ color: "var(--pf-vellum-3)" }} />
      </div>
    );
  }

  // Signed in, but no client record matches this email yet.
  // Signed in with no file: this is a NEW student, not an error. Onboarding
  // creates the file and books a mentor, rather than telling them to go away.
  if (status === "no-file") {
    return <PortalOnboarding session={session} onComplete={refresh} />;
  }

  return <PortalShell>{children}</PortalShell>;
}

export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalProvider>
      <Gate>{children}</Gate>
    </PortalProvider>
  );
}
