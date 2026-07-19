"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { StaffService } from "@/lib/services/staff.service";
import { setSession } from "@/lib/session/staff-session";
import { useStaffSession } from "@/lib/hooks/useStaffSession";
import { JOURNEY } from "@/components/crm/JourneyStrip";

export default function CrmLoginPage() {
  const router = useRouter();
  const { loading: sessionLoading } = useStaffSession({ redirectIfFound: "/crm" });

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter your staff code to open the workspace.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const staff = await StaffService.getByCode(trimmed);
      if (!staff) {
        setError("That code doesn't match an active staff member.");
        setSubmitting(false);
        return;
      }
      setSession(staff);
      StaffService.touchLogin(staff.id).catch(() => {});
      router.replace("/crm");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoaderCircle className="h-7 w-7 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-12">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* A lit journey strip as the brand mark — the product in one glyph */}
        <div className="crm-journey mx-auto mb-8 max-w-[11rem]">
          {JOURNEY.map((s, i) => (
            <motion.span
              key={s}
              data-lit
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.3 }}
              style={{ transformOrigin: "left" }}
            />
          ))}
        </div>

        <div className="crm-card p-7">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}
          >
            <KeyRound className="h-5 w-5" strokeWidth={1.9} />
          </div>
          <h1 className="nx-display mt-4 text-2xl font-semibold" style={{ color: "var(--nx-text)" }}>
            NextUp CRM
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--nx-muted)" }}>
            Your whole caseload, one thumb. Enter your staff code.
          </p>

          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            <label htmlFor="crm-code" className="nx-label">
              Staff code
            </label>
            <input
              id="crm-code"
              className="nx-input text-center font-mono text-lg uppercase tracking-[0.3em]"
              placeholder="NX-••••"
              autoComplete="one-time-code"
              autoCapitalize="characters"
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              aria-invalid={!!error}
            />
            {error && (
              <p className="mt-3 text-sm" style={{ color: "var(--nx-danger)" }} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="nx-btn nx-btn-primary mt-5 w-full py-3" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Opening…
                </>
              ) : (
                <>
                  Open workspace <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--nx-faint)" }}>
          No code? Ask your admin to add you as staff.
        </p>
      </motion.div>
    </div>
  );
}
