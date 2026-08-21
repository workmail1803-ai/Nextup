"use client";

// =============================================================================
// ReceiptCapture — an unscaled, off-screen copy of the document, used only as
// the source for the PDF.
//
// WHY A SECOND COPY EXISTS
//   The visible preview is wrapped in `transform: scale(0.36)` so a 1000px
//   document fits a sheet or a phone. html2canvas measures layout through
//   getBoundingClientRect, which reports the SCALED geometry while the element's
//   own styles are still at natural size. The two disagree, and the rasterised
//   output collapses — every line drawn at the same position, text on top of
//   text. That is exactly the broken PDF this fixes.
//
//   So: capture never reads the preview. It reads this, which lives at natural
//   size in normal flow, just pushed outside the viewport.
//
//   Off-screen, NOT `display: none` or `visibility: hidden` — an element with no
//   layout box has no geometry to measure, and html2canvas would produce a blank
//   page instead of a wrong one.
// =============================================================================

import { forwardRef } from "react";
import { ReceiptDocument, type ReceiptData } from "./ReceiptDocument";

export const ReceiptCapture = forwardRef<HTMLDivElement, { data: ReceiptData }>(
  function ReceiptCapture({ data }, ref) {
    return (
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -20000,
          top: 0,
          width: 1000,
          height: 707,
          // No transform anywhere in this subtree, by design.
          pointerEvents: "none",
          opacity: 1,
          zIndex: -1,
        }}
      >
        <ReceiptDocument ref={ref} data={data} />
      </div>
    );
  },
);
