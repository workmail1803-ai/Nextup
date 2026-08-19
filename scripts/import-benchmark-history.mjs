/**
 * Seed the waiting-time benchmark from the pre-wipe archive.
 *
 * WHAT IT IMPORTS
 *   For every archived client: how many days passed between the record being
 *   created and it last being touched, filed against the stage it had reached.
 *   That is a `to_stage` measurement — "days from enquiry to reaching this
 *   stage" — and it is marked `inferred`, because updated_at moves for any edit
 *   and is only a proxy for the transition.
 *
 * WHAT IT DELIBERATELY DOES NOT IMPORT
 *   `in_stage` durations. The archive holds no stage history, so time-spent-in-
 *   a-stage cannot be recovered. Those samples accumulate from live transitions
 *   via the trigger in migration 0015.
 *
 * NO NAMES, NO IDS, NO EMAILS are written — only (stage, days, country).
 *
 * Usage:
 *   node scripts/import-benchmark-history.mjs ./backups/<timestamp>/clients.json
 */

import { readFileSync } from "node:fs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY.");
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-benchmark-history.mjs <clients.json>");
  process.exit(1);
}

const clients = JSON.parse(readFileSync(file, "utf-8"));
console.log(`read ${clients.length} archived clients from ${file}`);

const rows = [];
let skipped = 0;

for (const c of clients) {
  // 'lead' is the entry point, so "days to reach lead" is always zero and
  // carries no information. 'closed' is an exit, not a milestone.
  if (!c.stage || c.stage === "lead" || c.stage === "closed") {
    skipped++;
    continue;
  }
  const created = new Date(c.created_at);
  const updated = new Date(c.updated_at ?? c.created_at);
  if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) {
    skipped++;
    continue;
  }
  const days = (updated.getTime() - created.getTime()) / 86_400_000;
  // A same-day record tells us nothing about elapsed time; a decade-long one is
  // a data error rather than a slow application.
  if (!(days > 0.5) || days > 3650) {
    skipped++;
    continue;
  }

  rows.push({
    stage: c.stage,
    metric: "to_stage",
    days: Math.round(days * 100) / 100,
    country: Array.isArray(c.country_interest) && c.country_interest.length ? c.country_interest[0] : null,
    source: "inferred",
    completed_at: updated.toISOString(),
  });
}

console.log(`derived ${rows.length} samples (${skipped} skipped)\n`);

const byStage = rows.reduce((acc, r) => {
  (acc[r.stage] ??= []).push(r.days);
  return acc;
}, {});
for (const [stage, days] of Object.entries(byStage)) {
  const sorted = [...days].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  console.log(`  ${stage.padEnd(12)} n=${String(days.length).padStart(3)}  median ${Math.round(med)}d`);
}

if (rows.length === 0) {
  console.log("\nnothing to import.");
  process.exit(0);
}

// Idempotency guard. Duplicate durations are legitimate data, so this cannot be
// enforced with a unique index — it has to be "has this import already run?".
const existing = await fetch(
  `${SUPABASE_URL}/rest/v1/stage_duration_samples?select=id&source=eq.inferred&metric=eq.to_stage&limit=1`,
  { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
);
const already = await existing.json();
if (Array.isArray(already) && already.length > 0 && !process.argv.includes("--force")) {
  console.log("\narchive samples are already present — nothing to do.");
  console.log("re-run with --force only if you have cleared them first.");
  process.exit(0);
}

const res = await fetch(`${SUPABASE_URL}/rest/v1/stage_duration_samples`, {
  method: "POST",
  headers: {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify(rows),
});

if (!res.ok) {
  console.error(`\nimport failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`\nimported ${rows.length} anonymised samples.`);
