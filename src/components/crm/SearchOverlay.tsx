"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Phone, MessageSquare } from "lucide-react";
import { Avatar, StatusBadge } from "@/components/internal";
import { ClientService } from "@/lib/services/client.service";
import { STAGE_META, type ClientWithRelations } from "@/lib/types/client";
import { JourneyStrip } from "./JourneyStrip";

/**
 * Full-screen instant search across the whole client book. Loads once per
 * open, filters as you type, and every result carries call / WhatsApp
 * affordances so a counsellor can reach a student in two taps.
 */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<ClientWithRelations[] | null>(null);
  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    if (cacheRef.current) {
      const cached = cacheRef.current;
      const t = setTimeout(() => setClients(cached), 0);
      return () => {
        cancelAnimationFrame(id);
        clearTimeout(t);
      };
    }
    const t = setTimeout(() => setLoading(true), 0);
    ClientService.listWithRelations()
      .then((rows) => {
        cacheRef.current = rows;
        setClients(rows);
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.slice(0, 30);
    return clients
      .filter((c) =>
        [c.full_name, c.email ?? "", c.whatsapp ?? "", c.country_interest?.join(" ") ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
      .slice(0, 30);
  }, [clients, query]);

  function openClient(id: string) {
    onClose();
    setQuery("");
    router.push(`/crm/clients?open=${id}`);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="crm-search-overlay"
          style={{ background: "var(--nx-bg)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="flex items-center gap-2 border-b px-4"
            style={{ borderColor: "var(--nx-edge)", paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <button
              className="crm-press -ml-1 flex h-10 w-10 items-center justify-center rounded-full"
              style={{ color: "var(--nx-muted)" }}
              onClick={onClose}
              aria-label="Close search"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <input
              ref={inputRef}
              className="crm-search-input"
              placeholder="Search by name, phone, email, country…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2" style={{ overscrollBehavior: "contain" }}>
            {loading && (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="nx-skeleton h-14 rounded-xl" />
                ))}
              </div>
            )}
            {!loading && results.length === 0 && (
              <p className="px-3 py-10 text-center text-sm" style={{ color: "var(--nx-faint)" }}>
                {query ? `No one matches “${query}”. Try a shorter fragment.` : "Your client book is empty."}
              </p>
            )}
            {!loading &&
              results.map((c) => (
                <div key={c.id} className="crm-row" role="button" tabIndex={0}
                  onClick={() => openClient(c.id)}
                  onKeyDown={(e) => e.key === "Enter" && openClient(c.id)}
                >
                  <Avatar name={c.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--nx-text)" }}>
                      {c.full_name}
                    </p>
                    <JourneyStrip stage={c.stage} className="mt-1.5 max-w-[9rem]" />
                  </div>
                  <StatusBadge label={STAGE_META[c.stage].label} tone={STAGE_META[c.stage].tone} />
                  <span className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                    {c.whatsapp && (
                      <>
                        <a
                          href={`tel:${c.whatsapp}`}
                          className="crm-press flex h-9 w-9 items-center justify-center rounded-full"
                          style={{ background: "var(--nx-panel-2)", color: "var(--nx-muted)", border: "1px solid var(--nx-edge)" }}
                          aria-label={`Call ${c.full_name}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={`https://wa.me/${c.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="crm-press flex h-9 w-9 items-center justify-center rounded-full"
                          style={{ background: "var(--nx-positive-soft)", color: "var(--nx-positive)", border: "1px solid rgba(70,177,125,0.3)" }}
                          aria-label={`WhatsApp ${c.full_name}`}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </a>
                      </>
                    )}
                  </span>
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
