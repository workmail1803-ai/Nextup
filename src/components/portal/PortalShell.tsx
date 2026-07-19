"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, FileCheck2, CalendarDays, LogOut, type LucideIcon } from "lucide-react";
import { usePortal } from "@/lib/portal/PortalContext";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
}
const TABS: Tab[] = [
  { href: "/portal", label: "Home", icon: Home },
  { href: "/portal/documents", label: "Documents", icon: FileCheck2 },
  { href: "/portal/meetings", label: "Meetings", icon: CalendarDays },
];

function isActive(pathname: string, href: string) {
  return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { client, signOut, preview } = usePortal();
  const current = TABS.find((t) => isActive(pathname, t.href)) ?? TABS[0];
  const firstName = client?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-[100dvh]">
      <header className="crm-topbar crm-glass">
        <Link href="/portal" className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[0.8rem] font-bold"
            style={{ background: "linear-gradient(160deg, var(--nx-accent-2), var(--nx-accent))", color: "var(--nx-accent-ink)" }}
          >
            N
          </span>
        </Link>
        <h1 className="nx-display min-w-0 flex-1 truncate text-[1.05rem] font-semibold" style={{ color: "var(--nx-text)" }}>
          {current.label === "Home" ? `Hi, ${firstName}` : current.label}
        </h1>
        {preview && (
          <span
            className="rounded-full px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wider"
            style={{ background: "var(--nx-warning-soft)", color: "var(--nx-warning)", border: "1px solid rgba(224,178,58,0.35)" }}
          >
            Preview
          </span>
        )}
        <button
          className="crm-press flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold"
          style={{ color: "var(--nx-muted)", background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}
          onClick={() => void signOut()}
        >
          <LogOut className="h-3.5 w-3.5" /> {preview ? "Switch" : "Sign out"}
        </button>
      </header>

      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[560px]"
      >
        {children}
      </motion.main>

      {/* Bottom dock — kept on every size (students are mobile-first, and it
          centers cleanly on desktop within the 560px column). */}
      <nav
        className="crm-glass fixed inset-x-3 z-40 mx-auto flex max-w-[520px] items-stretch justify-around overflow-hidden"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
          height: "4rem",
          border: "1px solid var(--nx-edge-2)",
          borderRadius: "1.4rem",
          boxShadow: "var(--nx-shadow-lg)",
        }}
        aria-label="Main"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = isActive(pathname, t.href);
          return (
            <Link key={t.href} href={t.href} className="crm-tab" data-active={active}>
              {active && (
                <motion.span layoutId="portal-tab-pill" className="crm-tab-pill" transition={{ type: "spring", damping: 30, stiffness: 400 }} />
              )}
              <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.4 : 2} />
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
