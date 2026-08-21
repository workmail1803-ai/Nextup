// =============================================================================
// ReceiptService — issuing and reading receipts.
//
// All money crosses this boundary in MINOR UNITS (poisha). The UI works in
// taka because that is what a person types; the conversion happens here, once,
// so no other module has to remember which unit it is holding.
// =============================================================================

import { staffSupabase as supabase } from "@/lib/auth/supabase-staff";
import type { ReceiptLine } from "@/components/receipt/ReceiptDocument";

export interface Receipt {
  id: string;
  client_id: string;
  receipt_no: string;
  issued_to_name: string;
  issued_to_email: string | null;
  company_name: string;
  doc_title: string;
  footer_note: string;
  issued_on: string;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  paid_minor: number;
  total_minor: number;
  due_minor: number;
  payment_method: string | null;
  transaction_id: string | null;
  package_id: string | null;
  issued_by_staff_id: string | null;
  emailed_at: string | null;
  created_at: string;
}

export interface ReceiptWithItems extends Receipt {
  items: ReceiptLine[];
}

/** Taka the staff member typed -> poisha the database stores. */
export function toMinor(major: string | number): number {
  const n = typeof major === "number" ? major : parseFloat(major || "0");
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function toMajor(minor: number): number {
  return Math.round(minor) / 100;
}

export const ReceiptService = {
  async listForClient(clientId: string): Promise<Receipt[]> {
    const { data, error } = await supabase
      .from("receipts_with_totals")
      .select("*")
      .eq("client_id", clientId)
      .order("issued_on", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Receipt[];
  },

  async getWithItems(receiptId: string): Promise<ReceiptWithItems | null> {
    const [{ data: r, error: rErr }, { data: items, error: iErr }] = await Promise.all([
      supabase.from("receipts_with_totals").select("*").eq("id", receiptId).maybeSingle(),
      supabase
        .from("receipt_items")
        .select("description, price_minor, is_sub")
        .eq("receipt_id", receiptId)
        .order("sort_order"),
    ]);
    if (rErr) throw rErr;
    if (iErr) throw iErr;
    if (!r) return null;
    return { ...(r as Receipt), items: (items ?? []) as ReceiptLine[] };
  },

  /**
   * Issue one. The number, the line items and the student's notification are
   * created together inside staff_issue_receipt() — a receipt with no lines, or
   * a notification pointing at nothing, would both be worse than a failure.
   */
  async issue(input: {
    clientId: string;
    items: ReceiptLine[];
    paidMinor: number;
    discountMinor: number;
    paymentMethod?: string | null;
    transactionId?: string | null;
    packageId?: string | null;
    issuedOn?: string | null;
    docTitle?: string | null;
    footerNote?: string | null;
    currency?: string;
    nameOverride?: string | null;
    emailOverride?: string | null;
    notify?: boolean;
  }): Promise<string> {
    const { data, error } = await supabase.rpc("staff_issue_receipt", {
      p_client_id: input.clientId,
      p_items: input.items,
      p_paid_minor: input.paidMinor,
      p_discount_minor: input.discountMinor,
      p_payment_method: input.paymentMethod ?? null,
      p_transaction_id: input.transactionId ?? null,
      p_package_id: input.packageId ?? null,
      p_issued_on: input.issuedOn ?? null,
      p_doc_title: input.docTitle ?? null,
      p_footer_note: input.footerNote ?? null,
      p_currency: input.currency ?? "BDT",
      p_name_override: input.nameOverride ?? null,
      p_email_override: input.emailOverride ?? null,
      p_notify: input.notify ?? true,
    });
    if (error) throw error;
    return data as string;
  },

  /** A free-text note into the student's notification list. */
  async notifyClient(clientId: string, title: string, body?: string, link?: string): Promise<void> {
    const { error } = await supabase.rpc("staff_notify_client", {
      p_client_id: clientId,
      p_title: title,
      p_body: body ?? null,
      p_link: link ?? null,
    });
    if (error) throw error;
  },
};

/**
 * Rasterise the receipt and hand it back as a PDF blob.
 *
 * Imported lazily: html2canvas and jspdf together are a large dependency, and
 * most people opening the CRM never issue a receipt. Loading them on demand
 * keeps that weight off every other page.
 */
export async function receiptToPdf(node: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // scale 2 keeps the type crisp when the PDF is opened at full size or printed.
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const img = canvas.toDataURL("image/png");

  // Landscape, sized to the document rather than a paper standard, so nothing
  // is cropped or letterboxed.
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1000, 707] });
  pdf.addImage(img, "PNG", 0, 0, 1000, 707);
  pdf.save(filename);
}
