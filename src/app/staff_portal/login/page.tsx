"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, KeyRound, LoaderCircle } from "lucide-react";
import { StaffService } from "@/lib/services/staff.service";
import { setSession } from "@/lib/session/staff-session";
import { useStaffSession } from "@/lib/hooks/useStaffSession";

const ease = [0.22, 1, 0.36, 1] as const;

export default function StaffLoginPage() {
  const router = useRouter();
  const { loading: sessionLoading } = useStaffSession({
    redirectIfFound: "/staff_portal/dashboard",
  });

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter your staff code to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const staff = await StaffService.getByCode(trimmed);
      if (!staff) {
        setError("We couldn't find an active staff member with that code.");
        setSubmitting(false);
        return;
      }
      setSession(staff);
      // Best-effort — never block sign-in on the timestamp write.
      StaffService.touchLogin(staff.id).catch(() => {});
      router.push("/staff_portal/dashboard");
    } catch {
      setError("Something went wrong reaching the server. Please try again.");
      setSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin" style={{ color: "var(--nx-faint)" }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <Link
          href="/staff_portal"
          className="mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: "var(--nx-faint)" }}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="nx-card p-7 sm:p-8">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "var(--nx-accent-soft)", color: "var(--nx-accent-2)" }}
          >
            <KeyRound className="h-6 w-6" strokeWidth={1.75} />
          </div>

          <h1
            className="nx-display mt-5 text-2xl font-semibold"
            style={{ color: "var(--nx-text)" }}
          >
            Staff sign in
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--nx-muted)" }}>
            Enter the staff code your admin gave you. No email or password needed.
          </p>

          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            <label htmlFor="staff-code" className="nx-label">
              Staff code
            </label>
            <input
              id="staff-code"
              name="staff-code"
              className="nx-input text-center font-mono text-lg tracking-[0.3em] uppercase"
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
              aria-describedby={error ? "code-error" : undefined}
            />

            {error && (
              <motion.p
                id="code-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm"
                style={{ color: "var(--nx-danger)" }}
                role="alert"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="nx-btn nx-btn-primary mt-5 w-full py-3 text-[0.95rem]"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Continue to dashboard <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs" style={{ color: "var(--nx-faint)" }}>
            Don&apos;t have a code? Ask your NextUp admin to create one for you.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
