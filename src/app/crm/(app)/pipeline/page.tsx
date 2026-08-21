"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, useToast } from "@/components/internal";
import { JourneyStrip } from "@/components/crm/JourneyStrip";
import { ClientSheet } from "@/components/crm/ClientSheet";
import { ClientService } from "@/lib/services/client.service";
import { StaffService } from "@/lib/services/staff.service";
import { STAGE_META, type ClientStage, type ClientWithRelations } from "@/lib/types/client";
import type { Staff } from "@/lib/types/staff";

const STAGE_ORDER: ClientStage[] = ["lead", "meeting", "file_open", "offer", "visa", "enrolled", "closed"];

const TONE_VAR: Record<string, string> = {
  neutral: "var(--nx-faint)",
  info: "var(--nx-info)",
  accent: "var(--nx-accent-2)",
  warning: "var(--nx-warning)",
  positive: "var(--nx-positive)",
  danger: "var(--nx-danger)",
};

export default function PipelinePage() {
  const toast = useToast();
  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ClientWithRelations | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<ClientStage | null>(null);
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(() => {
    Promise.all([ClientService.listWithRelations(), StaffService.list()])
      .then(([c, s]) => {
        setClients(c);
        setStaff(s);
        setLoadedAt(Date.now());
      })
      .catch((err) =>
        toast({ title: "Couldn't load the pipeline", description: err instanceof Error ? err.message : String(err), tone: "error" }),
      )
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  const byStage = useMemo(() => {
    const map = new Map<ClientStage, ClientWithRelations[]>(STAGE_ORDER.map((s) => [s, []]));
    for (const c of clients) map.get(c.stage)?.push(c);
    return map;
  }, [clients]);

  async function moveTo(clientId: string, next: ClientStage) {
    const client = clients.find((c) => c.id === clientId);
    if (!client || client.stage === next) return;
    const prevStage = client.stage;
    // Optimistic: the card lands instantly; roll back if the server disagrees.
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, stage: next } : c)));
    try {
      await ClientService.update(clientId, { stage: next });
      toast({ title: `${client.full_name} → ${STAGE_META[next].label}`, tone: "success" });
    } catch (err) {
      setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, stage: prevStage } : c)));
      toast({ title: "Couldn't move the card", description: err instanceof Error ? err.message : String(err), tone: "error" });
    }
  }

  return (
    <div className="py-5">
      <div className="mb-4 px-4 sm:px-6">
        <p className="text-sm" style={{ color: "var(--nx-muted)" }}>
          <span className="crm-num font-semibold" style={{ color: "var(--nx-text)" }}>{clients.length}</span>{" "}
          students across the journey. Drag a card, or tap it to work the file.
        </p>
      </div>

      <div className="crm-snap items-start pb-4">
        {STAGE_ORDER.map((stage) => {
          const cards = byStage.get(stage) ?? [];
          const tone = TONE_VAR[STAGE_META[stage].tone];
          return (
            <section
              key={stage}
              className="crm-col"
              data-over={overStage === stage && dragId !== null}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                setOverStage(null);
                setDragId(null);
                if (id) moveTo(id, stage);
              }}
              aria-label={`${STAGE_META[stage].label} column`}
            >
              <header className="flex items-center gap-2 px-3.5 py-3">
                <span className="h-2 w-2 rounded-full" style={{ background: tone }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
                  {STAGE_META[stage].label}
                </h3>
                <span
                  className="crm-num ml-auto rounded-full px-2 py-0.5 text-[0.68rem] font-bold"
                  style={{ background: "var(--nx-panel-2)", color: "var(--nx-muted)", border: "1px solid var(--nx-edge)" }}
                >
                  {cards.length}
                </span>
              </header>

              <div className="crm-col-body">
                {loading &&
                  Array.from({ length: 3 }).map((_, i) => <div key={i} className="nx-skeleton h-[4.6rem] rounded-xl" />)}
                {!loading && cards.length === 0 && (
                  <p className="px-2 py-6 text-center text-xs" style={{ color: "var(--nx-faint)" }}>
                    {stage === "lead" ? "No new leads — add one from Clients." : "Nothing here right now."}
                  </p>
                )}
                {!loading &&
                  cards.map((c) => {
                    const days = loadedAt ? Math.floor((loadedAt - new Date(c.updated_at).getTime()) / 86_400_000) : 0;
                    return (
                      <div
                        key={c.id}
                        className="crm-card crm-press cursor-pointer p-3"
                        style={dragId === c.id ? { opacity: 0.4 } : undefined}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", c.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragId(c.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverStage(null);
                        }}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelected(c)}
                        onKeyDown={(e) => e.key === "Enter" && setSelected(c)}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={c.full_name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                              {c.full_name}
                            </p>
                            <p className="truncate text-[0.7rem]" style={{ color: "var(--nx-faint)" }}>
                              {c.country_interest?.join(", ") || "No destination"}
                              {c.consultant ? ` · ${c.consultant.full_name.split(" ")[0]}` : ""}
                            </p>
                          </div>
                          {days > 7 && !["enrolled", "closed"].includes(c.stage) && (
                            <span className="crm-num shrink-0 text-[0.66rem] font-bold" style={{ color: "var(--nx-warning)" }}>
                              {days}d
                            </span>
                          )}
                        </div>
                        <JourneyStrip stage={c.stage} className="mt-2.5" />
                      </div>
                    );
                  })}
              </div>
            </section>
          );
        })}
      </div>

      <ClientSheet client={selected} onClose={() => setSelected(null)} onChanged={load} />
    </div>
  );
}
