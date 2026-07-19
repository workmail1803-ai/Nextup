"use client";

import { LoaderCircle } from "lucide-react";
import { useStaffSession } from "@/lib/hooks/useStaffSession";
import { CrmShell } from "@/components/crm/CrmShell";

/** Guards every workspace page behind the staff session and mounts the shell. */
export default function CrmAppLayout({ children }: { children: React.ReactNode }) {
  const { session, loading } = useStaffSession({ redirectTo: "/crm/login" });

  if (loading || !session) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  return <CrmShell>{children}</CrmShell>;
}
