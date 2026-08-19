"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { portalSupabase } from "@/lib/portal/supabase-portal";

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
      setError("Google sign-in isn't switched on yet. Use the email link below.");
      setBusy(null);
    }
  }

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter the email address your consultant has on file.");
      return;
    }
    setBusy("email");
    setError(null);
    const { error } = await portalSupabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    });
    if (error) {
      setError("That link didn't send. Check the address and try again.");
      setBusy(null);
      return;
    }
    setSent(true);
    setBusy(null);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-[27rem]">
        {sent ? (
          <>
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: "var(--pf-approved-soft)", color: "var(--pf-approved)" }}
            >
              <MailCheck className="h-5 w-5" strokeWidth={1.9} />
            </div>
            <h1 className="pf-display mt-5 text-[2rem]">Check your inbox.</h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
              We sent a sign-in link to{" "}
              <span className="pf-mono text-[0.875rem]" style={{ color: "var(--pf-vellum)" }}>
                {email}
              </span>
              . Open it on this device.
            </p>
            <button
              className="pf-mono mt-6 text-[0.8125rem]"
              style={{ color: "var(--pf-seal)" }}
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Use a different address
            </button>
          </>
        ) : (
          <>
            <p className="pf-label">NextUp Mentor</p>
            <h1 className="pf-display mt-3 text-[2.35rem]">Your file, whenever you want it.</h1>
            <p className="mt-3.5 text-[0.9375rem] leading-relaxed" style={{ color: "var(--pf-vellum-2)" }}>
              Where your application has got to, which papers are still yours to send, and when you
              next speak to your consultant. Sign in with the email address they have on file.
            </p>

            <button
              className="pf-press mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl py-3 text-sm font-semibold"
              style={{ background: "var(--pf-vellum)", color: "#14181f" }}
              onClick={withGoogle}
              disabled={busy !== null}
            >
              {busy === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleGlyph />}
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1" style={{ background: "var(--pf-rule)" }} />
              <span className="pf-label">or</span>
              <span className="h-px flex-1" style={{ background: "var(--pf-rule)" }} />
            </div>

            <form onSubmit={withEmail} noValidate>
              <label htmlFor="portal-email" className="pf-label">
                Email
              </label>
              <input
                id="portal-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="pf-input mt-2"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "portal-login-error" : undefined}
              />
              {error && (
                <p id="portal-login-error" className="mt-3 text-sm" role="alert" style={{ color: "var(--pf-halt)" }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="pf-btn pf-btn-quiet pf-press mt-4 w-full py-3"
                disabled={busy !== null}
              >
                {busy === "email" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending
                  </>
                ) : (
                  <>
                    Email me a link <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-xs" style={{ color: "var(--pf-vellum-3)" }}>
              Can&apos;t get in? Message your consultant on WhatsApp — they can check which address
              is on your file.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
