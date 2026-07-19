"use client";

import { useRef, useState } from "react";
import {
  AlertCircle, Check, CircleDashed, FileCheck2, Minus, Upload, FileText,
  Loader2, RotateCcw, ExternalLink,
} from "lucide-react";
import { usePortal, type VisaDoc } from "@/lib/portal/PortalContext";
import { VisaService } from "@/lib/services/visa.service";
import { portalSupabase } from "@/lib/portal/supabase-portal";
import { supabase } from "@/lib/supabase";

/** Student-facing framing of each document state — supportive, never clinical. */
const DOC_UI: Record<VisaDoc["status"], { label: string; color: string; bg: string; Icon: typeof Check }> = {
  pending: { label: "Waiting on you", color: "var(--nx-warning)", bg: "var(--nx-warning-soft)", Icon: AlertCircle },
  received: { label: "Received", color: "var(--nx-info)", bg: "var(--nx-info-soft)", Icon: CircleDashed },
  verified: { label: "Approved", color: "var(--nx-positive)", bg: "var(--nx-positive-soft)", Icon: Check },
  na: { label: "Not needed", color: "var(--nx-faint)", bg: "var(--nx-panel-2)", Icon: Minus },
};

const VISA_COPY: Record<string, string> = {
  not_started: "Your visa file hasn't started yet.",
  collecting: "We're collecting your documents.",
  ready: "Your file is ready to submit.",
  submitted: "Your file is with the embassy.",
  approved: "Your visa is approved 🎉",
  rejected: "There's an update on your visa — your consultant will guide you.",
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export default function PortalDocuments() {
  const { visa, client, preview, refresh } = usePortal();

  if (!visa) {
    return (
      <div className="px-4 py-5 sm:px-6">
        <div className="crm-card flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}>
            <FileCheck2 className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <p className="mt-4 text-sm font-semibold" style={{ color: "var(--nx-text)" }}>Your checklist isn&apos;t open yet</p>
          <p className="mt-1.5 max-w-xs text-sm" style={{ color: "var(--nx-faint)" }}>
            Once your consultant opens your visa file, every document you need will appear right here.
          </p>
        </div>
      </div>
    );
  }

  const total = visa.documents.length;
  const approved = visa.documents.filter((d) => d.status === "verified").length;
  const pending = visa.documents.filter((d) => d.status === "pending");
  const rest = visa.documents.filter((d) => d.status !== "pending");
  const pct = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="space-y-4 px-4 py-5 sm:px-6">
      {/* Progress */}
      <section className="crm-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: "var(--nx-faint)" }}>Visa file</p>
            <p className="nx-display mt-1 text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
              {VISA_COPY[visa.status] ?? "In progress"}
            </p>
          </div>
          <span className="crm-num text-2xl font-semibold" style={{ color: "var(--nx-accent-2)" }}>{pct}%</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--nx-panel-2)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--nx-accent), var(--nx-accent-2))" }} />
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--nx-faint)" }}>
          {approved} of {total} documents approved
          {visa.vfs_appointment_date ? ` · appointment ${new Date(visa.vfs_appointment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
        </p>
      </section>

      {pending.length > 0 && (
        <section>
          <h3 className="crm-section-title mb-2 px-1">Needs your attention</h3>
          <div className="crm-card overflow-hidden">
            {pending.map((d, i) => (
              <DocRow key={d.id} doc={d} first={i === 0} clientId={client?.id ?? ""} preview={preview} onUploaded={refresh} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="crm-section-title mb-2 px-1">{pending.length > 0 ? "Everything else" : "Your documents"}</h3>
        <div className="crm-card overflow-hidden">
          {rest.length === 0 && (
            <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--nx-faint)" }}>Nothing here yet.</p>
          )}
          {rest.map((d, i) => (
            <DocRow key={d.id} doc={d} first={i === 0} clientId={client?.id ?? ""} preview={preview} onUploaded={refresh} />
          ))}
        </div>
      </section>

      <p className="px-1 text-center text-xs" style={{ color: "var(--nx-faint)" }}>
        Upload your documents here or send them to your consultant on WhatsApp.
      </p>
    </div>
  );
}

function DocRow({
  doc, first, clientId, preview, onUploaded,
}: {
  doc: VisaDoc;
  first: boolean;
  clientId: string;
  preview: boolean;
  onUploaded: () => void;
}) {
  const ui = DOC_UI[doc.status];
  const { Icon } = ui;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  const hasFile = !!doc.file_url;
  const canUpload = doc.status === "pending" || doc.status === "received";
  // Use anon client in preview mode (no auth session), portal client otherwise
  const sb = preview ? supabase : portalSupabase;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError("File must be under 10 MB.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      await VisaService.uploadDocumentFile(sb, clientId, doc.id, file, doc.status);
      onUploaded(); // refresh the context
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleView() {
    if (!doc.file_url) return;
    setLoadingView(true);
    try {
      const url = await VisaService.getSignedUrl(sb, doc.file_url, 3600);
      setViewUrl(url);
      window.open(url, "_blank");
    } catch {
      setError("Couldn't load the file. Try again.");
    } finally {
      setLoadingView(false);
    }
  }

  return (
    <div
      className="px-4 py-3"
      style={first ? undefined : { borderTop: "1px solid var(--nx-edge)" }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: ui.bg, color: ui.color }}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm" style={{ color: "var(--nx-text)" }}>{doc.document_name}</p>
          {hasFile && (
            <button
              className="mt-0.5 flex items-center gap-1 text-[0.7rem] font-medium"
              style={{ color: "var(--nx-accent-2)" }}
              onClick={handleView}
              disabled={loadingView}
            >
              {loadingView ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
              View uploaded file
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Status label */}
          <span className="shrink-0 text-xs font-semibold" style={{ color: ui.color }}>{ui.label}</span>

          {/* Upload / Replace button */}
          {canUpload && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={handleFile}
                aria-label={`Upload ${doc.document_name}`}
              />
              <button
                className="crm-press flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
                style={{
                  background: hasFile ? "var(--nx-panel-2)" : "var(--nx-accent-soft)",
                  color: hasFile ? "var(--nx-muted)" : "var(--nx-accent-2)",
                }}
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : hasFile ? (
                  <RotateCcw className="h-3.5 w-3.5" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {uploading ? "Uploading…" : hasFile ? "Replace" : "Upload"}
              </button>
            </>
          )}

          {/* File indicator for verified docs */}
          {!canUpload && hasFile && (
            <button
              className="crm-press flex h-8 items-center gap-1 rounded-lg px-2 text-xs"
              style={{ background: "var(--nx-panel-2)", color: "var(--nx-muted)" }}
              onClick={handleView}
              disabled={loadingView}
            >
              <FileText className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs" style={{ color: "var(--nx-danger)" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
