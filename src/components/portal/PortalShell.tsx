"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Paperclip, CalendarDays, UserRound, Receipt, type LucideIcon } from "lucide-react";
import { PortalNotifications } from "./PortalNotifications";
import { usePortal } from "@/lib/portal/PortalContext";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}
const TABS: Tab[] = [
  { href: "/portal", label: "File", icon: FileText },
  { href: "/portal/documents", label: "Papers", icon: Paperclip },
  { href: "/portal/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/portal/receipts", label: "Receipts", icon: Receipt },
  { href: "/portal/profile", label: "You", icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}

/**
 * Derives a stable, human-quotable reference from the client id — the thing a
 * student reads out on WhatsApp when they ask "any news on my file?". It is
 * display-only; the uuid remains the identifier everywhere else.
 */
function fileRef(id: string | undefined, createdAt: string | undefined): string {
  if (!id) return "NX-------";
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  const tail = id.replace(/[^0-9a-f]/gi, "").slice(-4).toUpperCase();
  return `NX-${year}-${tail}`;
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { client, preview } = usePortal();

  return (
    <div className="min-h-[100dvh]">
      {/* The file header. Reads as a case record, not an app bar: who this file
          belongs to, and its reference. Both facts, no greeting. */}
      <header className="pf-filehead">
        <div className="pf-filehead-row mx-auto max-w-[640px]">
          <div className="min-w-0 flex-1">
            <p className="pf-label">Student file</p>
            <p className="mt-0.5 truncate text-[0.9375rem] font-medium leading-none">
              {client?.full_name ?? "—"}
            </p>
          </div>

          <span className="pf-mono text-[0.6875rem] tracking-wide" style={{ color: "var(--pf-vellum-3)" }}>
            {fileRef(client?.id, client?.created_at)}
          </span>

          {preview && (
            <span className="pf-status" data-tone="await">
              Preview
            </span>
          )}

          <PortalNotifications />

        </div>
      </header>

      <main className="mx-auto max-w-[640px]">{children}</main>

      <nav className="pf-dock" aria-label="Your file">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(pathname, t.href);
          return (
            <Link key={t.href} href={t.href} className="pf-tab" data-active={active} aria-current={active ? "page" : undefined}>
              <Icon className="h-[17px] w-[17px]" strokeWidth={active ? 2.2 : 1.8} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
