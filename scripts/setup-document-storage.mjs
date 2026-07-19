/**
 * One-time setup: creates the 'client-documents' storage bucket in Supabase
 * and runs the migration to add file_url column.
 *
 * Usage: node scripts/setup-document-storage.mjs
 *
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_KEY env vars, OR the personal
 * access token passed as SUPABASE_PAT.
 */

const SUPABASE_URL = "https://owinpapcuwywxlmzomrr.supabase.co";
const PAT = process.env.SUPABASE_PAT || "";
const PROJECT_REF = "owinpapcuwywxlmzomrr";

// ---------- 1. Create storage bucket via Management API ----------
async function createBucket() {
  console.log("Creating 'client-documents' storage bucket...");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/storage`,
    { headers: { Authorization: `Bearer ${PAT}` } }
  );

  // Use the Storage REST API directly
  const storageRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
      apikey: "sb_publishable_AV1wy_xAW0ugAI0AtGwHLQ_O2tuQiGo",
    },
    body: JSON.stringify({
      id: "client-documents",
      name: "client-documents",
      public: false,
      file_size_limit: 10485760, // 10 MB
      allowed_mime_types: [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ],
    }),
  });

  if (storageRes.ok) {
    console.log("✓ Bucket 'client-documents' created.");
  } else {
    const body = await storageRes.text();
    if (body.includes("already exists")) {
      console.log("✓ Bucket 'client-documents' already exists.");
    } else {
      console.error("✗ Failed to create bucket:", storageRes.status, body);
    }
  }
}

// ---------- 2. Run migration via SQL endpoint ----------
async function runMigration() {
  console.log("Running migration 0009 (add file_url column)...");

  const sql = `ALTER TABLE visa_document_items ADD COLUMN IF NOT EXISTS file_url TEXT;`;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
      apikey: "sb_publishable_AV1wy_xAW0ugAI0AtGwHLQ_O2tuQiGo",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ query: sql }),
  });

  // Try via the SQL endpoint on the Management API instead
  const mgmtRes = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (mgmtRes.ok) {
    console.log("✓ Migration applied (file_url column added).");
  } else {
    const body = await mgmtRes.text();
    if (body.includes("already exists") || body.includes("column \"file_url\" of relation")) {
      console.log("✓ Column file_url already exists.");
    } else {
      console.error("✗ Migration failed:", mgmtRes.status, body);
      console.log("  → Run the SQL manually in Supabase SQL Editor:");
      console.log("    ALTER TABLE visa_document_items ADD COLUMN IF NOT EXISTS file_url TEXT;");
    }
  }
}

// ---------- 3. Create storage policies ----------
async function createPolicies() {
  console.log("Creating storage policies...");

  const policies = [
    {
      name: "Allow anon read on client-documents",
      definition: "TRUE",
      check: null,
      roles: ["anon", "authenticated"],
      operation: "SELECT",
    },
    {
      name: "Allow authenticated upload to client-documents",
      definition: "TRUE",
      check: "TRUE",
      roles: ["anon", "authenticated"],
      operation: "INSERT",
    },
    {
      name: "Allow authenticated update on client-documents",
      definition: "TRUE",
      check: "TRUE",
      roles: ["anon", "authenticated"],
      operation: "UPDATE",
    },
    {
      name: "Allow delete on client-documents",
      definition: "TRUE",
      check: null,
      roles: ["anon", "authenticated"],
      operation: "DELETE",
    },
  ];

  // Create policies via SQL since the storage API doesn't have a direct policy endpoint
  const policySql = `
    -- Storage policies for client-documents bucket
    DO $$ BEGIN
      -- Read policy
      CREATE POLICY "Allow read on client-documents"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'client-documents');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      -- Insert policy
      CREATE POLICY "Allow upload to client-documents"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'client-documents');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      -- Update policy
      CREATE POLICY "Allow update on client-documents"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'client-documents')
        WITH CHECK (bucket_id = 'client-documents');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      -- Delete policy
      CREATE POLICY "Allow delete on client-documents"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'client-documents');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `;

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: policySql }),
    }
  );

  if (res.ok) {
    console.log("✓ Storage policies created.");
  } else {
    const body = await res.text();
    console.error("✗ Policies failed:", res.status, body);
    console.log("  → Run the SQL manually in Supabase SQL Editor if needed.");
  }
}

async function main() {
  await createBucket();
  await runMigration();
  await createPolicies();
  console.log("\nSetup complete! You can now upload documents from the portal.");
}

main().catch(console.error);
