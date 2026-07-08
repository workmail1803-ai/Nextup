"use client";

import { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, LoaderCircle, Mail, MessageCircle, Plus, Table2, Users } from "lucide-react";
import {
  AppShell, DataTable, StatusBadge, EmptyState, type NavItem, type Column,
} from "@/components/internal";
import { useStaffSession } from "@/lib/hooks/useStaffSession";
import { ClientService } from "@/lib/services/client.service";
import type { ClientWithRelations } from "@/lib/types/client";
import { STAGE_META, DEGREE_META } from "@/lib/types/client";
import { StaffClientDetail } from "./_components/StaffClientDetail";
import { AddClientModal } from "./_components/AddClientModal";

const NAV: NavItem[] = [
  { href: "/staff_portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff_portal/clients", label: "Clients", icon: Users },
];

function latestMeeting(c: ClientWithRelations): string | null {
  const dates = (c.client_meetings ?? []).map((m) => m.scheduled_at).filter(Boolean) as string[];
  return dates.length ? (dates.sort().at(-1) ?? null) : null;
}
function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "—";
}

export default function StaffClientsPage() {
  const { session, loading: sessLoading, signOut } = useStaffSession({ redirectTo: "/staff_portal" });
  const staffId = session?.staffId;

  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ClientWithRelations | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!staffId) return;
    try {
      setClients(await ClientService.listForConsultant(staffId));
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    if (!staffId) return;
    fetchClients();
    const unsub = ClientService.subscribe(fetchClients);
    return unsub;
  }, [staffId, fetchClients]);

  if (sessLoading || !session) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  const columns: Column<ClientWithRelations>[] = [
    {
      key: "name",
      header: "Client",
      sortable: true,
      accessor: (c) => c.full_name,
      render: (c) => (
        <div>
          <p className="font-medium" style={{ color: "var(--nx-text)" }}>{c.full_name}</p>
          <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: "var(--nx-faint)" }}>
            {c.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
            {c.whatsapp && <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{c.whatsapp}</span>}
            {!c.email && !c.whatsapp && "—"}
          </div>
        </div>
      ),
    },
    {
      key: "country",
      header: "Country",
      render: (c) =>
        c.country_interest.length ? (
          <div className="flex flex-wrap gap-1">
            {c.country_interest.map((co) => (
              <span key={co} className="rounded-md px-1.5 py-0.5 text-xs" style={{ background: "var(--nx-panel-2)", color: "var(--nx-muted)" }}>{co}</span>
            ))}
          </div>
        ) : <span style={{ color: "var(--nx-faint)" }}>—</span>,
    },
    { key: "degree", header: "Degree", render: (c) => c.degree ? DEGREE_META[c.degree] : "—" },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      accessor: (c) => c.stage,
      render: (c) => <StatusBadge label={STAGE_META[c.stage].label} tone={STAGE_META[c.stage].tone} />,
    },
    {
      key: "meeting",
      header: "Latest meeting",
      sortable: true,
      accessor: (c) => latestMeeting(c) ?? "",
      render: (c) => <span style={{ color: "var(--nx-muted)" }}>{fmtDate(latestMeeting(c))}</span>,
    },
  ];

  return (
    <AppShell
      portalLabel="Staff Portal"
      nav={NAV}
      user={{ name: session.fullName, subtitle: session.title ?? "Staff", avatarUrl: session.avatarUrl }}
      onSignOut={signOut}
      title="My clients"
      subtitle="Clients assigned to you as consultant"
      actions={
        <button
          className="nx-btn nx-btn-primary"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-4 w-4" /> Add client
        </button>
      }
    >
      <DataTable
        columns={columns}
        rows={clients}
        getRowId={(c) => c.id}
        loading={loading}
        onRowClick={setDetail}
        searchPlaceholder="Search your clients…"
        searchAccessor={(c) =>
          `${c.full_name} ${c.email ?? ""} ${c.whatsapp ?? ""} ${c.country_interest.join(" ")}`
        }
        initialSort={{ key: "name", dir: "asc" }}
        empty={
          <EmptyState
            icon={Table2}
            title="No clients assigned to you yet"
            description="When an admin assigns you as a client's consultant, they'll appear here."
          />
        }
      />

      {detail && (
        <StaffClientDetail
          client={detail}
          currentStaffId={staffId}
          onClose={() => setDetail(null)}
          onChanged={fetchClients}
        />
      )}

      <AddClientModal
        open={showAdd}
        staffId={staffId!}
        onClose={() => setShowAdd(false)}
        onCreated={fetchClients}
      />
    </AppShell>
  );
}
