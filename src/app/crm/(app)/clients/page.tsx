"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, UserPlus } from "lucide-react";
import { Avatar, StatusBadge, useToast } from "@/components/internal";
import { JourneyStrip } from "@/components/crm/JourneyStrip";
import { ClientSheet } from "@/components/crm/ClientSheet";
import { Sheet } from "@/components/crm/Sheet";
import { ClientService } from "@/lib/services/client.service";
import { StaffService } from "@/lib/services/staff.service";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";
import {
  DEGREE_META, STAGE_META,
  type ClientInsert, type ClientStage, type ClientWithRelations, type DegreeLevel,
} from "@/lib/types/client";
import type { Staff } from "@/lib/types/staff";

const STAGES = Object.keys(STAGE_META) as ClientStage[];

export default function ClientsPage() {
  return (
    <Suspense>
      <ClientsView />
    </Suspense>
  );
}

function ClientsView() {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  // `me` = the signed-in staff member; `staff` below is the whole roster.
  const { staff: me } = useStaffAuth();

  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<ClientStage | "all">("all");
  const [selected, setSelected] = useState<ClientWithRelations | null>(null);
  const [creating, setCreating] = useState(false);

  const deepLinkId = params.get("open");

  const load = useCallback(() => {
    return Promise.all([ClientService.listWithRelations(), StaffService.list()])
      .then(([c, s]) => {
        setClients(c);
        setStaff(s);
        return c;
      })
      .catch((err) => {
        toast({ title: "Couldn't load clients", description: err instanceof Error ? err.message : String(err), tone: "error" });
        return [] as ClientWithRelations[];
      })
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(() => {
      load().then((rows) => {
        if (deepLinkId) {
          const hit = rows.find((c) => c.id === deepLinkId);
          if (hit) setSelected(hit);
        }
      });
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (stageFilter !== "all" && c.stage !== stageFilter) return false;
      if (!q) return true;
      return [c.full_name, c.email ?? "", c.whatsapp ?? "", c.country_interest?.join(" ") ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [clients, query, stageFilter]);

  function closeSheet() {
    setSelected(null);
    if (deepLinkId) router.replace("/crm/clients");
  }

  return (
    <div className="py-5">
      {/* Search + add */}
      <div className="flex items-center gap-2 px-4 sm:px-6">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--nx-faint)" }}
          />
          <input
            className="nx-input pl-10"
            style={{ borderRadius: "999px" }}
            placeholder="Search your client book…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className="crm-press flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(160deg, var(--nx-accent-2), var(--nx-accent))",
            color: "var(--nx-accent-ink)",
            boxShadow: "0 10px 26px -12px rgba(224,146,31,0.7)",
          }}
          onClick={() => setCreating(true)}
          aria-label="Add a client"
        >
          <Plus className="h-5 w-5" strokeWidth={2.4} />
        </button>
      </div>

      {/* Stage chips */}
      <div className="crm-snap mt-3.5" style={{ gap: "0.4rem" }}>
        <button className="crm-chip crm-press" data-active={stageFilter === "all"} onClick={() => setStageFilter("all")}>
          All · {clients.length}
        </button>
        {STAGES.map((s) => {
          const count = clients.filter((c) => c.stage === s).length;
          return (
            <button key={s} className="crm-chip crm-press" data-active={stageFilter === s} onClick={() => setStageFilter(s)}>
              {STAGE_META[s].label} · {count}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="mt-4 px-4 sm:px-6">
        <div className="crm-card overflow-hidden">
          {loading && (
            <div className="space-y-2 p-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="nx-skeleton h-16 rounded-xl" />
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <UserPlus className="h-7 w-7" style={{ color: "var(--nx-faint)" }} />
              <p className="mt-3 text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                {query || stageFilter !== "all" ? "No one matches this view" : "Your client book is empty"}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--nx-faint)" }}>
                {query || stageFilter !== "all" ? "Clear the search or pick another stage." : "Add your first client to light up the runway."}
              </p>
            </div>
          )}
          {!loading &&
            filtered.map((c, i) => (
              <div
                key={c.id}
                className="crm-row"
                role="button"
                tabIndex={0}
                style={i > 0 ? { borderTop: "1px solid var(--nx-edge)", borderRadius: 0 } : { borderRadius: 0 }}
                onClick={() => setSelected(c)}
                onKeyDown={(e) => e.key === "Enter" && setSelected(c)}
              >
                <Avatar name={c.full_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>{c.full_name}</p>
                  <p className="truncate text-xs" style={{ color: "var(--nx-faint)" }}>
                    {c.country_interest?.join(", ") || "No destination"}
                    {c.consultant ? ` · ${c.consultant.full_name.split(" ")[0]}` : ""}
                  </p>
                  <JourneyStrip stage={c.stage} className="mt-1.5 max-w-[10rem]" />
                </div>
                <StatusBadge label={STAGE_META[c.stage].label} tone={STAGE_META[c.stage].tone} />
              </div>
            ))}
        </div>
        {!loading && filtered.length > 0 && (
          <p className="crm-num mt-2.5 text-center text-[0.7rem]" style={{ color: "var(--nx-faint)" }}>
            {filtered.length} of {clients.length} clients
          </p>
        )}
      </div>

      <ClientSheet client={selected} staff={staff} onClose={closeSheet} onChanged={load} />

      <NewClientSheet
        open={creating}
        staff={staff}
        addedById={me?.id ?? null}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          load();
        }}
      />
    </div>
  );
}

// --- New client -------------------------------------------------------------

function NewClientSheet({
  open, staff, addedById, onClose, onCreated,
}: {
  open: boolean;
  staff: Staff[];
  addedById: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState({
    full_name: "", whatsapp: "", email: "", countries: "", degree: "" as "" | DegreeLevel, consultant: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast({ title: "Give the client a name first", tone: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload: ClientInsert = {
        full_name: form.full_name.trim(),
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        country_interest: form.countries.split(",").map((x) => x.trim()).filter(Boolean),
        degree: form.degree || null,
        stage: "lead",
        primary_consultant_id: form.consultant || null,
        added_by_staff_id: addedById,
      };
      await ClientService.create(payload);
      toast({ title: `${payload.full_name} added as a lead`, tone: "success" });
      setForm({ full_name: "", whatsapp: "", email: "", countries: "", degree: "", consultant: "" });
      onCreated();
    } catch (err) {
      toast({ title: "Couldn't add the client", description: err instanceof Error ? err.message : String(err), tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} label="Add a client">
      <form onSubmit={submit} className="space-y-4 pt-1">
        <h3 className="nx-display text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
          Add a client
        </h3>
        <div>
          <label className="nx-label">Full name</label>
          <input className="nx-input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} autoFocus required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nx-label">WhatsApp</label>
            <input className="nx-input" inputMode="tel" placeholder="+8801…" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <div>
            <label className="nx-label">Email</label>
            <input className="nx-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="nx-label">Destination countries</label>
          <input className="nx-input" placeholder="Italy, Lithuania" value={form.countries} onChange={(e) => setForm({ ...form, countries: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="nx-label">Degree</label>
            <select className="nx-input" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value as "" | DegreeLevel })}>
              <option value="">Not sure yet</option>
              <option value="bachelors">{DEGREE_META.bachelors}</option>
              <option value="masters">{DEGREE_META.masters}</option>
            </select>
          </div>
          <div>
            <label className="nx-label">Consultant</label>
            <select className="nx-input" value={form.consultant} onChange={(e) => setForm({ ...form, consultant: e.target.value })}>
              <option value="">Assign later</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="nx-btn nx-btn-primary w-full py-3" disabled={saving}>
          {saving ? "Adding…" : "Add to the runway"}
        </button>
      </form>
    </Sheet>
  );
}
