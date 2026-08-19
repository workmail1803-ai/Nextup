"use client";

// =============================================================================
// AdminGate — replaces the `password === "<literal>"` comparison that used to
// live inside the admin page component.
//
// Why that was not a login: the comparison ran in the browser, so the password
// shipped inside the JS bundle of a public repo — readable by anyone who opened
// devtools or the GitHub page. Passing it granted nothing cryptographic either;
// the panel then read Supabase with the public anon key, which any visitor
// already had.
//
// Now: a real Supabase sign-in issues a JWT, and every query the panel makes is
// judged by is_admin() in Postgres. Being non-admin is not a hidden screen, it
// is an empty result set.
// =============================================================================

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, ShieldAlert, User } from "lucide-react";
import { useStaffAuth } from "@/lib/auth/StaffAuthContext";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { status, isAdmin, session, signIn, signOut } = useStaffAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--ad-bg)" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--ad-text-tertiary)" }} />
      </div>
    );
  }

  // Signed in, but not an admin (a staff member who wandered to /admin).
  if (status === "ready" && !isAdmin) {
    return (
      <Frame>
        <div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg"
          style={{ background: "var(--ad-bg-raised)", color: "var(--ad-text-tertiary)" }}
        >
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h1 className="text-[15px] font-semibold text-[var(--ad-text)] mb-1">Admins only</h1>
        <p className="text-[13px] text-[var(--ad-text-tertiary)] mb-5">
          You&apos;re signed in as {session?.user?.email}, which isn&apos;t an admin account.
        </p>
        <button
          onClick={() => void signOut()}
          className="w-full py-2.5 bg-[var(--ad-accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--ad-accent-hover)] transition-colors"
        >
          Sign out
        </button>
      </Frame>
    );
  }

  if (status === "ready" && isAdmin) return <>{children}</>;

  // "no-staff-record" lands here too: signing in again is the right next step,
  // since the fix is an admin attaching that email to a staff row.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await signIn(identifier, password);
    if (!res.ok) setError(res.error ?? "Couldn't sign you in.");
    setSubmitting(false);
  }

  return (
    <Frame>
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg"
        style={{ background: "var(--ad-bg-raised)", color: "var(--ad-accent)" }}
      >
        <Lock className="h-5 w-5" />
      </div>
      <h1 className="text-[15px] font-semibold text-[var(--ad-text)] mb-1">Admin access</h1>
      <p className="text-[13px] text-[var(--ad-text-tertiary)] mb-5">
        Sign in with your admin username and password.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="admin-user" className="sr-only">
          Username
        </label>
        <div className="relative mb-3">
          <User
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--ad-text-quaternary)" }}
          />
          <input
            id="admin-user"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError(null);
            }}
            placeholder="admin"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            className="w-full rounded-lg bg-[var(--ad-bg-raised)] pl-9 pr-3 py-2.5 text-[13px] text-[var(--ad-text)] border border-[var(--ad-border)] focus:border-[var(--ad-accent)] focus:outline-none transition-colors placeholder:text-[var(--ad-text-quaternary)]"
          />
        </div>

        <label htmlFor="admin-pw" className="sr-only">
          Password
        </label>
        <div className="relative mb-4">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--ad-text-quaternary)" }}
          />
          <input
            id="admin-pw"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-lg bg-[var(--ad-bg-raised)] pl-9 pr-10 py-2.5 text-[13px] text-[var(--ad-text)] border border-[var(--ad-border)] focus:border-[var(--ad-accent)] focus:outline-none transition-colors placeholder:text-[var(--ad-text-quaternary)]"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded"
            style={{ color: "var(--ad-text-quaternary)" }}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <p className="mb-3 text-[12px]" role="alert" style={{ color: "#f87171" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 py-2.5 bg-[var(--ad-accent)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--ad-accent-hover)] transition-colors disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--ad-bg)" }}>
      <div className="admin-card p-8 w-full max-w-sm">{children}</div>
    </div>
  );
}
