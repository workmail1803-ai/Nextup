# NextUp Mentor CRM & ERP — Implementation Plan

**Companion to:** SRS v1.0 (18 Jul 2026). This plan turns the SRS into a buildable
program: repo structure, module boundaries, schema/migration plan, a dependency-ordered
backlog keyed to FR/NFR IDs, and recommended answers to the 5 open Product-Owner
questions. It does not restate requirements — it references them.

> **Reality check.** This is a **ground-up rebuild on a new stack** (Express+Prisma+
> Postgres+Redis/BullMQ+Auth.js), phased over roughly the SRS's Phase 0→3 (~months for a
> small team), not an extension of the current Next.js/Supabase-direct app. The current
> app is retained only as the **frontend + design system**; the browser stops talking to
> Supabase directly (AD-6).

---

## 1. Repository & workspace structure

**Recommendation: convert the existing repo into a pnpm + Turborepo monorepo** (keep git
history; move the current Next.js app to `apps/web`). One repo gives the SRS's shared
types + shared Zod schemas (NFR-MNT-001, §7.2) for free and keeps the modular-monolith
boundary honest.

```
nextup/
├─ apps/
│  ├─ web/         # Next.js on Vercel — marketing + client portal + staff/admin workspace
│  ├─ api/         # Express + TS on Render — /api/v1, the single write path (AD-1)
│  └─ worker/      # BullMQ worker on Render — notify, reminders, automations, gcal, webhooks, reports
├─ packages/
│  ├─ db/          # Prisma schema, generated client, migrations (incl. raw-SQL companions)
│  ├─ shared/      # Zod schemas, DTO types, RBAC policy file, error envelope, enums
│  ├─ ui/          # extracted Tailwind/shadcn design system (consumed by apps/web)
│  └─ config/      # eslint, tsconfig base, prettier
├─ docker-compose.yml   # local: postgres, redis, mailpit (NFR-MNT-005)
└─ turbo.json
```

**Why a separate `apps/api` at all** (endorsing §3.4): long-running/scheduled jobs, verified
inbound webhooks, and a stable versioned API for the future mobile app — none of which fit
Vercel's serverless model. The `worker` is a separate Render service sharing `packages/db`.

---

## 2. Module boundaries (modular monolith)

Each API module is one folder = `routes` + `service` + `repo` + `schema` (Zod). Modules
never reach into each other's repos; they call services or emit outbox events.

| API module (`apps/api/src/modules/*`) | Owns | Key FRs |
| --- | --- | --- |
| `auth` | Auth.js integration, JWT issue/refresh, 2FA, sessions | FR-AUTH-* |
| `rbac` | policy evaluation, permission overrides, scope resolver | Ch.4, FR-USER-005/006 |
| `users` | staff invite/role/deactivate, mentor grant | FR-USER-* |
| `clients` (CRM) | client master, stage machine, tags, timeline read | FR-PIPE-*, FR-FUP-005/007 |
| `leads` | capture, dedup/merge, assignment, SLA | FR-LEAD-* |
| `mentors` | MentorProfile, availability, slot engine | FR-AVAIL-* |
| `bookings` | booking lifecycle, gcal/Meet, public book | FR-BOOK-* |
| `documents` | types, templates, versions, review, expiry, signed URLs | FR-DOC-* |
| `catalog` + `applications` | universities/programs, per-client applications | FR-APP-* |
| `finance` | packages, enrolments, invoices, payments, refunds, expenses | FR-FIN-* |
| `followups` | follow-ups, tasks, My Day | FR-FUP-* |
| `notifications` | template registry, channel routing, delivery log | FR-NOTIF-* |
| `automations` | rule model, recipes, guardrails, runs | FR-AUTO-* |
| `analytics` | dashboards, rollups, exports | FR-ANLY-* |
| `audit` | append-only log, search | FR-AUDIT-* |
| `webhooks` | verify+persist+enqueue (whatsapp, sslcommerz, email, gcal) | §7.4 |
| `public` | enquiry form, public booking slots | FR-LEAD-001, FR-BOOK-010 |

**Worker queues** (§3.5): `notify`, `reminders`, `automations`, `gcal`, `webhooks`,
`reports` — all idempotent by event id.

---

## 3. Build-first cross-cutting primitives

These are used by every module; getting them right in Phase 0 is what makes the rest cheap.
Build in this order:

1. **Request context + tenant scoping** — resolve `(orgId, userId, role, capabilities, branchId?)` once from the JWT; a Prisma extension injects `orgId` into every query; a lint rule fails hand-written queries that omit scope (AD-2, §3.3, NFR-SEC-004).
2. **Default-deny RBAC** — `resource.action` policy file (versioned) mapped from roles + per-user overrides + record scope (`own/assigned/branch/org`); every route declares its permission; undeclared routes fail closed in CI (Ch.4).
3. **Validation + error envelope + idempotency** — Zod per route (shared with web); `{ error: { code, message, details?, requestId } }`; `Idempotency-Key` required on bookings/payments (§7.2).
4. **Audit middleware** — Prisma extension emits before/after diffs for registered models, so auditing can't be forgotten per-endpoint (§6.3, FR-AUDIT-001).
5. **Transactional outbox + worker drain** — state change + `OutboxEvent` in one tx; worker fans out to notify/automations (AD-4). This is the backbone of "no lost reminders."
6. **Signed-URL service + storage paths** — `org/client/item/version`, TTL ≤ 10 min, every issue audited (FR-DOC-009/012).
7. **Provider interfaces** — `GoogleCalendar`, `WhatsApp`, `Email`, `Payments` behind thin interfaces so a vendor swap never touches modules (D1).
8. **Structured logging + healthz/readyz** — pino + `requestId` propagated into jobs (NFR-MNT-004, NFR-AVL-004).

---

## 4. Data model / migration plan

The entity catalogue and representative Prisma schema in SRS §6.1–6.2 are the source of
truth; build models in the dependency order of the phases below. Conventions to enforce
from the first migration: `orgId` on every business table, tenant-scoped unique constraints,
soft delete (`deletedAt`) with a default query scope, integer minor units for money, enums
for every status, keyset pagination, `pg_trgm` GIN for person search (§6.3–6.4).

**Prisma can't express these declaratively — ship them as raw-SQL companion migrations,
reviewed like code (NFR-MNT-003):**

| Companion migration | Guards |
| --- | --- |
| Partial unique index on `Booking(mentorId, startAt) WHERE status IN ('HOLD','CONFIRMED')` | No double-booking under concurrency (FR-BOOK-002, AD-5) |
| Per-org PostgreSQL **sequence** for invoice numbers, claimed inside the create tx | Gap-free `NUM-YYYY-0001` (FR-FIN-003) |
| `pg_trgm` extension + GIN indexes on name/phone/email | Staff fuzzy search at 10k clients (§6.4) |
| Trigger: `ClientChecklistItem.currentVersionId` may only point at an `APPROVED` version | Integrity (§6.3) |
| CHECK constraints: `totalMinor >= 0`, `paidMinor <= totalMinor + creditTolerance` | Money invariants (§6.3) |

**Field-level encryption** (passport no., portal creds, payment refs) is app-side AES-256-GCM
(`Bytes` columns), keys from env/KMS, never logged (NFR-SEC-003, FR-APP-007).

---

## 5. Dependency-ordered backlog (work packages → requirement IDs)

Grouped by the SRS phases (§9.2). Each work package (WP) lists the requirements it closes.
Order within a phase respects dependencies.

### Phase 0 — Foundations *(exit: staff sign in; create/search clients; every mutation audited; staging live)*
- **WP-0.1 Monorepo + CI/CD** — pnpm+turbo, TS strict, ESLint/Prettier, GitHub Actions (typecheck/lint/test/`prisma migrate deploy`), preview deploys. → NFR-MNT-001/003, AD-1
- **WP-0.2 Environments** — docker-compose (pg/redis/mailpit); staging + prod (Render+Vercel); 12-factor secrets; `/healthz` `/readyz`. → §3.6, NFR-MNT-005, NFR-AVL-004
- **WP-0.3 Core schema + tenancy** — Organization, Branch, User, MentorProfile, Client(min), enums; scoping middleware + lint rule. → §3.3, AD-2, FR-USER-008
- **WP-0.4 Auth + RBAC** — Auth.js v5 (Google + email OTP), JWT 15m + rotating refresh 30d + reuse detection, 2FA for admins, sessions; default-deny RBAC + overrides. → FR-AUTH-001..012, Ch.4, FR-USER-001..006
- **WP-0.5 Audit + outbox + platform** — audit Prisma extension, `AuditLog`, `OutboxEvent` + worker drain, idempotency, error envelope, pino logging. → FR-AUDIT-*, AD-4, §7.2
- **WP-0.6 Design-system consolidation** — extract `packages/ui`; move current Next.js app to `apps/web`. → §7.1
- **WP-0.7 (start early) WhatsApp template submission** — submit the 5 templates (see §6 Q4) for Meta approval now; multi-day lead time. → FR-NOTIF-004

### Phase 1 — Operating Core *(exit: a real client goes lead→booked→docs reviewed→follow-up in-system; legacy read-only)*
- **WP-1.1 Pipeline + Kanban + history** — stage machine (App. B.1), immutable `StageTransition`, gates, derived moves, tags, intake, time-in-stage. → FR-PIPE-001..012
- **WP-1.2 Lead management** — capture channels, E.164 validation, dedup/merge (30-day reversible), round-robin assign, SLA timers (reminders queue), qualify/disqualify, bulk actions. → FR-LEAD-001..012
- **WP-1.3 Availability + Booking + Meet** *(highest-risk — spike first)* — availability rules/overrides/closures, policy; UTC slot engine (buffers, notice, horizon, caps, free/busy); transactional booking on the partial-unique index; lifecycle (App. B.2); gcal/Meet queue; ICS. → FR-AVAIL-001..010, FR-BOOK-001..018
- **WP-1.4 Documents v1** — types/templates, per-country instantiation, signed uploads, immutable versions, review (App. B.4), rollups → pipeline gate, expiry intelligence, ZIP export. → FR-DOC-001..014
- **WP-1.5 Follow-ups + unified timeline + My Day** — → FR-FUP-001..010
- **WP-1.6 Notifications (in-app + email)** — template registry, routing, delivery log, quiet hours, rate caps. → FR-NOTIF-001..010 (email/in-app scope)
- **WP-1.7 Client portal core** — dashboard/13-step tracker, documents, bookings, applications(read), profile; PWA shell; i18n framework. → FR-PORT-001..010, NFR-LOC-002
- **WP-1.8 Legacy data import** — dry-run report → migrate with stage inference → triage queue. → §9.3

### Phase 2 — Money & Reach *(exit: invoices/receipts issued in-system; recipes running; dashboards adopted)*
- **WP-2.1 Finance** — packages, enrolments, invoices (sequence numbering), instalments, payments + manual verification, receipts, refunds, expenses, aged receivables, exports. → FR-FIN-001..016
- **WP-2.2 Universities/Programs/Applications** — catalogue + Application entity + status machine (App. B.3) + derived pipeline events + encrypted portal-cred vault. → FR-APP-001..010
- **WP-2.3 WhatsApp live** — approved templates, delivery/read webhooks, auto-fallback. → FR-NOTIF-004/005/006
- **WP-2.4 Automation engine + v1 recipes** — rule model, guardrails (dry-run, rate caps, loop guard), run log. → FR-AUTO-001..006
- **WP-2.5 Analytics v1** — rollup tables, executive/funnel/source/staff/destination/finance dashboards, CSV + scheduled email. → FR-ANLY-001..009

### Phase 3 — Scale & Polish
- **WP-3.1 Online payments** — SSLCommerz/bKash hosted checkout, IPN verify+idempotent+reconcile. → FR-FIN-007, §7.4
- **WP-3.2 Public booking page → lead** — → FR-BOOK-010
- **WP-3.3 Bangla complete + PWA offline + referral cards** — → FR-PORT-007/008/009, NFR-LOC
- **WP-3.4 Staff performance suite; branch #2; automation-builder groundwork**

**Threaded across all phases (not a phase):** security gates (Ch.8.3, ASVS L2 pre-launch
review), performance budgets (§8.1), and the test floor — **slot engine, RBAC, invoice
numbering, IPN handling integration-tested; state machines property-tested against
Appendix B; ≥70% on core modules** (NFR-MNT-002). Write these tests with the module, not after.

---

## 6. Recommended answers to the 5 open questions (§9.4)

1. **Default staff visibility → assigned-only** (SRS's own recommendation). Least-privilege for passport-grade PII, focused queues, matches the `assigned` RBAC scope. Keep it an **org setting** so Super Admin can switch to branch-wide pools without a migration; `branch.viewAll` stays grantable per user (FR-USER-008).
2. **Instalment template → adopt 40/30/30 (engagement/offer/visa) as the default**, but **per-package configurable** (FR-FIN-001). It front-loads on the Engaged revenue-recognition moment and keys cleanly to milestones the pipeline already emits. Flag for PO: if cash flow needs more upfront, 50/30/20 or full-on-engagement are one config change.
3. **Free initial consultation → free for all leads.** Gating the first consult throttles the top of the funnel and would break the public booking page (FR-BOOK-010), which is a growth channel. Keep a config flag to switch to payment-gated later; v1 already ships the "Free Initial Consultation (30m)" type.
4. **First WhatsApp templates → submit exactly the SRS's five now** (booking confirm, booking reminder, document rejected, invoice due, offer congratulations) **plus account invitation.** They cover the highest-frequency, highest-trust touchpoints and unblock Phases 1–2. **Start submission in Phase 0** because Meta approval takes days (WP-0.7).
5. **Retention defaults → adopt NFR-PRV-003 as the working default, pending counsel sign-off.** Docs archived +18mo / deleted +5y unless re-engaged, audit 2y online, notification logs 1y, with legal-hold override. **This one is not mine to decide:** confirm the statutory retention period for financial records with your accountant (Bangladesh requirements typically mandate multi-year retention) and have legal approve the erasure/anonymisation workflow (NFR-PRV-002) before it ships.

---

## 7. Key risks & sequencing notes
- **Booking/slot engine and RBAC are the two highest-risk pieces.** Spike both early (a thin vertical slice in late Phase 0 / start of 1) before committing the rest of the module.
- **Vendor lead times gate schedule, not code:** Meta WhatsApp template + business verification, Google OAuth consent-screen verification, and SSLCommerz/bKash merchant onboarding all take real calendar time — start the paperwork in Phase 0.
- **The "browser off Supabase" cutover** is a behavioural change for the current app; do it behind the new API module by module, not big-bang.
- **Data migration is triage, not a script-and-forget** (§9.3): dry-run report first, unresolved records to a queue, legacy bucket read-only 90 days.

## 8. Immediate next actions (week 1)
1. Approve monorepo conversion approach (§1) and the 5 answers (§6).
2. Stand up WP-0.1/0.2 (monorepo skeleton, CI, docker-compose, staging).
3. Start WP-0.7 (WhatsApp templates) and the Google/SSLCommerz onboarding paperwork in parallel.
4. Draft the RBAC policy file (§3 primitive #2) and the tenancy scoping helper — everything else depends on them.
