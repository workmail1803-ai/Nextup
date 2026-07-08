"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  Clock,
  LayoutDashboard,
  LoaderCircle,
  Megaphone,
  Percent,
  Play,
  Square,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  AppShell,
  StatCard,
  AnimatedNumber,
  StatusBadge,
  ActivityTimeline,
  AreaChart,
  EmptyState,
  SkeletonCard,
  Avatar,
  useToast,
  type NavItem,
  type TimelineItem,
} from "@/components/internal";
import { useStaffSession } from "@/lib/hooks/useStaffSession";
import { AttendanceService } from "@/lib/services/attendance.service";
import type { AttendanceSession } from "@/lib/types/attendance";
import {
  clockTime,
  dailyTotals,
  formatHm,
  hoursDecimal,
  sessionMinutes,
  summarize,
} from "@/lib/attendance/compute";
import { AttendanceControls } from "./_components/AttendanceControls";

const NAV: NavItem[] = [
  { href: "/staff_portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff_portal/clients", label: "Clients", icon: Users },
];

/** Placeholder announcements (real feed arrives with the admin module). */
const ANNOUNCEMENTS = [
  {
    id: "a1",
    title: "Welcome to the new Staff Portal",
    body: "Clock in and out here from now on — the old attendance sheet is retired.",
    date: "Today",
  },
  {
    id: "a2",
    title: "Client records are moving in",
    body: "Your assigned client sheets will appear under Clients in the next update.",
    date: "This week",
  },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function fmtDate(workDate: string): string {
  const [y, m, d] = workDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function StaffDashboardPage() {
  const { session, loading: sessLoading, signOut } = useStaffSession({
    redirectTo: "/staff_portal",
  });
  const toast = useToast();
  const staffId = session?.staffId;

  const [active, setActive] = useState<AttendanceSession | null>(null);
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);

  const fetchData = useCallback(async () => {
    if (!staffId) return;
    try {
      const [act, hist] = await Promise.all([
        AttendanceService.getActiveSession(staffId),
        AttendanceService.historyForStaff(staffId),
      ]);
      setActive(act);
      setHistory(hist);
      setError(null);
    } catch {
      setError(
        "We couldn't load your attendance. Make sure the database migration (0001_staff_attendance.sql) has been applied.",
      );
    } finally {
      setDataLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    if (!staffId) return;
    fetchData();
    const unsubscribe = AttendanceService.subscribeStaff(staffId, fetchData);
    return unsubscribe;
  }, [staffId, fetchData]);

  const handleStart = useCallback(async () => {
    if (!staffId) return;
    setStarting(true);
    try {
      const s = await AttendanceService.startWork(staffId);
      setActive(s);
      toast({
        title: "Work started",
        description: `Clocked in at ${clockTime(s.start_at)}.`,
        tone: "success",
      });
      fetchData();
    } catch {
      toast({ title: "Couldn't start work", description: "Please try again.", tone: "error" });
    } finally {
      setStarting(false);
    }
  }, [staffId, toast, fetchData]);

  const handleEnd = useCallback(async () => {
    if (!active) return;
    setEnding(true);
    try {
      const s = await AttendanceService.endWork(active);
      setActive(null);
      toast({
        title: "Work ended",
        description: `You logged ${formatHm(s.duration_minutes ?? 0)} this session.`,
        tone: "success",
      });
      fetchData();
    } catch {
      toast({ title: "Couldn't end work", description: "Please try again.", tone: "error" });
    } finally {
      setEnding(false);
    }
  }, [active, toast, fetchData]);

  const summary = useMemo(() => summarize(history), [history]);
  const chartData = useMemo(
    () =>
      dailyTotals(history, 14).map((d) => ({
        label: d.label,
        value: hoursDecimal(d.minutes),
      })),
    [history],
  );
  const timeline = useMemo<TimelineItem[]>(
    () =>
      history.slice(0, 6).map((s) => ({
        id: s.id,
        icon: s.status === "working" ? Play : Square,
        tone: s.status === "working" ? "positive" : "accent",
        title:
          s.status === "working"
            ? "Started a work session"
            : `Worked ${formatHm(sessionMinutes(s))}`,
        meta: `${fmtDate(s.work_date)} · ${clockTime(s.start_at)}${
          s.end_at ? ` – ${clockTime(s.end_at)}` : ""
        }`,
      })),
    [history],
  );

  // — Loading / guard —
  if (sessLoading || !session) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  const firstName = session.fullName.split(" ")[0];
  const todayBadge = active
    ? { label: "Working", tone: "positive" as const, pulse: true }
    : summary.todayMinutes > 0
      ? { label: "Done for today", tone: "info" as const, pulse: false }
      : { label: "Not started", tone: "neutral" as const, pulse: false };

  return (
    <AppShell
      portalLabel="Staff Portal"
      nav={NAV}
      user={{ name: session.fullName, subtitle: session.title ?? "Staff", avatarUrl: session.avatarUrl }}
      onSignOut={signOut}
      title={`${greeting()}, ${firstName}`}
      subtitle={new Date().toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      actions={
        <StatusBadge label={todayBadge.label} tone={todayBadge.tone} dot pulse={todayBadge.pulse} />
      }
    >
      {error && (
        <div
          className="mb-5 flex items-start gap-3 rounded-xl p-4"
          style={{ background: "var(--nx-danger-soft)", border: "1px solid rgba(239,107,94,0.3)" }}
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--nx-danger)" }} />
          <div className="flex-1">
            <p className="text-sm" style={{ color: "var(--nx-text)" }}>
              {error}
            </p>
            <button
              className="mt-2 text-sm font-semibold underline"
              style={{ color: "var(--nx-danger)" }}
              onClick={() => {
                setDataLoading(true);
                fetchData();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dataLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              label="Today"
              icon={Clock}
              value={<AnimatedNumber value={summary.todayMinutes} format={formatHm} />}
              hint={active ? "Live — session in progress" : "Hours logged today"}
              accent={!!active}
            />
            <StatCard
              label="This week"
              icon={CalendarDays}
              value={<AnimatedNumber value={summary.weekMinutes} format={formatHm} />}
              hint="Mon – today"
            />
            <StatCard
              label="This month"
              icon={TrendingUp}
              value={<AnimatedNumber value={summary.monthMinutes} format={formatHm} />}
              hint={`${summary.daysPresentThisMonth} day${summary.daysPresentThisMonth === 1 ? "" : "s"} present`}
            />
            <StatCard
              label="Attendance"
              icon={Percent}
              value={<AnimatedNumber value={summary.attendanceRatePct} format={(n) => `${Math.round(n)}%`} />}
              hint={`${summary.daysPresentThisMonth}/${summary.businessDaysElapsed} business days`}
            />
          </>
        )}
      </div>

      {/* Attendance + profile */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AttendanceControls
            active={active}
            todayMinutes={summary.todayMinutes}
            starting={starting}
            ending={ending}
            onStart={handleStart}
            onEnd={handleEnd}
          />
        </div>

        <div className="space-y-4">
          {/* Profile */}
          <div className="nx-card p-5">
            <div className="flex items-center gap-3.5">
              <Avatar name={session.fullName} src={session.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold" style={{ color: "var(--nx-text)" }}>
                  {session.fullName}
                </p>
                <p className="truncate text-sm" style={{ color: "var(--nx-muted)" }}>
                  {session.title ?? "Staff member"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="nx-label mb-1">Staff code</p>
                <p className="font-mono" style={{ color: "var(--nx-text)" }}>
                  {session.staffCode}
                </p>
              </div>
              <div>
                <p className="nx-label mb-1">Longest session</p>
                <p style={{ color: "var(--nx-text)" }}>
                  {summary.longestSessionMinutes > 0 ? formatHm(summary.longestSessionMinutes) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div className="nx-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Megaphone className="h-4 w-4" style={{ color: "var(--nx-accent-2)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
                Announcements
              </p>
            </div>
            <div className="space-y-3">
              {ANNOUNCEMENTS.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg p-3"
                  style={{ background: "var(--nx-panel-2)", border: "1px solid var(--nx-edge)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                      {a.title}
                    </p>
                    <span className="shrink-0 text-xs" style={{ color: "var(--nx-faint)" }}>
                      {a.date}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--nx-muted)" }}>
                    {a.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart + activity */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="nx-card p-5 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
              Working hours
            </p>
            <span className="text-xs" style={{ color: "var(--nx-faint)" }}>
              Last 14 days
            </span>
          </div>
          {dataLoading ? (
            <div className="nx-skeleton mt-4 h-[200px] w-full rounded-lg" />
          ) : (
            <AreaChart data={chartData} labelEvery={2} valueFormat={(n) => `${n}h`} className="mt-2" />
          )}
        </div>

        <div className="nx-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4" style={{ color: "var(--nx-accent-2)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
              Recent activity
            </p>
          </div>
          {timeline.length > 0 ? (
            <ActivityTimeline items={timeline} />
          ) : (
            <EmptyState icon={Activity} title="No activity yet" description="Your work sessions will show up here." />
          )}
        </div>
      </div>

      {/* Attendance history */}
      <div className="mt-4 nx-card overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--nx-edge)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
            Attendance history
          </p>
          <span className="text-xs" style={{ color: "var(--nx-faint)" }}>
            {history.length} session{history.length === 1 ? "" : "s"}
          </span>
        </div>

        {dataLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="nx-skeleton h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No attendance recorded yet"
            description="Press Start Work above to log your first session."
          />
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10" style={{ background: "var(--nx-panel)" }}>
                <tr style={{ color: "var(--nx-faint)" }}>
                  <th className="px-5 py-2.5 text-left text-xs font-medium">Date</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium">Start</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium">End</th>
                  <th className="px-5 py-2.5 text-left text-xs font-medium">Duration</th>
                  <th className="px-5 py-2.5 text-right text-xs font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: "var(--nx-edge)" }}>
                    <td className="px-5 py-3" style={{ color: "var(--nx-text)" }}>
                      {fmtDate(s.work_date)}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--nx-muted)" }}>
                      {clockTime(s.start_at)}
                    </td>
                    <td className="px-5 py-3" style={{ color: "var(--nx-muted)" }}>
                      {s.end_at ? clockTime(s.end_at) : "—"}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: "var(--nx-text)" }}>
                      {formatHm(sessionMinutes(s))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StatusBadge
                        label={s.status === "working" ? "Working" : "Completed"}
                        tone={s.status === "working" ? "positive" : "neutral"}
                        dot={s.status === "working"}
                        pulse={s.status === "working"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
