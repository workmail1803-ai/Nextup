"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, LogOut, MessageCircle } from "lucide-react";
import { usePortal } from "@/lib/portal/PortalContext";
import { portalSupabase } from "@/lib/portal/supabase-portal";
import { staffSupabase } from "@/lib/auth/supabase-staff";

const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";
const AVATAR_MAX = 3 * 1024 * 1024; // matches the bucket limit
const BUCKET = "client-avatars";

/** Destinations NextUp actually places students in. */
const COUNTRIES = ["Italy", "Lithuania", "Germany", "Poland", "Hungary"];

export default function PortalProfile() {
  const { client, mentor, preview, refresh, signOut } = usePortal();
  const sb = preview ? staffSupabase : portalSupabase;

  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Editable fields, seeded from the record once it arrives.
  const [whatsapp, setWhatsapp] = useState("");
  const [ssc, setSsc] = useState("");
  const [sscYear, setSscYear] = useState("");
  const [hsc, setHsc] = useState("");
  const [hscYear, setHscYear] = useState("");
  const [ielts, setIelts] = useState("");
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    if (!client) return;
    setWhatsapp(client.whatsapp ?? "");
    setSsc(client.ssc_result ?? "");
    setSscYear(client.ssc_year ? String(client.ssc_year) : "");
    setHsc(client.hsc_result ?? "");
    setHscYear(client.hsc_year ? String(client.hsc_year) : "");
    setIelts(client.ielts_score != null ? String(client.ielts_score) : "");
    setCountries(client.country_interest ?? []);
  }, [client]);

  // The bucket is private, so the photo is fetched through a short-lived signed
  // URL rather than a public link that would outlive the student's account.
  const avatarPath = (client as { avatar_url?: string | null } | null)?.avatar_url ?? null;
  useEffect(() => {
    if (!avatarPath) {
      setAvatarSrc(null);
      return;
    }
    let cancelled = false;
    sb.storage
      .from(BUCKET)
      .createSignedUrl(avatarPath, 3600)
      .then(({ data }) => {
        if (!cancelled) setAvatarSrc(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [avatarPath, sb]);

  if (!client) return null;

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > AVATAR_MAX) {
      setError("That image is over 3 MB. A normal phone photo is fine.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      // Fixed filename per client: replacing a photo should not leave the old
      // one behind in a private bucket nobody ever cleans out.
      const path = `${client!.id}/avatar.${ext}`;
      const { error: upErr } = await sb.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      if (preview) {
        await staffSupabase.from("clients").update({ avatar_url: path }).eq("id", client!.id);
      } else {
        const { error: rpcErr } = await portalSupabase.rpc("portal_update_profile", {
          p_avatar_url: path,
        });
        if (rpcErr) throw rpcErr;
      }
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That photo didn't upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        p_whatsapp: whatsapp.trim() || null,
        p_ssc_result: ssc.trim() || null,
        p_ssc_year: sscYear ? Number(sscYear) : null,
        p_hsc_result: hsc.trim() || null,
        p_hsc_year: hscYear ? Number(hscYear) : null,
        p_ielts_score: ielts ? Number(ielts) : null,
        p_country_interest: countries.length ? countries : null,
      };
      if (preview) {
        await staffSupabase
          .from("clients")
          .update({
            whatsapp: payload.p_whatsapp,
            ssc_result: payload.p_ssc_result,
            ssc_year: payload.p_ssc_year,
            hsc_result: payload.p_hsc_result,
            hsc_year: payload.p_hsc_year,
            ielts_score: payload.p_ielts_score,
            country_interest: payload.p_country_interest,
          })
          .eq("id", client!.id);
      } else {
        const { error: rpcErr } = await portalSupabase.rpc("portal_update_profile", payload);
        if (rpcErr) throw rpcErr;
      }
      setSaved(true);
      refresh();
      setTimeout(() => setSaved(false), 2600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save those details.");
    } finally {
      setSaving(false);
    }
  }

  const initials = client.full_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-5 pb-8 pt-7">
      <section>
        <p className="pf-label">Profile</p>
        <h1 className="pf-display mt-2.5 text-[1.9rem]">{client.full_name}</h1>
      </section>

      {/* Photo */}
      <section className="mt-6 flex items-center gap-4">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ background: "var(--pf-ink-3)", border: "1px solid var(--pf-rule-2)" }}
        >
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="pf-display text-[1.5rem]" style={{ color: "var(--pf-vellum-2)" }}>
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <input
            ref={fileRef}
            type="file"
            accept={AVATAR_ACCEPT}
            className="hidden"
            onChange={handlePhoto}
            aria-label="Upload a profile photo"
          />
          <button
            className="pf-btn pf-btn-quiet pf-press"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" /> {avatarSrc ? "Change photo" : "Add a photo"}
              </>
            )}
          </button>
          <p className="mt-2 text-xs" style={{ color: "var(--pf-vellum-3)" }}>
            Only your consultant sees this.
          </p>
        </div>
      </section>

      {/* Fixed details — shown, not editable, and it says why */}
      <section className="mt-7">
        <p className="pf-label mb-2.5">On file</p>
        <div className="pf-panel overflow-hidden">
          <Row label="Email" value={client.email ?? "—"} />
          <Row label="File" value={`NX-${new Date(client.created_at).getFullYear()}-${client.id.replace(/[^0-9a-f]/gi, "").slice(-4).toUpperCase()}`} />
          <Row label="Consultant" value={mentor?.full_name ?? "Not assigned yet"} />
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--pf-vellum-3)" }}>
          Your email is how you sign in, so your consultant changes it, not you.
        </p>
      </section>

      {/* Editable */}
      <section className="mt-7">
        <p className="pf-label mb-2.5">Your details</p>
        <div className="space-y-3.5">
          <Field label="WhatsApp" htmlFor="pf-whatsapp">
            <input
              id="pf-whatsapp"
              className="pf-input"
              inputMode="tel"
              placeholder="+8801XXXXXXXXX"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="SSC result" htmlFor="pf-ssc">
              <input id="pf-ssc" className="pf-input" placeholder="5.00" value={ssc} onChange={(e) => setSsc(e.target.value)} />
            </Field>
            <Field label="SSC year" htmlFor="pf-ssc-y">
              <input id="pf-ssc-y" className="pf-input" inputMode="numeric" placeholder="2019" value={sscYear} onChange={(e) => setSscYear(e.target.value)} />
            </Field>
            <Field label="HSC result" htmlFor="pf-hsc">
              <input id="pf-hsc" className="pf-input" placeholder="4.92" value={hsc} onChange={(e) => setHsc(e.target.value)} />
            </Field>
            <Field label="HSC year" htmlFor="pf-hsc-y">
              <input id="pf-hsc-y" className="pf-input" inputMode="numeric" placeholder="2021" value={hscYear} onChange={(e) => setHscYear(e.target.value)} />
            </Field>
          </div>

          <Field label="IELTS overall" htmlFor="pf-ielts">
            <input id="pf-ielts" className="pf-input" inputMode="decimal" placeholder="7.0" value={ielts} onChange={(e) => setIelts(e.target.value)} />
          </Field>

          <div>
            <p className="pf-label mb-2">Where you want to study</p>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => {
                const on = countries.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className="pf-btn pf-press"
                    aria-pressed={on}
                    style={
                      on
                        ? { background: "var(--pf-seal-soft)", borderColor: "var(--pf-seal-line)", color: "var(--pf-seal)" }
                        : { borderColor: "var(--pf-rule-2)", color: "var(--pf-vellum-2)" }
                    }
                    onClick={() => setCountries((prev) => (on ? prev.filter((x) => x !== c) : [...prev, c]))}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm" role="alert" style={{ color: "var(--pf-halt)" }}>
              {error}
            </p>
          )}

          <button className="pf-btn pf-btn-seal pf-press w-full py-3" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving
              </>
            ) : saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </section>

      {/* Getting hold of a human */}
      {mentor && (
        <section className="mt-8">
          <p className="pf-label mb-2.5">Need to talk</p>
          <a
            href="https://wa.me/8801726867991"
            target="_blank"
            rel="noopener noreferrer"
            className="pf-btn pf-btn-quiet pf-press w-full py-3"
          >
            <MessageCircle className="h-4 w-4" /> Message {mentor.full_name.split(" ")[0]} on WhatsApp
          </a>
        </section>
      )}

      <button
        className="pf-press mt-8 flex w-full items-center justify-center gap-2 py-3 text-sm"
        style={{ color: "var(--pf-vellum-3)" }}
        onClick={() => void signOut()}
      >
        <LogOut className="h-4 w-4" /> {preview ? "Switch student" : "Sign out"}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="pf-record">
      <span className="pf-label w-24 shrink-0">{label}</span>
      <span className="min-w-0 flex-1 truncate text-[0.875rem]">{value}</span>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="pf-label mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
