#!/usr/bin/env node
// Applies one migration file to the production database through the Supabase
// Management API.
//
// The token is read from SUPABASE_ACCESS_TOKEN — never hardcoded here, because
// this file is committed and a management token grants the whole project.
//
//   SUPABASE_ACCESS_TOKEN=sbp_... node scripts/apply-migration.mjs 0029_x.sql
//
// The Management API runs the whole file as a single statement batch, so a
// failure anywhere leaves nothing behind. Every migration in this repo is
// written to be idempotent, so re-running a partially-understood one is safe.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const REF = process.env.SUPABASE_PROJECT_REF || "owinpapcuwywxlmzomrr";
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const file = process.argv[2];

if (!TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is not set.");
  process.exit(1);
}
if (!file) {
  console.error("Usage: node scripts/apply-migration.mjs <file.sql>");
  process.exit(1);
}

const path = file.includes("/") || file.includes("\\")
  ? file
  : join("supabase", "migrations", file);

const query = readFileSync(path, "utf8");

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`FAILED ${res.status}\n${text}`);
  process.exit(1);
}
console.log(`applied ${path}`);
console.log(text.slice(0, 2000));
