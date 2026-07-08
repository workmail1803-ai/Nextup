"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Clock, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useStaffSession } from "@/lib/hooks/useStaffSession";

const ease = [0.22, 1, 0.36, 1] as const;

const HERO_IMG =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80";

export default function StaffWelcomePage() {
  // If already signed in, skip straight to the dashboard.
  const { loading } = useStaffSession({ redirectIfFound: "/staff_portal/dashboard" });
  const [imgError, setImgError] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-t-transparent"
          style={{ borderColor: "var(--nx-edge-2)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[1200px] flex-col justify-center px-5 py-12 sm:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left — copy + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <span className="nx-eyebrow inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> NextUp · Staff Portal
          </span>

          <h1
            className="nx-display mt-5 text-4xl font-semibold leading-[1.05] sm:text-5xl"
            style={{ color: "var(--nx-text)" }}
          >
            Are you a{" "}
            <span style={{ color: "var(--nx-accent-2)" }}>staff member?</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed" style={{ color: "var(--nx-muted)" }}>
            Sign in with your staff code to clock in, track your working hours,
            and manage your assigned client records — all in one place.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/staff_portal/login" className="nx-btn nx-btn-primary px-5 py-3 text-[0.95rem]">
              Yes, I&apos;m staff — continue
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="nx-btn nx-btn-ghost px-5 py-3 text-[0.95rem]">
              Back to website
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {[
              { icon: Clock, label: "Track work hours" },
              { icon: Users, label: "Manage clients" },
              { icon: ShieldCheck, label: "Secure code sign-in" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: "var(--nx-faint)" }}
              >
                <Icon className="h-4 w-4" style={{ color: "var(--nx-accent-2)" }} />
                {label}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right — visual */}
        <motion.div
          className="relative hidden lg:block"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
        >
          <div className="nx-card relative overflow-hidden rounded-[1.5rem] p-2">
            <div
              className="relative h-[420px] w-full overflow-hidden rounded-[1.1rem]"
              style={{
                background:
                  "radial-gradient(120% 120% at 20% 0%, var(--nx-panel-2), var(--nx-bg-2))",
              }}
            >
              {/* branded fallback shown when the photo is unavailable */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Building2
                  className="h-40 w-40"
                  strokeWidth={1}
                  style={{ color: "rgba(224,146,31,0.12)" }}
                />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMG}
                alt="NextUp team at work"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                style={{ opacity: imgError ? 0 : 1 }}
                onError={() => setImgError(true)}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(16,13,9,0) 40%, rgba(16,13,9,0.85) 100%)",
                }}
              />
            </div>

            {/* floating status card */}
            <motion.div
              className="nx-glass absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-xl p-3.5"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.35 }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "var(--nx-positive-soft)", color: "var(--nx-positive)" }}
              >
                <span className="nx-pulse h-2.5 w-2.5 rounded-full" style={{ background: "var(--nx-positive)" }} />
              </span>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--nx-text)" }}>
                  Live attendance
                </p>
                <p className="text-xs" style={{ color: "var(--nx-muted)" }}>
                  Start &amp; end work with one tap
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
