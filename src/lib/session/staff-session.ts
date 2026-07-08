// =============================================================================
// Staff session — client-side, localStorage-backed with an expiry, exposed as a
// small external store so React can read it via useSyncExternalStore (SSR-safe,
// no setState-in-effect).
//
// SECURITY NOTE: this is a convenience session, not a security boundary. Staff
// codes are verified with the Supabase anon key in the browser (per project
// decision), so this only remembers "who is logged in" between reloads. Do not
// treat the stored token as a credential. A future hardening step would move
// verification to a route handler + httpOnly cookie.
// =============================================================================

import type { Staff } from "@/lib/types/staff";

const KEY = "nx_staff_session";
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export interface StaffSession {
  staffId: string;
  fullName: string;
  staffCode: string;
  title: string | null;
  avatarUrl: string | null;
  token: string;
  issuedAt: number;
  expiresAt: number;
}

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function parseValid(raw: string | null): StaffSession | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as StaffSession;
    if (!s?.staffId || !s?.expiresAt) return null;
    if (Date.now() >= s.expiresAt) return null;
    return s;
  } catch {
    return null;
  }
}

// --- External store plumbing -------------------------------------------------
// getSnapshot must return a *stable* reference between changes, so we memoize
// on the raw string and only re-parse when it actually changes.

type Listener = () => void;
const listeners = new Set<Listener>();
let cachedRaw: string | null | undefined;
let cachedSession: StaffSession | null = null;

function notify(): void {
  listeners.forEach((l) => l());
}

/** Client snapshot for useSyncExternalStore (stable across renders). */
export function getSessionSnapshot(): StaffSession | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedSession;
  cachedRaw = raw;
  cachedSession = parseValid(raw);
  return cachedSession;
}

/** Server snapshot — always null (no localStorage during SSR). */
export function getServerSessionSnapshot(): StaffSession | null {
  return null;
}

/** Subscribe to session changes (same-tab writes + cross-tab storage events). */
export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) listener();
  };
  if (hasStorage()) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (hasStorage()) window.removeEventListener("storage", onStorage);
  };
}

// --- Imperative API ----------------------------------------------------------

export function setSession(staff: Staff, ttlMs: number = DEFAULT_TTL_MS): StaffSession {
  const now = Date.now();
  const session: StaffSession = {
    staffId: staff.id,
    fullName: staff.full_name,
    staffCode: staff.staff_code,
    title: staff.title,
    avatarUrl: staff.avatar_url,
    token: randomToken(),
    issuedAt: now,
    expiresAt: now + ttlMs,
  };
  if (hasStorage()) {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  }
  cachedRaw = undefined; // invalidate memo
  notify();
  return session;
}

/** Imperative read (clears expired entries as a side effect). */
export function getSession(): StaffSession | null {
  if (!hasStorage()) return null;
  const raw = window.localStorage.getItem(KEY);
  const session = parseValid(raw);
  if (!session && raw) clearSession();
  return session;
}

export function clearSession(): void {
  if (hasStorage()) window.localStorage.removeItem(KEY);
  cachedRaw = undefined;
  notify();
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}
