"use client";

// =============================================================================
// ReceiptBuilder — staff issue a receipt, with a live preview of the document.
//
// TWO copies of the document are mounted, deliberately:
//   * the visible preview, scaled by CSS transform so 1000px fits the sheet
//   * an off-screen unscaled copy (ReceiptCapture) that the PDF is made from
//
// They cannot be one element. html2canvas measures geometry through
// getBoundingClientRect, which reports the SCALED box while the element's own
// styles are still at natural size — the two disagree and the output collapses
// into overlapping text. Same data, same component, different frame.
// =============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Plus, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { useToast } from "@/components/internal";
import { Sheet } from "./Sheet";
import {
  ReceiptDocument, type ReceiptLine, money,
} from "@/components/receipt/ReceiptDocument";
import { ReceiptCapture } from "@/components/receipt/ReceiptCapture";
import { ReceiptService, receiptToPdf, toMinor } from "@/lib/services/receipt.service";
import { db, type Package } from "@/lib/supabase";

const METHODS = ["bKash", "Nagad", "Rocket", "Bank Transfer", "Cash", "Card", "Other"];

interface Row {
  description: string;
  price: string;   // taka, as typed
  is_sub: boolean;
}

export function ReceiptBuilder({
  open, clientId, clientName, clientEmail, onClose, onIssued,
}: {
  open: boolean;
  clientId: string | null;
  clientName: string;
  clientEmail: string | null;
  onClose: () => void;
  onIssued: () => void;
}) {
  const toast = useToast();
  const docRef = useRef<HTMLDivElement>(null);

  const [packages, setPackages] = useState<Package[]>([]);
  const [rows, setRows] = useState<Row[]>([{ description: "", price: "", is_sub: false }]);
  const [name, setName] = useState(clientName);
  const [email, setEmail] = useState(clientEmail ?? "");
  const [issuedOn, setIssuedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("bKash");
  const [txn, setTxn] = useState("");
  const [paid, setPaid] = useState("");
  const [discount, setDiscount] = useState("");
  const [docTitle, setDocTitle] = useState("PAYMENT RECEIPT.");
  const [footer, setFooter] = useState("This receipt confirms that the above payment has been received.");
  const [packageId, setPackageId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [issuedNo, setIssuedNo] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(clientName);
    setEmail(clientEmail ?? "");
    setIssuedNo(null);
    db.packages.getAll().then(setPackages).catch(() => setPackages([]));
  }, [open, clientName, clientEmail]);

  /** Picking a package fills the first line — staff can still edit every field. */
  function applyPackage(id: string) {
    setPackageId(id);
    const p = packages.find((x) => x.id === id);
    if (!p) return;
    setRows((prev) => {
      const rest = prev.slice(1);
      return [{ description: p.title, price: String(p.price), is_sub: false }, ...rest];
    });
  }

  const items: ReceiptLine[] = useMemo(
    () =>
      rows
        .filter((r) => r.description.trim())
        .map((r) => ({
          description: r.description.trim(),
          price_minor: toMinor(r.price),
          is_sub: r.is_sub,
        })),
    [rows],
  );

  const subtotalMinor = items.filter((i) => !i.is_sub).reduce((s, i) => s + i.price_minor, 0);
  const discountMinor = toMinor(discount);
  const paidMinor = toMinor(paid);

  const preview = {
    receipt_no: issuedNo ?? "—— preview ——",
    doc_title: docTitle || "PAYMENT RECEIPT.",
    company_name: "NextUp Mentor",
    issued_to_name: name || clientName,
    issued_to_email: email || null,
    issued_on: issuedOn,
    currency: "BDT",
    items: items.length ? items : [{ description: "Add a line below", price_minor: 0, is_sub: false }],
    subtotal_minor: subtotalMinor,
    discount_minor: discountMinor,
    paid_minor: paidMinor,
    payment_method: method === "Other" ? txn || "Other" : method,
    transaction_id: txn || null,
    footer_note: footer,
  };

  const problem =
    items.length === 0
      ? "Add at least one line."
      : discountMinor > subtotalMinor
        ? "The discount is larger than the subtotal."
        : paidMinor > subtotalMinor - discountMinor
          ? "Paid is more than the total bill."
          : null;

  async function issue() {
    if (!clientId || problem) return;
    setBusy(true);
    try {
      const id = await ReceiptService.issue({
        clientId,
        items,
        paidMinor,
        discountMinor,
        paymentMethod: method,
        transactionId: txn || null,
        packageId: packageId || null,
        issuedOn,
        docTitle,
        footerNote: footer,
        nameOverride: name,
        emailOverride: email,
      });
      const full = await ReceiptService.getWithItems(id);
      setIssuedNo(full?.receipt_no ?? null);
      onIssued();
      toast({
        title: `Receipt ${full?.receipt_no ?? ""} issued`,
        description: "It is on the student's portal now.",
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't issue that receipt",
        description: err instanceof Error ? err.message : String(err),
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    if (!docRef.current) return;
    setBusy(true);
    try {
      await receiptToPdf(docRef.current, `${issuedNo ?? "receipt"}-${name.replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      toast({ title: "Couldn't build the PDF", description: err instanceof Error ? err.message : String(err), tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} label={`Receipt for ${clientName}`}>
      <div className="space-y-5 p-5">
        <div>
          <h3 className="nx-display text-lg font-semibold" style={{ color: "var(--nx-text)" }}>
            {issuedNo ? `Receipt ${issuedNo}` : "New receipt"}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--nx-muted)" }}>
            {issuedNo
              ? "Issued. Download it, or it is already waiting in their portal."
              : `For ${clientName}. Every field below is editable.`}
          </p>
        </div>

        {/* Live preview — the real document, scaled */}
        <div
          className="overflow-hidden rounded-xl"
          style={{ border: "1px solid var(--nx-edge)", background: "#fff", height: 707 * 0.36 }}
        >
          <div style={{ transform: "scale(0.36)", transformOrigin: "top left", width: 1000, height: 707 }}>
            <ReceiptDocument data={preview} />
          </div>
        </div>

        {/* Off-screen, unscaled — this is what the PDF is made from. */}
        <ReceiptCapture ref={docRef} data={preview} />

        {!issuedNo && (
          <>
            {/* Package prefill */}
            <div>
              <label className="nx-label">Package (optional — fills the first line)</label>
              <select className="nx-input" value={packageId} onChange={(e) => applyPackage(e.target.value)}>
                <option value="">Choose a package…</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — {money(p.price * 100, "BDT")}
                  </option>
                ))}
              </select>
            </div>

            {/* Lines */}
            <div>
              <label className="nx-label mb-1.5 block">Lines</label>
              <div className="space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="nx-input flex-1"
                      placeholder={r.is_sub ? "e.g. Transaction charge" : "e.g. Italy File Open-2027"}
                      value={r.description}
                      onChange={(e) =>
                        setRows((p) => p.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))
                      }
                    />
                    <input
                      className="nx-input"
                      style={{ width: "6.5rem" }}
                      inputMode="decimal"
                      placeholder="0"
                      value={r.price}
                      onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))}
                    />
                    <label
                      className="flex shrink-0 items-center gap-1 text-[0.7rem]"
                      style={{ color: "var(--nx-faint)" }}
                      title="A quieter sub-line that does not add to the subtotal"
                    >
                      <input
                        type="checkbox"
                        checked={r.is_sub}
                        onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, is_sub: e.target.checked } : x)))}
                      />
                      sub
                    </label>
                    {rows.length > 1 && (
                      <button
                        className="crm-press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ color: "var(--nx-faint)" }}
                        onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                        aria-label="Remove line"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="nx-btn nx-btn-ghost mt-2 text-xs"
                onClick={() => setRows((p) => [...p, { description: "", price: "", is_sub: false }])}
              >
                <Plus className="h-3.5 w-3.5" /> Add a line
              </button>
            </div>

            {/* Money */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Discount (BDT)">
                <input className="nx-input" inputMode="decimal" placeholder="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </Field>
              <Field label="Paid (BDT)">
                <input className="nx-input" inputMode="decimal" placeholder="0" value={paid} onChange={(e) => setPaid(e.target.value)} />
              </Field>
              <Field label="Payment method">
                <select className="nx-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Transaction ID">
                <input className="nx-input" placeholder="N/A" value={txn} onChange={(e) => setTxn(e.target.value)} />
              </Field>
              <Field label="Issued on">
                <input type="date" className="nx-input" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
              </Field>
              <Field label="Issued to">
                <input className="nx-input" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            </div>

            <Field label="Email on the receipt">
              <input className="nx-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="none" />
            </Field>

            <details>
              <summary className="cursor-pointer text-xs" style={{ color: "var(--nx-faint)" }}>
                Wording (title and footer)
              </summary>
              <div className="mt-2 space-y-2">
                <input className="nx-input" value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
                <input className="nx-input" value={footer} onChange={(e) => setFooter(e.target.value)} />
              </div>
            </details>

            {problem && (
              <p className="text-sm" role="alert" style={{ color: "var(--nx-danger)" }}>{problem}</p>
            )}

            <button className="nx-btn nx-btn-primary w-full py-3" onClick={issue} disabled={busy || !!problem}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptIcon className="h-4 w-4" />}
              Issue receipt
            </button>
          </>
        )}

        <button className="nx-btn nx-btn-ghost w-full py-3" onClick={download} disabled={busy}>
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="nx-label mb-1 block">{label}</label>
      {children}
    </div>
  );
}
