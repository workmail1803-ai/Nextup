"use client";

// =============================================================================
// useStaffSession — reads the current staff session from the external store
// (SSR-safe via useSyncExternalStore) and optionally redirects when the session
// is absent (guarded pages) or present (welcome/login pages).
// =============================================================================

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  subscribeSession,
  getSessionSnapshot,
  getServerSessionSnapshot,
  clearSession,
  type StaffSession,
} from "@/lib/session/staff-session";

interface Options {
  /** Where to send unauthenticated visitors. Omit to not redirect. */
  redirectTo?: string;
  /** If already authenticated, send here instead (used on welcome/login). */
  redirectIfFound?: string;
}

interface Result {
  session: StaffSession | null;
  /** True until the client has hydrated (avoids SSR flash / premature redirect). */
  loading: boolean;
  signOut: () => void;
}

// Stable module-level snapshots for the "hydrated" flag.
const subscribeNoop = () => () => {};
const hydratedClient = () => true;
const hydratedServer = () => false;

export function useStaffSession(options: Options = {}): Result {
  const { redirectTo, redirectIfFound } = options;
  const router = useRouter();

  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  const hydrated = useSyncExternalStore(subscribeNoop, hydratedClient, hydratedServer);

  useEffect(() => {
    if (!hydrated) return;
    if (!session && redirectTo) {
      router.replace(redirectTo);
    } else if (session && redirectIfFound) {
      router.replace(redirectIfFound);
    }
  }, [hydrated, session, redirectTo, redirectIfFound, router]);

  const signOut = useCallback(() => {
    clearSession();
    router.replace("/staff_portal");
  }, [router]);

  return { session, loading: !hydrated, signOut };
}
