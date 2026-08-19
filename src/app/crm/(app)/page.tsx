"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarClock, ChevronRight, Wallet } from "lucide-react";
import { Avatar, AreaChart, StatusBadge } from "@/components/internal";
import { JourneyStrip } from "@/components/crm/JourneyStrip";
import { AttendanceCard } from "@/components/crm/AttendanceCard";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";
import { ClientService } from "@/lib/services/client.service";
import { AppointmentService } from "@/lib/services/appointment.service";
import { AttendanceService } from "@/lib/services/attendance.service";
import { FinanceService } from "@/lib/services/finance.service";
import { db } from "@/lib/supabase";
import { STAGE_META, type ClientStage, type ClientWithRelations } from "@/lib/types/client";
import { formatSlot, WEEKDAYS_SHORT, type AppointmentWithMentors } from "@/lib/types/scheduling";
import { formatBDT, monthlyTrend, monthKey, summarize } from "@/lib/finance/analytics";
import { localDateKey } from "@/lib/attendance/compute";

const STAGE_ORDER: ClientStage[] = ["lead", "meeting", "file_open", "offer", "visa", "enrolled", "closed"];

/** Runway segment colors — one hue per leg of the journey. */
const STAGE_COLOR: Record<ClientStage, string> = {
  lead: "rgba(124,115,100,0.55)",
  meeting: "rgba(90,169,224,0.65)",
  file_open: "rgba(224,146,31,0.7)",
  offer: "rgba(224,178,58,0.75)",
  visa: "rgba(242,173,66,0.9)",
  enrolled: "rgba(70,177,125,0.85)",
  closed: "rgba(240,232,218,0.12)",
};

async function settled<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface TodayData {
  clients: ClientWithRelations[];
  appointments: AppointmentWithMentors[];
  workingNow: number;
  spentMonth: number;
  budget: number;
  trend: { label: string; value: number }[];
  unread: number;
  /** Clock reference captured at load time (keeps render pure). */
  now: number;
}

export default function TodayPage() {
  const router = useRouter();
  const { staff } = useStaffAuth();
  const [data, setData] = useState<TodayData | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const [clients, appointments, sessions, expenses, budgets, messages] = await Promise.all([
        settled(ClientService.listWithRelations(), [] as ClientWithRelations[]),
        settled(AppointmentService.list(), [] as AppointmentWithMentors[]),
        settled(AttendanceService.todayAll(), []),
        settled(FinanceService.expenses.list(), []),
        settled(FinanceService.budgets.list(), []),
        settled(db.messages.getAll(), []),
      ]);
      if (!alive) return;
      const budget =
        budgets.find((b) => b.period_type === "monthly" && b.period_key === monthKey(new Date()))?.amount ?? 0;
      const fin = summarize(expenses, budget);
      setData({
        clients,
        appointments,
        workingNow: new Set(sessions.filter((s) => s.status === "working").map((s) => s.staff_id)).size,
        spentMonth: fin.spentThisMonth,
        budget,
        trend: monthlyTrend(expenses, 6).map((t) => ({ label: t.label, value: t.value })),
        unread: messages.filter((m) => m.status === "unread").length,
        now: Date.now(),
      });
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0])) as Record<ClientStage, number>;
    for (const c of data?.clients ?? []) map[c.stage] += 1;
    return map;
  }, [data]);

  const active = (data?.clients ?? []).filter((c) => c.stage !== "closed");

  const todayAppts = useMemo(() => {
    if (!data) return [];
    const todayKey = localDateKey();
    const weekday = new Date().getDay();
    return data.appointments.filter(
      (a) =>
        (a.scheduled_at ?? "").slice(0, 10) === todayKey ||
        (a.weekday === weekday && ["assigned", "confirmed"].includes(a.status)),
    );
  }, [data]);

  const needsAttention = useMemo(() => {
    if (!data) return [];
    const cutoff = data.now - 7 * 86_400_000;
    return data.clients
      .filter((c) => !["enrolled", "closed"].includes(c.stage) && new Date(c.updated_at).getTime() < cutoff)
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
      .slice(0, 5);
  }, [data]);

  const firstName = staff?.full_name.split(" ")[0] ?? "there";
  const total = data?.clients.length ?? 0;

  const kpis = [
    { label: "Active clients", value: String(active.length), hint: `${total} in the book` },
    { label: "In visa stage", value: String(byStage.visa), hint: "files at the embassy" },
    { label: "Meetings today", value: String(todayAppts.length), hint: "on the calendar" },
    { label: "Team on shift", value: String(data?.workingNow ?? 0), hint: "working right now" },
    { label: "Unread messages", value: String(data?.unread ?? 0), hint: "from the website" },
  ];

  return (
    <div className="space-y-6 py-5">
      {/* Hero: greeting + the Runway */}
      <section className="px-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--nx-accent)" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h2 className="nx-display mt-1 text-[1.65rem] font-semibold leading-tight" style={{ color: "var(--nx-text)" }}>
          {greeting()}, {firstName}.
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--nx-muted)" }}>
          {data ? (
            <>
              <span className="crm-num font-semibold" style={{ color: "var(--nx-text)" }}>{active.length}</span>{" "}
              students on the runway — tap a leg to work it.
            </>
          ) : (
            "Warming up your caseload…"
          )}
        </p>

        <div className="mt-4">
          {data ? (
            <>
              <div className="crm-runway">
                {STAGE_ORDER.map((s) => {
                  const count = byStage[s];
                  return (
                    <button
                      key={s}
                      onClick={() => router.push("/crm/pipeline")}
                      style={{
                        background: STAGE_COLOR[s],
                        color: s === "closed" ? "var(--nx-muted)" : "var(--nx-accent-ink)",
                        flexGrow: Math.max(count, 0.35),
                      }}
                      aria-label={`${STAGE_META[s].label}: ${count} clients`}
                      title={`${STAGE_META[s].label}: ${count}`}
                    >
                      {count > 0 ? count : ""}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {STAGE_ORDER.filter((s) => s !== "closed").map((s) => (
                  <span key={s} className="flex items-center gap-1.5 text-[0.68rem]" style={{ color: "var(--nx-faint)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ background: STAGE_COLOR[s] }} />
                    {STAGE_META[s].label}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="nx-skeleton h-[2.6rem] rounded-[0.9rem]" />
          )}
        </div>
      </section>

      {/* KPI snap rail */}
      <motion.section
        className="crm-snap"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
      >
        {kpis.map((k) => (
          <motion.div
            key={k.label}
            className="crm-card w-[9.5rem] p-4"
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[0.7rem] font-medium" style={{ color: "var(--nx-faint)" }}>{k.label}</p>
            <p className="crm-num nx-display mt-1.5 text-[1.7rem] font-semibold leading-none" style={{ color: "var(--nx-text)" }}>
              {data ? k.value : "–"}
            </p>
            <p className="mt-1.5 text-[0.68rem]" style={{ color: "var(--nx-faint)" }}>{k.hint}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Your shift clock — merged in from the old /staff_portal dashboard */}
      <section className="px-4 sm:px-6">
        <AttendanceCard />
      </section>

      {/* Today's meetings */}
      <section className="px-4 sm:px-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="crm-section-title">Today&apos;s meetings</h3>
          <Link href="/crm/bookings" className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: "var(--nx-accent-2)" }}>
            All bookings <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="crm-card overflow-hidden">
          {!data && <div className="nx-skeleton m-3 h-16 rounded-xl" />}
          {data && todayAppts.length === 0 && (
            <div className="flex items-center gap-3 px-4 py-6">
              <CalendarClock className="h-5 w-5 shrink-0" style={{ color: "var(--nx-faint)" }} />
              <p className="text-sm" style={{ color: "var(--nx-muted)" }}>
                A clear calendar. Use the quiet — the attention list below is waiting.
              </p>
            </div>
          )}
          {data &&
            todayAppts.slice(0, 5).map((a, i) => (
              <div key={a.id} className="crm-row" style={i > 0 ? { borderTop: "1px solid var(--nx-edge)", borderRadius: 0 } : { borderRadius: 0 }}>
                <div className="crm-num w-[4.6rem] shrink-0 text-[0.78rem] font-semibold" style={{ color: "var(--nx-accent-2)" }}>
                  {a.weekday != null ? `${WEEKDAYS_SHORT[a.weekday]} ` : ""}
                  {formatSlot(a.slot_start, a.slot_end).split(" – ")[0] || "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>{a.name}</p>
                  <p className="truncate text-xs" style={{ color: "var(--nx-faint)" }}>
                    {a.assigned_mentor?.full_name ?? "Needs a mentor"}
                  </p>
                </div>
                <StatusBadge label={a.status} tone={a.status === "pending" ? "warning" : a.status === "completed" ? "positive" : "info"} />
              </div>
            ))}
        </div>
      </section>

      {/* Needs attention */}
      <section className="px-4 sm:px-6">
        <h3 className="crm-section-title mb-2.5">Needs attention</h3>
        <div className="crm-card overflow-hidden">
          {!data && <div className="nx-skeleton m-3 h-16 rounded-xl" />}
          {data && needsAttention.length === 0 && (
            <p className="px-4 py-6 text-sm" style={{ color: "var(--nx-muted)" }}>
              All caught up — no one has been waiting more than a week.
            </p>
          )}
          {data &&
            needsAttention.map((c, i) => {
              const days = Math.floor(((data?.now ?? 0) - new Date(c.updated_at).getTime()) / 86_400_000);
              return (
                <div
                  key={c.id}
                  className="crm-row"
                  role="button"
                  tabIndex={0}
                  style={i > 0 ? { borderTop: "1px solid var(--nx-edge)", borderRadius: 0 } : { borderRadius: 0 }}
                  onClick={() => router.push(`/crm/clients?open=${c.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/crm/clients?open=${c.id}`)}
                >
                  <Avatar name={c.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>{c.full_name}</p>
                    <JourneyStrip stage={c.stage} className="mt-1.5 max-w-[8rem]" />
                  </div>
                  <span className="crm-num shrink-0 text-xs font-semibold" style={{ color: "var(--nx-warning)" }}>
                    {days}d quiet
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* Finance mini */}
      <section className="px-4 pb-2 sm:px-6">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="crm-section-title">Money this month</h3>
          <Link href="/crm/finance" className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: "var(--nx-accent-2)" }}>
            Finance <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="crm-card p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[0.7rem]" style={{ color: "var(--nx-faint)" }}>Spent · {monthKey(new Date())}</p>
              <p className="crm-num nx-display mt-1 text-2xl font-semibold" style={{ color: "var(--nx-text)" }}>
                {data ? formatBDT(data.spentMonth, true) : "–"}
              </p>
            </div>
            {data && data.budget > 0 && (
              <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--nx-muted)" }}>
                <Wallet className="h-3.5 w-3.5" />
                {Math.round((data.spentMonth / data.budget) * 100)}% of budget
              </p>
            )}
          </div>
          <div className="mt-3">
            {data && data.trend.some((t) => t.value > 0) ? (
              <AreaChart data={data.trend} height={120} valueFormat={(n) => formatBDT(n, true)} />
            ) : (
              <p className="py-6 text-center text-xs" style={{ color: "var(--nx-faint)" }}>
                {data ? "No expenses recorded yet this half-year." : " "}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
