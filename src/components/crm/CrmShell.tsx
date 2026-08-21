"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, Users, Calendar, Wallet, CalendarClock,
  Search, LogOut, ExternalLink, Camera, Loader2, Trash2, type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/internal";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";
import { StaffAvatarService, AVATAR_ACCEPT } from "@/lib/services/staff.service";
import { useToast } from "@/components/internal";
import { Sheet } from "./Sheet";
import { SearchOverlay } from "./SearchOverlay";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Admin-only tabs are hidden for staff. RLS is what actually enforces it. */
  adminOnly?: boolean;
  /** Shown only to staff an admin has marked as mentors. */
  mentorOnly?: boolean;
}

const TABS: Tab[] = [
  { href: "/crm", label: "Today", icon: LayoutDashboard },
  { href: "/crm/pipeline", label: "Pipeline", icon: FolderKanban },
  { href: "/crm/clients", label: "Clients", icon: Users },
  { href: "/crm/bookings", label: "Bookings", icon: Calendar },
  { href: "/crm/schedule", label: "My hours", icon: CalendarClock, mentorOnly: true },
  { href: "/crm/finance", label: "Finance", icon: Wallet, adminOnly: true },
];

function isActive(pathname: string, href: string) {
  return href === "/crm" ? pathname === "/crm" : pathname.startsWith(href);
}

export function CrmShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { staff, isAdmin, isMentor, signOut: authSignOut, refresh } = useStaffAuth();
  const toast = useToast();
  const avatarInput = useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const tabs = useMemo(
    () => TABS.filter((t) => (!t.adminOnly || isAdmin) && (!t.mentorOnly || isMentor)),
    [isAdmin, isMentor],
  );
  const current = tabs.find((t) => isActive(pathname, t.href)) ?? tabs[0];

  // Shape the old `session` fields the rest of this component reads, so the
  // auth swap stays contained to this one adapter.
  const session = staff
    ? {
        fullName: staff.full_name,
        avatarUrl: staff.avatar_url,
        title: staff.title,
        staffCode: staff.staff_code,
      }
    : null;

  async function signOut() {
    await authSignOut();
    router.replace("/crm/login");
  }

  async function changeAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !staff?.id) return;
    setAvatarBusy(true);
    try {
      await StaffAvatarService.upload(staff.id, file);
      refresh();
      toast({ title: "Photo updated", description: "Students booking with you will see it.", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't upload that",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    } finally {
      setAvatarBusy(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  async function clearAvatar() {
    if (!staff?.id) return;
    setAvatarBusy(true);
    try {
      await StaffAvatarService.remove(staff.id, staff.avatar_url);
      refresh();
      toast({ title: "Photo removed", tone: "success" });
    } catch (err) {
      toast({
        title: "Couldn't remove it",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh]">
      {/* Desktop rail */}
      <aside className="crm-rail sticky top-0 hidden h-[100dvh] shrink-0 flex-col p-4 lg:flex">
        <Link href="/crm" className="flex items-center gap-2.5 px-2 py-1.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold"
            style={{
              background: "linear-gradient(160deg, var(--nx-accent-2), var(--nx-accent))",
              color: "var(--nx-accent-ink)",
            }}
          >
            N
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
              NextUp
            </span>
            <span className="block text-[0.7rem]" style={{ color: "var(--nx-faint)" }}>
              CRM Workspace
            </span>
          </span>
        </Link>

        <nav className="mt-6 flex-1 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="crm-rail-item"
                data-active={isActive(pathname, t.href)}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {t.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="crm-rail-item w-full"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-[18px] w-[18px]" strokeWidth={2} />
          Search clients
          <span
            className="ml-auto rounded border px-1.5 py-0.5 text-[0.62rem]"
            style={{ borderColor: "var(--nx-edge-2)", color: "var(--nx-faint)" }}
          >
            /
          </span>
        </button>

        {session && (
          <button
            className="crm-press mt-2 flex w-full items-center gap-3 rounded-xl p-2.5 text-left"
            style={{ background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}
            onClick={() => setProfileOpen(true)}
          >
            <Avatar name={session.fullName} src={session.avatarUrl} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                {session.fullName}
              </span>
              <span className="block truncate text-xs" style={{ color: "var(--nx-faint)" }}>
                {session.title || session.staffCode}
              </span>
            </span>
          </button>
        )}
      </aside>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        <header className="crm-topbar crm-glass">
          <Link href="/crm" className="flex items-center gap-2 lg:hidden">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[0.8rem] font-bold"
              style={{
                background: "linear-gradient(160deg, var(--nx-accent-2), var(--nx-accent))",
                color: "var(--nx-accent-ink)",
              }}
            >
              N
            </span>
          </Link>
          <h1
            className="nx-display min-w-0 flex-1 truncate text-[1.05rem] font-semibold"
            style={{ color: "var(--nx-text)" }}
          >
            {current.label}
          </h1>
          <button
            className="crm-press flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: "var(--nx-muted)", background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}
            onClick={() => setSearchOpen(true)}
            aria-label="Search clients"
          >
            <Search className="h-[17px] w-[17px]" strokeWidth={2.2} />
          </button>
          {session && (
            <button
              className="crm-press lg:hidden"
              onClick={() => setProfileOpen(true)}
              aria-label="Your profile"
            >
              <Avatar name={session.fullName} src={session.avatarUrl} size="sm" />
            </button>
          )}
        </header>

        {/* Page content: gentle rise on tab change */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-[1200px]"
        >
          {children}
        </motion.main>
      </div>

      {/* Mobile dock */}
      <nav className="crm-tabbar crm-glass lg:hidden" aria-label="Main">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = isActive(pathname, t.href);
          return (
            <Link key={t.href} href={t.href} className="crm-tab" data-active={active}>
              {active && (
                <motion.span
                  layoutId="crm-tab-pill"
                  className="crm-tab-pill"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                />
              )}
              <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.4 : 2} />
              {t.label}
            </Link>
          );
        })}
      </nav>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Profile sheet */}
      <Sheet open={profileOpen} onClose={() => setProfileOpen(false)} label="Your profile">
        {session && (
          <div className="pt-1">
            <div className="flex items-center gap-3.5">
              <Avatar name={session.fullName} src={session.avatarUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="nx-display text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
                  {session.fullName}
                </p>
                <p className="text-sm" style={{ color: "var(--nx-faint)" }}>
                  {session.title || "Staff"} · {session.staffCode}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    ref={avatarInput}
                    type="file"
                    accept={AVATAR_ACCEPT}
                    className="hidden"
                    onChange={changeAvatar}
                    aria-label="Upload a profile photo"
                  />
                  <button
                    className="nx-btn nx-btn-ghost text-xs"
                    onClick={() => avatarInput.current?.click()}
                    disabled={avatarBusy}
                  >
                    {avatarBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    {session.avatarUrl ? "Change photo" : "Add a photo"}
                  </button>
                  {session.avatarUrl && (
                    <button
                      className="crm-press flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ color: "var(--nx-faint)" }}
                      onClick={clearAvatar}
                      disabled={avatarBusy}
                      aria-label="Remove photo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {isMentor && (
                  <p className="mt-1.5 text-[0.7rem]" style={{ color: "var(--nx-faint)" }}>
                    Students see this when choosing a mentor, so it is public.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-5 space-y-1.5">
              <Link
                href="/"
                className="crm-row crm-press"
                style={{ border: "1px solid var(--nx-edge)", color: "var(--nx-muted)" }}
              >
                <ExternalLink className="h-4 w-4" /> Open the public site
              </Link>
              <button
                className="crm-row crm-press w-full"
                style={{ border: "1px solid rgba(239,107,94,0.35)", color: "var(--nx-danger)" }}
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
