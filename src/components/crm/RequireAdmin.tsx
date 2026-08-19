"use client";

import Link from "next/link";
import { LoaderCircle, Lock } from "lucide-react";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";

/**
 * Renders children only for admins.
 *
 * This is a UX guard, not the security boundary — hiding a nav item does
 * nothing about someone typing the URL, and hiding the page does nothing about
 * someone calling the API directly. The actual enforcement is the
 * `is_admin()` RLS policy on the finance tables: a staff member who reaches
 * this page anyway gets an empty result set from Postgres, not a leak.
 *
 * Its job is to explain the wall rather than show a confusing empty screen.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, isAdmin } = useStaffAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <LoaderCircle className="h-6 w-6 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center px-6">
        <div className="crm-card w-full max-w-sm p-7 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--nx-panel-2)", color: "var(--nx-faint)" }}
          >
            <Lock className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <h1 className="nx-display mt-4 text-xl font-semibold" style={{ color: "var(--nx-text)" }}>
            Admins only
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--nx-muted)" }}>
            Finance is limited to admin accounts. If you need access, ask an admin to change your
            role.
          </p>
          <Link
            href="/crm"
            className="crm-row crm-press mt-5 justify-center"
            style={{ border: "1px solid var(--nx-edge)", color: "var(--nx-muted)" }}
          >
            Back to Today
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
