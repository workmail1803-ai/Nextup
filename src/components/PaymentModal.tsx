"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, CheckCircle2, Copy, CreditCard, Smartphone, Landmark, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db, supabase } from "@/lib/supabase";

// TODO: Future integration with SSL Commerz for international students.

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageId?: string;
  packageTitle: string;
  packagePrice: string;
  packageAmount: number;
}

type PaymentMethod = "bkash" | "nagad" | "bank";

interface PaymentInfo {
  name: string;
  number: string;
  accent: string;
  Icon: LucideIcon;
  label: string;
}

const paymentMethods: Record<PaymentMethod, PaymentInfo> = {
  bkash: { name: "bKash", number: "01883-913491", accent: "#e2136e", Icon: Smartphone, label: "bKash Personal Number" },
  nagad: { name: "Nagad", number: "01883-913491", accent: "#ec1c24", Icon: CreditCard, label: "Nagad Personal Number" },
  bank: { name: "Bank Transfer", number: "2304144638001", accent: "#1f6feb", Icon: Landmark, label: "Account Number" },
};

export default function PaymentModal({
  isOpen,
  onClose,
  packageId,
  packageTitle,
  packagePrice,
  packageAmount,
}: PaymentModalProps) {
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bkash");

  const currentPayment = paymentMethods[paymentMethod];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(currentPayment.number.replace("-", ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!(studentName.trim() && studentEmail.trim() && transactionId.trim() && screenshot)) return;
    setIsSubmitting(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const fileExt = screenshot.name.split(".").pop()?.toLowerCase() || "jpg";
        const fileName = `${Date.now()}.${fileExt}`;
        const mimeTypes: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
        };
        const contentType = screenshot.type || mimeTypes[fileExt] || "image/jpeg";
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("payment-screenshots")
          .upload(fileName, screenshot, { contentType, upsert: true });
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message || "Unknown error"}`);
        screenshotUrl = supabase.storage.from("payment-screenshots").getPublicUrl(uploadData.path).data.publicUrl;
      }

      await db.enrollments.create({
        student_name: studentName.trim(),
        student_email: studentEmail.trim(),
        student_phone: null,
        package_id: packageId || null,
        package_title: packageTitle,
        amount: packageAmount,
        transaction_id: transactionId.trim(),
        payment_screenshot: screenshotUrl,
        status: "pending",
        admin_notes: null,
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setStudentName("");
        setStudentEmail("");
        setTransactionId("");
        setScreenshot(null);
      }, 2500);
    } catch (err) {
      console.error("Error submitting enrollment:", err);
      setError("We couldn't submit your enrollment. Please check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder-faint transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm enrollment"
        >
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-lg)]"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-faint transition-colors hover:bg-paper-2 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <GraduationCap className="h-6 w-6" strokeWidth={1.75} />
            </div>

            <h2 className="text-center font-display text-xl font-semibold text-ink">
              Confirm your slot
            </h2>
            <p className="mt-1 text-center text-sm text-muted">
              {packageTitle} · {packagePrice}
            </p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center"
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf3ed] text-positive">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="font-display text-lg font-semibold text-ink">Enrollment submitted</h3>
                <p className="mt-1 text-sm text-muted">We&apos;ll verify your payment within 24 hours.</p>
              </motion.div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {(Object.keys(paymentMethods) as PaymentMethod[]).map((method) => {
                    const m = paymentMethods[method];
                    const isActive = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                          isActive
                            ? "border-ink bg-ink text-on-ink"
                            : "border-line bg-paper text-muted hover:border-line-strong"
                        }`}
                      >
                        <m.Icon className="h-4 w-4" style={{ color: isActive ? m.accent : undefined }} />
                        {m.name}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl bg-paper-2 p-3 text-sm text-muted">
                  Pay via{" "}
                  <span className="font-semibold" style={{ color: currentPayment.accent }}>
                    {currentPayment.name}
                  </span>{" "}
                  to secure your slot.
                  {paymentMethod === "bank" && (
                    <div className="mt-2 text-xs text-faint">
                      <p><strong className="text-muted">Bank:</strong> City Bank</p>
                      <p><strong className="text-muted">Branch:</strong> Khulna</p>
                      <p><strong className="text-muted">Account Name:</strong> Md Fahim Harun</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium text-muted">{currentPayment.label}</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-line bg-paper px-3 py-2.5 font-mono text-base text-ink">
                      {currentPayment.number}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyNumber}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        copied ? "bg-positive text-white" : "bg-paper-2 text-ink hover:bg-line"
                      }`}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted">Student name</label>
                    <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Your full name" className={inputCls} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted">Student email</label>
                    <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="you@email.com" className={inputCls} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted">Transaction ID (TrxID)</label>
                    <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder={`Your ${currentPayment.name} Transaction ID`} className={inputCls} required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-muted">
                      {paymentMethod === "bank" ? "Payment copy" : "Payment screenshot"} <span className="text-danger">*</span>
                    </label>
                    <div className={`rounded-xl border bg-paper px-4 py-3 transition-colors ${screenshot ? "border-accent" : "border-line"}`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                        className="w-full cursor-pointer text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent hover:file:bg-[#efddc4]"
                        required
                      />
                    </div>
                    {screenshot && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-positive">
                        <Check className="h-3.5 w-3.5" /> {screenshot.name}
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-lg bg-[#fbeceb] px-3 py-2.5 text-sm text-danger">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-ink py-3.5 font-semibold text-on-ink transition-[transform,background-color] hover:bg-[#2a241c] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting…" : "Confirm enrollment"}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
