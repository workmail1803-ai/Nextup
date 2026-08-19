"use client";

import { useRef, useState } from "react";
import { ExternalLink, Loader2, RotateCcw, Upload } from "lucide-react";
import { usePortal, type VisaDoc } from "@/lib/portal/PortalContext";
import { VisaService } from "@/lib/services/visa.service";
import { portalSupabase } from "@/lib/portal/supabase-portal";
import { staffSupabase } from "@/lib/auth/supabase-staff";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const MAX_SIZE = 10 * 1024 * 1024; // matches the bucket's own limit

/** Student-facing status. Says who holds it, not what the database calls it. */
const DOC_UI: Record<VisaDoc["status"], { label: string; tone: string }> = {
  pending: { label: "Send this", tone: "await" },
  received: { label: "With us", tone: "mute" },
  verified: { label: "Approved", tone: "approved" },
  na: { label: "Not needed", tone: "mute" },
};

const VISA_COPY: Record<string, string> = {
  not_started: "Your visa file hasn't been opened yet.",
  collecting: "Collecting your paperwork.",
  ready: "Complete and ready to lodge.",
  submitted: "Lodged with the embassy.",
  approved: "Approved.",
  rejected: "There's an update on your visa — your consultant will walk you through it.",
};

export default function PortalDocuments() {
  const { visa, client, preview, refresh } = usePortal();

  if (!visa) {
    return (
      <div className="px-5 pt-7">
        <p className="pf-label">Papers</p>
        <h1 className="pf-display mt-2.5 text-[1.75rem]">Your checklist opens with your file.</h1>
        <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
          Once your consultant opens the visa file, every document the embassy asks for will be
          listed here — with a clear note on which ones are yours to send.
        </p>
      </div>
    );
  }

  const docs = visa.documents;
  const approved = docs.filter((d) => d.status === "verified").length;
  const counted = docs.filter((d) => d.status !== "na").length;
  const yours = docs.filter((d) => d.status === "pending");
  const ours = docs.filter((d) => d.status !== "pending");

  return (
    <div className="px-5 pb-8 pt-7">
      <section>
        <p className="pf-label">Papers</p>
        <h1 className="pf-display mt-2.5 text-[1.9rem]">
          {yours.length === 0
            ? "Nothing outstanding from you."
            : `${yours.length} ${yours.length === 1 ? "document" : "documents"} to send.`}
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
          {VISA_COPY[visa.status] ?? "In progress."}{" "}
          <span className="pf-mono text-[0.8125rem]">
            {approved}/{counted} approved
          </span>
        </p>
      </section>

      {yours.length > 0 && (
        <section className="mt-7">
          <p className="pf-label mb-2.5">Waiting on you</p>
          <div className="pf-panel overflow-hidden">
            {yours.map((d) => (
              <DocRow key={d.id} doc={d} clientId={client?.id ?? ""} preview={preview} onUploaded={refresh} showStatus={false} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <p className="pf-label mb-2.5">{yours.length > 0 ? "Everything else" : "The full list"}</p>
        <div className="pf-panel overflow-hidden">
          {ours.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--pf-vellum-3)" }}>
              Nothing filed yet.
            </p>
          ) : (
            ours.map((d) => (
              <DocRow key={d.id} doc={d} clientId={client?.id ?? ""} preview={preview} onUploaded={refresh} />
            ))
          )}
        </div>
      </section>

      <p className="mt-6 text-center text-xs" style={{ color: "var(--pf-vellum-3)" }}>
        A clear phone photo is fine — it does not need to be a scan.
      </p>
    </div>
  );
}

function DocRow({
  doc, clientId, preview, onUploaded, showStatus = true,
}: {
  doc: VisaDoc;
  clientId: string;
  preview: boolean;
  onUploaded: () => void;
  /** Suppressed inside "Waiting on you" — the group heading and the Send button
   *  already say it, and a third copy is noise on the screen a student scans. */
  showStatus?: boolean;
}) {
  const ui = DOC_UI[doc.status];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  const hasFile = !!doc.file_url;
  const canUpload = doc.status === "pending" || doc.status === "received";
  // Preview is a staff capability (a consultant looking at a student's file), so
  // it uses the staff session. It used the anon client until migration 0012 took
  // anon off these tables entirely.
  const sb = preview ? staffSupabase : portalSupabase;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError("That file is over 10 MB. Try a photo instead of a scan.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await VisaService.uploadDocumentFile(sb, clientId, doc.id, file, doc.status);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't upload. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleView() {
    if (!doc.file_url) return;
    setLoadingView(true);
    try {
      const url = await VisaService.getSignedUrl(sb, doc.file_url, 3600);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Couldn't open that file. Try again.");
    } finally {
      setLoadingView(false);
    }
  }

  return (
    <div className="pf-record flex-col items-stretch !gap-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.875rem] leading-snug">{doc.document_name}</p>
          <div className="mt-1 flex items-center gap-2.5">
            {showStatus && (
              <span className="pf-status" data-tone={ui.tone}>
                {ui.label}
              </span>
            )}
            {hasFile && (
              <button
                className="pf-mono inline-flex items-center gap-1 text-[0.6875rem]"
                style={{ color: "var(--pf-vellum-3)" }}
                onClick={handleView}
                disabled={loadingView}
              >
                {loadingView ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                view
              </button>
            )}
          </div>
        </div>

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
              className={`pf-btn pf-press ${hasFile ? "pf-btn-quiet" : "pf-btn-seal"}`}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending
                </>
              ) : hasFile ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" /> Replace
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Send
                </>
              )}
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs" role="alert" style={{ color: "var(--pf-halt)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
