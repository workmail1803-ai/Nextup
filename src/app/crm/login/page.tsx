"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, User } from "lucide-react";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";
import { JOURNEY } from "@/components/crm/JourneyStrip";

export default function CrmLoginPage() {
  const router = useRouter();
  const { status, signIn } = useStaffAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in — the layout will route on; don't flash the form.
  if (status === "ready") {
    router.replace("/crm");
    return <Splash />;
  }
  if (status === "loading") return <Splash />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await signIn(identifier, password);
    if (!res.ok) {
      setError(res.error ?? "Couldn't sign you in.");
      setSubmitting(false);
      return;
    }
    router.replace("/crm");
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
            <Lock className="h-5 w-5" strokeWidth={1.9} />
          </div>
          <h1 className="nx-display mt-4 text-2xl font-semibold" style={{ color: "var(--nx-text)" }}>
            NextUp workspace
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--nx-muted)" }}>
            Sign in with the username and password your admin gave you.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="identifier" className="nx-label">
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--nx-faint)" }}
                />
                <input
                  id="identifier"
                  className="nx-input pl-10"
                  placeholder="admin"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoFocus
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="nx-label">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--nx-faint)" }}
                />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="nx-input pl-10 pr-11"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg"
                  style={{ color: "var(--nx-faint)" }}
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p id="login-error" className="text-sm" style={{ color: "var(--nx-danger)" }} role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="nx-btn nx-btn-primary w-full py-3" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" /> Signing in…
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
          No account? Ask your admin to add you as staff.
        </p>
      </motion.div>
    </div>
  );
}

function Splash() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <LoaderCircle className="h-7 w-7 animate-spin" style={{ color: "var(--nx-faint)" }} />
    </div>
  );
}
