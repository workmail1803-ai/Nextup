"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, ExternalLink, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface ShellUser {
  name: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
}

interface AppShellProps {
  portalLabel: string;
  nav: NavItem[];
  user?: ShellUser;
  onSignOut?: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function Brand({ portalLabel }: { portalLabel: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
        style={{
          background: "linear-gradient(160deg, var(--nx-accent-2), var(--nx-accent))",
          color: "var(--nx-accent-ink)",
        }}
      >
        N
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
          NextUp
        </p>
        <p className="text-[0.7rem]" style={{ color: "var(--nx-faint)" }}>
          {portalLabel}
        </p>
      </div>
    </div>
  );
}

function NavList({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {nav.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
            )}
            style={{
              background: active ? "var(--nx-accent-soft)" : "transparent",
              color: active ? "var(--nx-accent-2)" : "var(--nx-muted)",
            }}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="font-medium">{item.label}</span>
            </span>
            {item.badge != null && item.badge > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[0.68rem] font-bold"
                style={{ background: "var(--nx-accent)", color: "var(--nx-accent-ink)" }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({
  portalLabel,
  nav,
  pathname,
  user,
  onSignOut,
  onNavigate,
}: {
  portalLabel: string;
  nav: NavItem[];
  pathname: string;
  user?: ShellUser;
  onSignOut?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="px-1 py-2">
        <Brand portalLabel={portalLabel} />
      </div>
      <div className="mt-5 flex-1 overflow-y-auto">
        <NavList nav={nav} pathname={pathname} onNavigate={onNavigate} />
      </div>

      <div className="mt-4 space-y-2 border-t pt-3" style={{ borderColor: "var(--nx-edge)" }}>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/[0.03]"
          style={{ color: "var(--nx-faint)" }}
        >
          <ExternalLink className="h-[18px] w-[18px]" strokeWidth={2} />
          Back to website
        </Link>

        {user && (
          <div
            className="flex items-center gap-3 rounded-xl p-2.5"
            style={{ background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}
          >
            <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                {user.name}
              </p>
              {user.subtitle && (
                <p className="truncate text-xs" style={{ color: "var(--nx-faint)" }}>
                  {user.subtitle}
                </p>
              )}
            </div>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-white/5"
                style={{ color: "var(--nx-faint)" }}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Full internal-app frame: fixed sidebar (desktop) + drawer (mobile) + topbar. */
export function AppShell({
  portalLabel,
  nav,
  user,
  onSignOut,
  title,
  subtitle,
  actions,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-[100dvh]">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block"
        style={{ borderColor: "var(--nx-edge)", background: "var(--nx-bg-2)" }}
      >
        <SidebarBody
          portalLabel={portalLabel}
          nav={nav}
          pathname={pathname}
          user={user}
          onSignOut={onSignOut}
        />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: "rgba(6,5,3,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 w-72 border-r"
              style={{ borderColor: "var(--nx-edge)", background: "var(--nx-bg-2)" }}
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <SidebarBody
                portalLabel={portalLabel}
                nav={nav}
                pathname={pathname}
                user={user}
                onSignOut={onSignOut}
                onNavigate={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content column */}
      <div className="lg:pl-64">
        <header
          className="nx-glass sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 sm:px-6"
          style={{ borderColor: "var(--nx-edge)" }}
        >
          <button
            className="rounded-lg p-2 transition-colors hover:bg-white/5 lg:hidden"
            style={{ color: "var(--nx-muted)" }}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1
              className="nx-display truncate text-lg font-semibold sm:text-xl"
              style={{ color: "var(--nx-text)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-xs sm:text-sm" style={{ color: "var(--nx-faint)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>

        <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
