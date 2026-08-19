"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldAlert } from "lucide-react";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";
import { CrmShell } from "@/components/crm/CrmShell";

/** Guards every workspace page behind a real staff session and mounts the shell. */
export default function CrmAppLayout({ children }: { children: React.ReactNode }) {
  const { status, session, signOut } = useStaffAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthed") router.replace("/crm/login");
  }, [status, router]);

  if (status === "loading" || status === "unauthed") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  // Authenticated with Supabase, but no active staff row carries this email.
  // Distinct from "unauthed" on purpose: bouncing them back to the login form
  // would loop forever, since signing in again cannot fix a missing record.
  if (status === "no-staff-record") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-6">
        <div className="crm-card w-full max-w-sm p-7 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--nx-warning-soft)", color: "var(--nx-warning)" }}
          >
            <ShieldAlert className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h1 className="nx-display mt-4 text-xl font-semibold" style={{ color: "var(--nx-text)" }}>
            No workspace access
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--nx-muted)" }}>
            You&apos;re signed in as{" "}
            <span style={{ color: "var(--nx-text)" }}>{session?.user?.email}</span>, but no active
            staff record uses that address. Ask an admin to add you.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/"
              className="crm-row crm-press justify-center"
              style={{ border: "1px solid var(--nx-edge)", color: "var(--nx-muted)" }}
            >
              Back to the website
            </Link>
            <button
              className="text-sm font-medium"
              style={{ color: "var(--nx-accent-2)" }}
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <CrmShell>{children}</CrmShell>;
}
