"use client";

// =============================================================================
// StaffAuthContext — the single source of truth for "who is this staff member
// and what may they do", for both /crm and /admin.
//
// Replaces two things that were never security boundaries:
//   * the staff-code + localStorage session (any active code let you in, and
//     the stored token was self-issued by the browser)
//   * the `password === "<literal>"` comparison inside a client component
//
// The role here is for RENDERING ONLY — deciding which nav items and buttons
// exist. It is not the enforcement point. Enforcement is RLS: is_admin() and
// is_staff() re-derive the role from the JWT on every single query, so a user
// who edits `role` in devtools changes what they see and nothing they can do.
// =============================================================================

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { staffSupabase, resolveIdentifier } from "./supabase-staff";
import type { Staff, StaffRole } from "@/lib/types/staff";

export type StaffAuthStatus =
  /** Resolving the stored session — render a spinner, never a redirect. */
  | "loading"
  /** No Supabase session at all. */
  | "unauthed"
  /** Signed in, but no active `staff` row carries this email. */
  | "no-staff-record"
  /** Signed in and bound to an active staff row. */
  | "ready";

interface SignInResult {
  ok: boolean;
  /** Human-readable, already safe to show in the UI. */
  error?: string;
}

interface StaffAuthValue {
  status: StaffAuthStatus;
  session: Session | null;
  staff: Staff | null;
  role: StaffRole | null;
  isAdmin: boolean;
  isMentor: boolean;
  signIn: (identifier: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const StaffAuthCtx = createContext<StaffAuthValue | null>(null);

export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  // Guards against a second claim firing while the first is still in flight
  // (React 18 double-invokes effects in dev).
  const claimingRef = useRef(false);

  // --- Track the Supabase session -------------------------------------------
  useEffect(() => {
    staffSupabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthResolved(true);
    });
    const { data: sub } = staffSupabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setAuthResolved(true);
      if (!s) {
        setStaff(null);
        setLoadedFor(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // --- Bind the auth user to their staff row, then load it ------------------
  const loadStaff = useCallback(async (uid: string) => {
    // claim_staff_account() is SECURITY DEFINER: it binds auth_user_id on the
    // staff row whose email matches this identity, and is a no-op once bound.
    // Awaited (not fire-and-forget) because every subsequent read is gated on
    // that binding existing — the student portal has this exact race today.
    const { error: claimErr } = await staffSupabase.rpc("claim_staff_account");
    if (claimErr) {
      // A failed claim is not fatal: the row may already be bound.
      console.warn("claim_staff_account failed:", claimErr.message);
    }

    const { data, error } = await staffSupabase
      .from("staff")
      .select("*")
      .eq("auth_user_id", uid)
      .eq("status", "active")
      .maybeSingle();

    setStaff(error ? null : ((data as Staff) ?? null));
    setLoadedFor(uid);
  }, []);

  useEffect(() => {
    if (!authResolved) return;
    const uid = session?.user?.id;
    if (!uid) return;
    if (loadedFor === uid) return;
    if (claimingRef.current) return;

    claimingRef.current = true;
    // Deferred off the effect body: loadStaff sets state, and doing that
    // synchronously here cascades renders. Same pattern the portal and CRM
    // pages already use for their initial fetch.
    const t = setTimeout(() => {
      loadStaff(uid)
        .catch(() => setLoadedFor(uid))
        .finally(() => {
          claimingRef.current = false;
        });
    }, 0);
    return () => clearTimeout(t);
  }, [authResolved, session, loadedFor, loadStaff]);

  // --- Actions ---------------------------------------------------------------
  const signIn = useCallback(
    async (identifier: string, password: string): Promise<SignInResult> => {
      const email = resolveIdentifier(identifier);
      if (!email) return { ok: false, error: "Enter your username." };

      // Passwords get mangled between a person and this box more often than
      // they are genuinely wrong: pasting drags a trailing space, and phone and
      // desktop autocorrect turn a typed hyphen into an en or em dash. Both
      // produce "wrong password" against a password that is right, so normalise
      // before judging rather than blaming the person.
      const cleaned = password
        .trim()
        .replace(/[‐-―−]/g, "-")   // dashes -> hyphen-minus
        .replace(/[‘’]/g, "'")           // smart quotes
        .replace(/[“”]/g, '"')
        .replace(/ /g, " ");                  // non-breaking space

      if (!cleaned) return { ok: false, error: "Enter your password." };

      const { error } = await staffSupabase.auth.signInWithPassword({
        email,
        password: cleaned,
      });
      if (error) {
        // Deliberately does not distinguish "no such user" from "wrong
        // password" — that difference is an account-enumeration oracle.
        const msg = /invalid login credentials/i.test(error.message)
          ? "That username and password don't match."
          : error.message;
        return { ok: false, error: msg };
      }
      return { ok: true };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await staffSupabase.auth.signOut();
    setStaff(null);
    setLoadedFor(null);
  }, []);

  const refresh = useCallback(() => setLoadedFor(null), []);

  const status: StaffAuthStatus = !authResolved
    ? "loading"
    : !session
      ? "unauthed"
      : loadedFor !== session.user.id
        ? "loading"
        : staff
          ? "ready"
          : "no-staff-record";

  const value = useMemo<StaffAuthValue>(
    () => ({
      status,
      session,
      staff,
      role: staff?.role ?? null,
      isAdmin: staff?.role === "admin",
      isMentor: !!staff?.is_mentor,
      signIn,
      signOut,
      refresh,
    }),
    [status, session, staff, signIn, signOut, refresh],
  );

  return <StaffAuthCtx.Provider value={value}>{children}</StaffAuthCtx.Provider>;
}

export function useStaffAuth(): StaffAuthValue {
  const ctx = useContext(StaffAuthCtx);
  if (!ctx) throw new Error("useStaffAuth must be used inside <StaffAuthProvider>");
  return ctx;
}
