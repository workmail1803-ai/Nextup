// =============================================================================
// Eligibility engine — shared types
//
// Pure data contracts for the matching engine. No React, no I/O, no framework
// imports — so this logic can run in the browser today and behind an API later
// without changes. See `evaluate.ts` for the entry point.
// =============================================================================

export type StudyLevel = "Bachelor" | "Master";

export type EnglishTest = "IELTS" | "TOEFL" | "PTE" | "Duolingo" | "None";

/** German credential-recognition status (KMK Anabin database). */
export type AnabinStatus = "H+" | "H+/-" | "H-" | "N/A";

/** Canonical subject buckets used by both the form and the catalog. */
export interface FieldOption {
  key: string;
  label: string;
}

export const FIELDS: FieldOption[] = [
  { key: "computer-science", label: "Computer Science / IT" },
  { key: "software-engineering", label: "Software Engineering" },
  { key: "data-science", label: "Data Science / AI" },
  { key: "engineering", label: "Engineering (other)" },
  { key: "mathematics", label: "Mathematics / Statistics" },
  { key: "business", label: "Business / Management" },
  { key: "other", label: "Other / Undecided" },
];

// -----------------------------------------------------------------------------
// What the student gives us
// -----------------------------------------------------------------------------

export interface ApplicantProfile {
  studyLevel: StudyLevel;

  // Secondary (always collected) — Bangladeshi 5.0 scale
  sscGpa?: number;
  hscGpa?: number;

  // Tertiary (Master applicants) — original CGPA on its own scale
  bachelorField?: string;        // FieldOption.key
  cgpa?: number;
  cgpaScale?: number;            // usually 4.0
  institutionKey?: string;       // see catalog INSTITUTIONS

  // English proficiency
  englishTest: EnglishTest;
  englishOverall?: number;
  englishMinBand?: number;       // lowest single band (IELTS)

  // Standardized tests (optional)
  greQuant?: number;
  greVerbal?: number;
  greAW?: number;
  gmat?: number;
  yearsExperience?: number;

  // Preferences
  intendedField?: string;        // FieldOption.key
  preferredCountries?: string[]; // empty = anywhere
}

// -----------------------------------------------------------------------------
// What the engine derives once, up front (so every program comparison is cheap)
// -----------------------------------------------------------------------------

export interface NormalizedProfile {
  raw: ApplicantProfile;
  usGpa: number | null;          // converted to the US 4.0 scale
  germanGrade: number | null;    // modified Bavarian formula (1 = best, 4+ = fail)
  ukClass: string | null;        // British honours classification
  gpaPercent: number | null;     // approximate percentage, for AU NOOSR checks
  noosrSection: 1 | 2 | null;    // Australian country-profile tier
  anabinStatus: AnabinStatus;    // German recognition of the institution
  educationYears: number;        // 12 (HSC) or 16 (4-yr bachelor)
}

// -----------------------------------------------------------------------------
// The hardcoded catalog (later: fetched from an API — same shape)
// -----------------------------------------------------------------------------

export type SubjectPolicy = "strict" | "preferred" | "any";

export interface Program {
  id: string;
  university: string;
  city?: string;
  country: string;
  programName: string;
  degreeLevel: StudyLevel | "PhD";
  field: string;

  english: {
    ielts?: number;
    ieltsMinBand?: number;
    toefl?: number;
    pte?: number;
    duolingo?: number;
    moiAccepted?: boolean;       // medium-of-instruction letter accepted instead
  };

  academic: {
    minUsGpa?: number;           // Master cutoff on the 4.0 scale
    minHscGpa?: number;          // Bachelor cutoff on the 5.0 scale
    maxGermanGrade?: number;     // Germany — eligible when germanGrade <= this
    requiresAnabinHPlus?: boolean;
    acceptedFields?: string[];
    subjectPolicy?: SubjectPolicy;
    noosrSection1MinPct?: number;
    noosrSection2MinPct?: number;
    requires13thYear?: boolean;  // UK undergrad (HSC is only 12 years)
  };

  tests?: {
    greRequired?: boolean;
    greQuantMin?: number;
    greVerbalMin?: number;
    greAWMin?: number;
    greCombinedQVMin?: number;
    gmatMin?: number;
    greWaiverWithExperience?: number; // years of experience that waive the GRE
  };

  tuition: string;
  scholarship?: string;
  deadline?: string;
  notes?: string;
}

// -----------------------------------------------------------------------------
// What the engine returns
// -----------------------------------------------------------------------------

export type Verdict = "eligible" | "conditional" | "pathway" | "not-eligible";

export type Likelihood = "High" | "Medium" | "Competitive" | "—";

/** One human-readable reason attached to a match. */
export interface Reason {
  kind: "pass" | "gap" | "blocker";
  label: string;
}

export interface ProgramMatch {
  program: Program;
  verdict: Verdict;
  likelihood: Likelihood;
  score: number;                 // 0–100, for ranking within a bucket
  reasons: Reason[];
  pathway?: string;              // how to bridge the gap, when not directly eligible
}

export interface EvaluationResult {
  summary: NormalizedProfile;
  eligible: ProgramMatch[];
  conditional: ProgramMatch[];
  pathway: ProgramMatch[];
  notEligibleCount: number;
}
