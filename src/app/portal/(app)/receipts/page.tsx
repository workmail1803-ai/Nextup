"use client";

// =============================================================================
// /portal/receipts — the student's own copy of every receipt issued to them.
//
// Read-only by design. A receipt the recipient can edit is not evidence of
// anything, so RLS gives students SELECT and nothing else (migration 0024).
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Receipt as ReceiptIcon } from "lucide-react";
import { portalSupabase } from "@/lib/portal/supabase-portal";
import { staffSupabase } from "@/lib/auth/supabase-staff";
import { usePortal } from "@/lib/portal/PortalContext";
import {
  ReceiptDocument, money, formatIssued, type ReceiptLine,
} from "@/components/receipt/ReceiptDocument";
import { ReceiptCapture } from "@/components/receipt/ReceiptCapture";

interface Row {
  id: string;
  receipt_no: string;
  doc_title: string;
  company_name: string;
  issued_to_name: string;
  issued_to_email: string | null;
  issued_on: string;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  paid_minor: number;
  total_minor: number;
  due_minor: number;
  payment_method: string | null;
  transaction_id: string | null;
  footer_note: string;
  items?: ReceiptLine[];
}

export default function PortalReceipts() {
  const { client, preview } = usePortal();
  const sb = preview ? staffSupabase : portalSupabase;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!client?.id) return;
    const { data } = await sb
      .from("receipts_with_totals")
      .select("*")
      .eq("client_id", client.id)
      .order("issued_on", { ascending: false });
    const list = (data as Row[]) ?? [];

    if (list.length) {
      const { data: items } = await sb
        .from("receipt_items")
        .select("receipt_id, description, price_minor, is_sub")
        .in("receipt_id", list.map((r) => r.id))
        .order("sort_order");
      const byReceipt = new Map<string, ReceiptLine[]>();
      for (const it of (items ?? []) as (ReceiptLine & { receipt_id: string })[]) {
        const arr = byReceipt.get(it.receipt_id) ?? [];
        arr.push({ description: it.description, price_minor: it.price_minor, is_sub: it.is_sub });
        byReceipt.set(it.receipt_id, arr);
      }
      list.forEach((r) => (r.items = byReceipt.get(r.id) ?? []));
    }
    setRows(list);
    setLoading(false);
  }, [client?.id, sb]);

  useEffect(() => {
    const t = setTimeout(() => {
      load().catch(() => setLoading(false));
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const open = rows.find((r) => r.id === openId) ?? null;

  async function download() {
    if (!docRef.current || !open) return;
    setBusy(true);
    try {
      const { receiptToPdf } = await import("@/lib/services/receipt.service");
      await receiptToPdf(docRef.current, `${open.receipt_no}.pdf`);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--pf-vellum-3)" }} />
      </div>
    );
  }

  return (
    <div className="px-5 pb-8 pt-7">
      <section>
        <p className="pf-label">Receipts</p>
        <h1 className="pf-display mt-2.5 text-[1.9rem]">
          {rows.length === 0 ? "Nothing yet." : rows.length === 1 ? "One receipt." : `${rows.length} receipts.`}
        </h1>
        <p className="mt-3 max-w-[46ch] text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
          {rows.length === 0
            ? "Every payment you make to NextUp gets a receipt here, the moment it is recorded."
            : "Every payment recorded against your file. Tap one to see it or save a PDF."}
        </p>
      </section>

      {rows.length > 0 && (
        <section className="mt-7">
          <div className="pf-panel overflow-hidden">
            {rows.map((r) => (
              <button
                key={r.id}
                className="pf-record w-full text-left"
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
              >
                <span className="pf-mono w-[6.5rem] shrink-0 text-[0.72rem]" style={{ color: "var(--pf-vellum-2)" }}>
                  {r.receipt_no}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.875rem]">{formatIssued(r.issued_on)}</span>
                  <span className="pf-mono block text-[0.68rem]" style={{ color: "var(--pf-vellum-3)" }}>
                    paid {money(r.paid_minor, r.currency)}
                  </span>
                </span>
                <span className="pf-status" data-tone={r.due_minor === 0 ? "approved" : "await"}>
                  {r.due_minor === 0 ? "Settled" : `${money(r.due_minor, r.currency)} due`}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {open && (
        <section className="mt-6">
          {/* The real document, scaled to the phone. Same element the PDF uses. */}
          <div
            className="overflow-x-auto rounded-xl"
            style={{ border: "1px solid var(--pf-rule)", background: "#fff" }}
          >
            <div style={{ width: 1000, transform: "scale(0.33)", transformOrigin: "top left", height: 707 * 0.33 }}>
              <ReceiptDocument
                data={{
                  receipt_no: open.receipt_no,
                  doc_title: open.doc_title,
                  company_name: open.company_name,
                  issued_to_name: open.issued_to_name,
                  issued_to_email: open.issued_to_email,
                  issued_on: open.issued_on,
                  currency: open.currency,
                  items: open.items ?? [],
                  subtotal_minor: open.subtotal_minor,
                  discount_minor: open.discount_minor,
                  paid_minor: open.paid_minor,
                  payment_method: open.payment_method,
                  transaction_id: open.transaction_id,
                  footer_note: open.footer_note,
                }}
              />
            </div>
          </div>
          {/* Off-screen, unscaled — this is what the PDF is made from. */}
          <ReceiptCapture
            ref={docRef}
            data={{
              receipt_no: open.receipt_no,
              doc_title: open.doc_title,
              company_name: open.company_name,
              issued_to_name: open.issued_to_name,
              issued_to_email: open.issued_to_email,
              issued_on: open.issued_on,
              currency: open.currency,
              items: open.items ?? [],
              subtotal_minor: open.subtotal_minor,
              discount_minor: open.discount_minor,
              paid_minor: open.paid_minor,
              payment_method: open.payment_method,
              transaction_id: open.transaction_id,
              footer_note: open.footer_note,
            }}
          />
          <button className="pf-btn pf-btn-seal pf-press mt-3 w-full py-3" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Save as PDF
          </button>
        </section>
      )}

      {rows.length === 0 && (
        <div className="pf-panel mt-7 flex flex-col items-center px-6 py-12 text-center">
          <ReceiptIcon className="h-6 w-6" style={{ color: "var(--pf-vellum-3)" }} />
          <p className="mt-3 text-sm" style={{ color: "var(--pf-vellum-2)" }}>
            Nothing has been billed to you yet.
          </p>
        </div>
      )}
    </div>
  );
}
