"use client";

// =============================================================================
// ReceiptDocument — the printed artefact, ported from the HTML model.
//
// Fixed 1000x707 and scaled by its container rather than made responsive: this
// is a document, not a page. It has to look identical in the CRM preview, in
// the student's portal, in the emailed copy and on paper, and the only way to
// guarantee that is one fixed canvas that never reflows.
//
// Styles are inline for the same reason. html2canvas rasterises computed style,
// and a Tailwind class that resolves differently in one surface would produce a
// PDF that does not match the preview.
// =============================================================================

import { forwardRef } from "react";

export interface ReceiptLine {
  description: string;
  price_minor: number;
  is_sub: boolean;
}

export interface ReceiptData {
  receipt_no: string;
  doc_title: string;
  company_name: string;
  issued_to_name: string;
  issued_to_email: string | null;
  issued_on: string;
  currency: string;
  items: ReceiptLine[];
  subtotal_minor: number;
  discount_minor: number;
  paid_minor: number;
  payment_method: string | null;
  transaction_id: string | null;
  footer_note: string;
}

const NAVY = "#0f1e4b";
const INK = "#111827";
const MUTED = "#8a94a6";
const LINE = "#e5e8ee";
const PAID_GREEN = "#1a7f37";

/** Minor units in, human money out. 500000 -> "5,000 BDT". */
export function money(minor: number, currency: string): string {
  const major = Math.round(minor) / 100;
  return `${major.toLocaleString("en-US", {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export function formatIssued(d: string): string {
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export const ReceiptDocument = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  function ReceiptDocument({ data }, ref) {
    const total = data.subtotal_minor - data.discount_minor;
    const due = Math.max(total - data.paid_minor, 0);
    const settled = due === 0;

    return (
      <div
        ref={ref}
        style={{
          width: 1000, height: 707, background: "#fff", position: "relative",
          overflow: "hidden", display: "flex", flexDirection: "column",
          fontFamily: "var(--font-inter), Inter, sans-serif", color: INK,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/receipt/watermark.png"
          alt=""
          style={{
            position: "absolute", top: "50%", left: "50%", width: 640,
            transform: "translate(-50%,-50%) rotate(-18deg)",
            opacity: 0.05, zIndex: 0, pointerEvents: "none", filter: "grayscale(100%)",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, padding: "46px 56px", display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <h1 style={{ fontWeight: 800, fontSize: 36, letterSpacing: "0.02em", color: NAVY, margin: 0, textTransform: "uppercase" }}>
              {data.doc_title}
            </h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/receipt/logo.png" alt="NextUp Mentor" style={{ height: 64, width: "auto" }} />
          </div>

          {/* Who / what */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 34, gap: 24 }}>
            <div>
              <div style={label}>Issued To</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: INK }}>{data.issued_to_name}</div>
              {data.issued_to_email && (
                <div style={{ fontSize: 14, color: MUTED, marginTop: 2 }}>{data.issued_to_email}</div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: NAVY }}>{data.company_name}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: INK, marginTop: 8 }}>
                Receipt No. <b style={{ color: NAVY, fontWeight: 800 }}>{data.receipt_no}</b>
              </div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                Issued Date <b style={{ color: INK, fontWeight: 600 }}>{formatIssued(data.issued_on)}</b>
              </div>
            </div>
          </div>

          {/* Lines */}
          <div style={{ marginTop: 38 }}>
            <div style={{ ...row, paddingBottom: 12, borderBottom: `2px solid ${NAVY}`, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: INK }}>
              <span style={colDesc}>Description</span>
              <span style={colNum}>Price</span>
              <span style={colNum}>Total</span>
            </div>
            <div style={{ borderBottom: `1px solid ${LINE}` }}>
              {data.items.map((it, i) =>
                it.is_sub ? (
                  <div key={i} style={{ ...row, padding: "0 0 18px" }}>
                    <span style={{ ...colDesc, fontSize: 14.5, color: MUTED, fontWeight: 500 }}>
                      {it.description}
                    </span>
                    <span style={colNum} />
                    <span style={{ ...colNum, fontSize: 14.5, color: MUTED, fontWeight: 600 }}>
                      {money(it.price_minor, data.currency)}
                    </span>
                  </div>
                ) : (
                  <div key={i} style={{ ...row, padding: "16px 0" }}>
                    <span style={{ ...colDesc, fontSize: 23, fontWeight: 700, color: INK }}>
                      {it.description}
                    </span>
                    <span style={{ ...colNum, fontSize: 21, fontWeight: 700, color: INK }}>
                      {money(it.price_minor, data.currency)}
                    </span>
                    <span style={{ ...colNum, fontSize: 21, fontWeight: 700, color: INK }}>
                      {money(it.price_minor, data.currency)}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Payment + summary */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 26, gap: 24 }}>
            <div>
              <div style={label}>Payment Method</div>
              <div style={payValue}>{data.payment_method || "—"}</div>
              <div style={{ ...label, marginTop: 14 }}>Transaction ID</div>
              <div style={payValue}>{data.transaction_id || "N/A"}</div>
            </div>

            <div style={{ width: 280 }}>
              <Sum label="Subtotal" value={money(data.subtotal_minor, data.currency)} />
              <Sum label="Discount" value={money(data.discount_minor, data.currency)} />
              <div style={{ ...sumRow, marginTop: 8, paddingTop: 14, borderTop: `1px solid ${LINE}`, fontSize: 15, fontWeight: 800, color: INK }}>
                <span>Total Bill</span>
                <span style={{ color: INK, fontWeight: 800 }}>{money(total, data.currency)}</span>
              </div>
              <div style={{ ...sumRow, fontSize: 15, fontWeight: 700, color: PAID_GREEN }}>
                <span>Paid</span>
                <span style={{ color: PAID_GREEN, fontWeight: 700 }}>{money(data.paid_minor, data.currency)}</span>
              </div>
              <div style={{ ...sumRow, marginTop: 8, paddingTop: 14, borderTop: `2px solid ${NAVY}`, fontSize: 20, fontWeight: 800, color: NAVY }}>
                {/* A settled receipt says so in green rather than showing "Due 0",
                    which reads for a moment as though something is owed. */}
                <span>{settled ? "Settled" : "Due"}</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: settled ? PAID_GREEN : NAVY }}>
                  {money(due, data.currency)}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: 24, fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED, fontWeight: 600, borderTop: `1px solid ${LINE}` }}>
            {data.footer_note}
          </div>
        </div>
      </div>
    );
  },
);

// Flex, not grid. html2canvas (used for the PDF) does not implement grid track
// sizing — a grid row rasterises as every cell stacked at the same position,
// which is what turned the first PDFs into overlapping text.
const row: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 16,
};
const colDesc: React.CSSProperties = { flex: "1 1 auto", minWidth: 0 };
const colNum: React.CSSProperties = { flex: "0 0 170px", textAlign: "right" };
const label: React.CSSProperties = {
  fontSize: 11.5, fontWeight: 700, letterSpacing: "0.16em", color: MUTED,
  textTransform: "uppercase", marginBottom: 6,
};
const payValue: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: INK };
const sumRow: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", fontSize: 14, color: MUTED,
  fontWeight: 600, padding: "6px 0",
};

function Sum({ label: l, value }: { label: string; value: string }) {
  return (
    <div style={sumRow}>
      <span>{l}</span>
      <span style={{ color: INK, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
