"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ExternalLink,
  Wallet,
  Calendar,
  Award,
  Info,
  GraduationCap,
  Languages,
  Building2,
  MapPin,
  ListChecks,
} from "lucide-react";
import {
  DIRECTORY,
  DIRECTORY_COUNTRIES,
  DIRECTORY_TOTAL,
  BROAD_FIELDS,
  BROAD_FIELD_LABEL,
  COUNTRY_BANDS,
  tuitionLabel,
  ieltsValue,
  tuitionFloor,
  type DirectoryUniversity,
} from "@/lib/eligibility/universities";
import { getCountryGuide } from "@/lib/eligibility/country-guides";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

const PAGE = 60;

const TUITION_BANDS = [
  { value: "all", label: "Any tuition" },
  { value: "3000", label: "≤ €3,000 / yr" },
  { value: "6000", label: "≤ €6,000 / yr" },
  { value: "12000", label: "≤ €12,000 / yr" },
];

const IELTS_BANDS = [
  { value: "all", label: "Any IELTS" },
  { value: "5.5", label: "≤ 5.5" },
  { value: "6.0", label: "≤ 6.0" },
  { value: "6.5", label: "≤ 6.5" },
];

const typeChip: Record<string, string> = {
  Public: "bg-[#eaf3ed] text-positive",
  Private: "bg-accent-soft text-accent-ink",
  "Applied Sciences": "bg-paper-2 text-muted",
};

// -----------------------------------------------------------------------------
// Country process guide (Italy / Lithuania)
// -----------------------------------------------------------------------------

function CountryGuidePanel({ country }: { country: string }) {
  const guide = getCountryGuide(country);
  if (!guide) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card overflow-hidden"
    >
      <div className="border-b border-line bg-paper-2 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-display text-xl font-semibold text-ink">Studying in {guide.country}</h3>
          <span className="chip bg-accent-soft text-accent-ink">{guide.visa}</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{guide.intro}</p>
      </div>
      <div className="grid gap-8 p-6 md:grid-cols-2">
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <ListChecks className="h-4 w-4 text-accent" strokeWidth={2} /> The process, step by step
          </p>
          <ol className="space-y-2.5">
            {guide.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted">
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-ink text-[0.7rem] font-semibold text-on-ink">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Key facts</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {guide.facts.map((f) => (
              <div key={f.label} className="rounded-xl border border-line p-3">
                <dt className="text-xs text-faint">{f.label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
          {guide.scholarship && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">
              <Award className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.75} />
              <span>{guide.scholarship}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-6 py-3 text-xs text-muted">
        <span className="text-faint">Official sources:</span>
        {guide.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
            {s.label}
            <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
    </motion.div>
  );
}

// A lightweight snapshot for countries without a full guide.
function CountrySnapshot({ country }: { country: string }) {
  const b = COUNTRY_BANDS[country];
  if (!b) return null;
  return (
    <div className="card flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
      <p className="text-sm font-semibold text-ink">Studying in {country}</p>
      <div>
        <p className="font-display text-base font-semibold text-ink">€{b.tuitionMin.toLocaleString()}–€{b.tuitionMax.toLocaleString()}/yr</p>
        <p className="text-xs text-faint">Typical international tuition</p>
      </div>
      <div>
        <p className="font-display text-base font-semibold text-ink">≈ {b.ielts.toFixed(1)}</p>
        <p className="text-xs text-faint">Typical IELTS</p>
      </div>
      <p className="text-xs text-faint">Country-typical estimates — confirm program details on each university&apos;s site.</p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// University card
// -----------------------------------------------------------------------------

function UniversityCard({ u }: { u: DirectoryUniversity }) {
  const tuition = tuitionLabel(u);
  const officialLink = (
    <a
      href={u.website}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-accent transition-colors hover:text-accent-2"
    >
      Official site
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );

  if (!u.curated) {
    // World-directory card: name + country + official link + country-typical band.
    return (
      <div className="card card-hover flex flex-col p-5">
        <h3 className="font-display text-base font-semibold leading-snug text-ink">{u.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
          <MapPin className="h-3.5 w-3.5 flex-none text-faint" strokeWidth={1.75} />
          {u.country}
        </p>
        {tuition && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Wallet className="h-4 w-4 flex-none text-faint" strokeWidth={1.75} />
            <span className="font-medium text-ink">{tuition.text}</span>
            <span className="text-faint">· country-typical</span>
          </p>
        )}
        <p className="mt-2 flex items-start gap-1.5 text-xs text-faint">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-none" strokeWidth={1.75} />
          Program-level fees & entry vary — verify on the official site.
        </p>
        {officialLink}
      </div>
    );
  }

  // Curated, richly-detailed card.
  return (
    <div className="card card-hover flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold leading-snug text-ink">{u.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5 flex-none text-faint" strokeWidth={1.75} />
            {u.city ? `${u.city} · ` : ""}{u.country}
          </p>
        </div>
        {u.type && <span className={`chip flex-none ${typeChip[u.type]}`}>{u.type}</span>}
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        {tuition && (
          <div className="flex items-center gap-2 text-muted">
            <Wallet className="h-4 w-4 flex-none text-faint" strokeWidth={1.75} />
            <span className="font-medium text-ink">{tuition.text}</span>
            <span className="text-faint">· non-EU, indicative</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted">
          <GraduationCap className="h-4 w-4 flex-none text-faint" strokeWidth={1.75} />
          {u.levels?.join(" · ")}
          {u.ielts !== undefined ? ` · IELTS ≈ ${u.ielts.toFixed(1)}` : ""}
        </div>
        {u.language && (
          <div className="flex items-center gap-2 text-muted">
            <Languages className="h-4 w-4 flex-none text-faint" strokeWidth={1.75} />
            {u.language}
          </div>
        )}
        {u.intakes && (
          <div className="flex items-center gap-2 text-muted">
            <Calendar className="h-4 w-4 flex-none text-faint" strokeWidth={1.75} />
            Intakes: {u.intakes.join(", ")}
          </div>
        )}
      </dl>

      {u.fields && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {u.fields.map((f) => (
            <span key={f} className="rounded-full bg-paper-2 px-2.5 py-1 text-xs font-medium text-muted">
              {BROAD_FIELD_LABEL[f]}
            </span>
          ))}
        </div>
      )}

      {(u.scholarship || u.note) && (
        <p className="mt-3 flex items-start gap-2 text-xs text-muted">
          {u.scholarship ? (
            <Award className="mt-0.5 h-3.5 w-3.5 flex-none text-accent" strokeWidth={1.75} />
          ) : (
            <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-faint" strokeWidth={1.75} />
          )}
          <span>{u.scholarship ?? u.note}</span>
        </p>
      )}

      {officialLink}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Explorer
// -----------------------------------------------------------------------------

export default function UniversityExplorer() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Italy");
  const [field, setField] = useState("all");
  const [maxTuition, setMaxTuition] = useState("all");
  const [maxIelts, setMaxIelts] = useState("all");
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DIRECTORY.filter((u) => {
      if (country !== "all" && u.country !== country) return false;
      if (field !== "all" && !(u.fields ?? []).includes(field)) return false;
      if (maxTuition !== "all") {
        const floor = tuitionFloor(u);
        if (floor === null || floor > Number(maxTuition)) return false;
      }
      if (maxIelts !== "all") {
        const iv = ieltsValue(u);
        if (iv === null || iv > Number(maxIelts)) return false;
      }
      if (q && !`${u.name} ${u.country}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, country, field, maxTuition, maxIelts]);

  // Reset the visible count back to one page whenever the filters change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(PAGE);
  }, [query, country, field, maxTuition, maxIelts]);

  const visible = filtered.slice(0, shown);

  return (
    <div className="container-edge max-w-6xl">
      {/* Controls */}
      <div className="card p-4 md:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${DIRECTORY_TOTAL.toLocaleString()} universities by name or country…`}
            className={`${inputCls} pl-10`}
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-faint">Country</span>
            <select className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="all">All countries</option>
              {DIRECTORY_COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-faint">Field (tagged unis)</span>
            <select className={inputCls} value={field} onChange={(e) => setField(e.target.value)}>
              <option value="all">All fields</option>
              {BROAD_FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-faint">Max tuition</span>
            <select className={inputCls} value={maxTuition} onChange={(e) => setMaxTuition(e.target.value)}>
              {TUITION_BANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-faint">Max IELTS</span>
            <select className={inputCls} value={maxIelts} onChange={(e) => setMaxIelts(e.target.value)}>
              {IELTS_BANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Country guide / snapshot */}
      {country !== "all" && (
        <div className="mt-6">
          {getCountryGuide(country) ? <CountryGuidePanel country={country} /> : <CountrySnapshot country={country} />}
        </div>
      )}

      {/* Count */}
      <div className="mt-8 mb-4 flex items-baseline gap-3">
        <Building2 className="h-5 w-5 flex-none text-accent" strokeWidth={1.75} />
        <p className="text-sm text-muted">
          <span className="font-display text-lg font-semibold text-ink">{filtered.length.toLocaleString()}</span>{" "}
          universit{filtered.length === 1 ? "y" : "ies"}
          {country !== "all" ? ` in ${country}` : ` of ${DIRECTORY_TOTAL.toLocaleString()} worldwide`}
        </p>
      </div>

      {/* Grid */}
      {visible.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((u) => (
              <UniversityCard key={u.id} u={u} />
            ))}
          </div>
          {filtered.length > shown && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShown((s) => s + PAGE)}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink"
              >
                Load more
                <span className="text-faint">({(filtered.length - shown).toLocaleString()} more)</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card p-10 text-center text-muted">
          No universities match these filters. Try clearing the search or widening a filter.
        </div>
      )}

      {/* Honesty footer */}
      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-line bg-paper-2 p-5 text-sm text-muted">
        <Info className="mt-0.5 h-5 w-5 flex-none text-accent" strokeWidth={1.75} />
        <p className="leading-relaxed">
          This directory lists <span className="font-semibold text-ink">{DIRECTORY_TOTAL.toLocaleString()}</span> universities worldwide (open
          data). For most, we show the official site plus a <span className="font-medium text-ink">country-typical</span> cost band —
          program-level tuition, intakes and entry requirements always live on the university&apos;s own site. Our deepest, hand-checked
          coverage is <span className="font-medium text-ink">Italy</span> and <span className="font-medium text-ink">Lithuania</span>. Want a
          personalized shortlist?{" "}
          <a href="/contact" className="font-semibold text-accent hover:underline">
            Talk to a mentor
          </a>
          .
        </p>
      </div>
    </div>
  );
}
