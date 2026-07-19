"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, LifeBuoy } from "lucide-react";
import { PortalProvider, usePortal } from "@/lib/portal/PortalContext";
import { PortalShell } from "@/components/portal/PortalShell";

function Gate({ children }: { children: React.ReactNode }) {
  const { status, session, signOut } = usePortal();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthed") router.replace("/portal/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthed") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  // Signed in, but no client record matches this email yet.
  if (status === "no-file") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-6">
        <div className="crm-card w-full max-w-sm p-7 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}
          >
            <LifeBuoy className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h1 className="nx-display mt-4 text-xl font-semibold" style={{ color: "var(--nx-text)" }}>
            We couldn&apos;t find your file
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--nx-muted)" }}>
            You&apos;re signed in as{" "}
            <span style={{ color: "var(--nx-text)" }}>{session?.user?.email}</span>, but no student record uses that email yet. Ask your NextUp consultant to add it, then sign in again.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link href="/" className="crm-row crm-press justify-center" style={{ border: "1px solid var(--nx-edge)", color: "var(--nx-muted)" }}>
              Back to the website
            </Link>
            <button className="text-sm font-medium" style={{ color: "var(--nx-accent-2)" }} onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
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
