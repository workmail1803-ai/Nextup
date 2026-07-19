"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { portalSupabase } from "@/lib/portal/supabase-portal";
import { JOURNEY } from "@/components/crm/JourneyStrip";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.2a7.1 7.1 0 0 1 0-4.5V6.6H1.3a12 12 0 0 0 0 10.8l4.1-3.2Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.3 6.6l4.1 3.1A7.2 7.2 0 0 1 12 4.8Z" />
    </svg>
  );
}

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If a session already exists (or lands via the OAuth redirect), go inside.
  useEffect(() => {
    const { data: sub } = portalSupabase.auth.onAuthStateChange((_e, session) => {
      if (session) router.replace("/portal");
    });
    portalSupabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/portal");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function withGoogle() {
    setBusy("google");
    setError(null);
    const { error } = await portalSupabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/portal` },
    });
    if (error) {
      setError("Google sign-in isn't available right now. Try the email link below.");
      setBusy(null);
    }
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter the email your consultant has on file.");
      return;
    }
    setBusy("email");
    setError(null);
    const { error } = await portalSupabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    });
    if (error) {
      setError("Couldn't send the link. Check the email and try again.");
      setBusy(null);
      return;
    }
    setSent(true);
    setBusy(null);
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 py-12">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
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
          {sent ? (
            <div className="text-center">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: "var(--nx-positive-soft)", color: "var(--nx-positive)" }}
              >
                <MailCheck className="h-6 w-6" strokeWidth={1.9} />
              </div>
              <h1 className="nx-display mt-4 text-2xl font-semibold" style={{ color: "var(--nx-text)" }}>
                Check your inbox
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--nx-muted)" }}>
                We sent a sign-in link to <span style={{ color: "var(--nx-text)" }}>{email}</span>. Open it on this device to continue.
              </p>
              <button
                className="mt-5 text-sm font-medium"
                style={{ color: "var(--nx-accent-2)" }}
                onClick={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="nx-display text-2xl font-semibold" style={{ color: "var(--nx-text)" }}>
                Your journey, in your pocket
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: "var(--nx-muted)" }}>
                Track your progress, documents, and meetings. Sign in with the email your NextUp consultant has on file.
              </p>

              <button
                className="crm-press mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold"
                style={{ background: "#fff", color: "#1f1f1f" }}
                onClick={withGoogle}
                disabled={busy !== null}
              >
                {busy === "google" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <GoogleGlyph />}
                Continue with Google
              </button>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1" style={{ background: "var(--nx-edge)" }} />
                <span className="text-xs" style={{ color: "var(--nx-faint)" }}>or</span>
                <span className="h-px flex-1" style={{ background: "var(--nx-edge)" }} />
              </div>

              <form onSubmit={withEmail}>
                <label htmlFor="portal-email" className="nx-label">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--nx-faint)" }} />
                  <input
                    id="portal-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className="nx-input pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    aria-invalid={!!error}
                  />
                </div>
                {error && (
                  <p className="mt-3 text-sm" style={{ color: "var(--nx-danger)" }} role="alert">
                    {error}
                  </p>
                )}
                <button type="submit" className="nx-btn nx-btn-ghost mt-4 w-full py-3" disabled={busy !== null}>
                  {busy === "email" ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" /> Sending link…
                    </>
                  ) : (
                    <>
                      Email me a sign-in link <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--nx-faint)" }}>
          Trouble signing in? Message your NextUp consultant.
        </p>
      </motion.div>
    </div>
  );
}
