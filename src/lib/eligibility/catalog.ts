// =============================================================================
// Eligibility engine — hardcoded catalog
//
// The single source of program + institution data. This is the ONLY file that
// changes when an API is introduced: replace these constants with a fetch that
// returns the same shapes, and the engine in evaluate.ts is untouched.
//
// Data compiled from the NextUp "Global Student Eligibility Database" research
// doc (2026 intake). Figures are indicative and should be verified per intake.
// =============================================================================

import type { AnabinStatus, Program } from "./types";

// -----------------------------------------------------------------------------
// Bangladeshi institutions → Australian NOOSR section + German Anabin status.
// Section-1 = the 12 designated public universities (AU Dept. of Education).
// -----------------------------------------------------------------------------

export interface InstitutionOption {
  key: string;
  label: string;
  noosrSection: 1 | 2;
  anabin: AnabinStatus;
}

export const INSTITUTIONS: InstitutionOption[] = [
  { key: "buet", label: "BUET — Bangladesh Univ. of Engineering & Technology", noosrSection: 1, anabin: "H+" },
  { key: "du", label: "University of Dhaka (DU)", noosrSection: 1, anabin: "H+" },
  { key: "ru", label: "University of Rajshahi (RU)", noosrSection: 1, anabin: "H+" },
  { key: "cu", label: "University of Chittagong (CU)", noosrSection: 1, anabin: "H+" },
  { key: "ju", label: "Jahangirnagar University (JU)", noosrSection: 1, anabin: "H+" },
  { key: "kuet", label: "KUET — Khulna Univ. of Engineering & Technology", noosrSection: 1, anabin: "H+" },
  { key: "ruet", label: "RUET — Rajshahi Univ. of Engineering & Technology", noosrSection: 1, anabin: "H+" },
  { key: "cuet", label: "CUET — Chittagong Univ. of Engineering & Technology", noosrSection: 1, anabin: "H+" },
  { key: "duet", label: "DUET — Dhaka Univ. of Engineering & Technology", noosrSection: 1, anabin: "H+" },
  { key: "bau", label: "Bangladesh Agricultural University (BAU)", noosrSection: 1, anabin: "H+" },
  { key: "bsmmu", label: "BSMMU — Bangabandhu Sheikh Mujib Medical University", noosrSection: 1, anabin: "H+" },
  { key: "bsmrau", label: "BSMRAU — Bangabandhu Sheikh Mujibur Rahman Agri. University", noosrSection: 1, anabin: "H+" },
  // Common non–Section-1 buckets.
  { key: "other-public", label: "Other public university", noosrSection: 2, anabin: "H+/-" },
  { key: "private", label: "Private university (BRAC, NSU, AIUB, IUB…)", noosrSection: 2, anabin: "H+/-" },
];

export function resolveInstitution(key?: string): InstitutionOption | null {
  if (!key) return null;
  return INSTITUTIONS.find((i) => i.key === key) ?? null;
}

// -----------------------------------------------------------------------------
// Programs
// -----------------------------------------------------------------------------

export const PROGRAMS: Program[] = [
  // ---------------- Italy ----------------
  {
    id: "it-sapienza-msc-cs",
    university: "Sapienza University of Rome",
    city: "Rome",
    country: "Italy",
    programName: "MSc in Computer Science",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 5.5, toefl: 80, moiAccepted: true },
    academic: {
      minUsGpa: 2.8,
      acceptedFields: ["computer-science", "software-engineering", "data-science"],
      subjectPolicy: "strict",
    },
    tuition: "€300–€1,500 / year (ISEE-based)",
    scholarship: "DSU / LazioDisco — up to €7,910/yr + housing & meals (need-based)",
    deadline: "Non-EU: 22 Dec – 15 May",
  },
  {
    id: "it-sapienza-bsc-cs-ai",
    university: "Sapienza University of Rome",
    city: "Rome",
    country: "Italy",
    programName: "BSc in Applied Computer Science & Artificial Intelligence",
    degreeLevel: "Bachelor",
    field: "computer-science",
    english: { ielts: 5.5 },
    academic: { minHscGpa: 4.0, subjectPolicy: "any" },
    tuition: "€300–€1,500 / year (ISEE-based)",
    scholarship: "Need-based LazioDisco regional scholarship",
    deadline: "Non-EU pre-selection closes ~15 May",
  },

  // ---------------- Germany ----------------
  {
    id: "de-tum-msc-informatics",
    university: "Technical University of Munich (TUM)",
    city: "Munich",
    country: "Germany",
    programName: "MSc in Informatics",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 6.5, toefl: 88, pte: 65 },
    academic: {
      requiresAnabinHPlus: true,
      acceptedFields: ["computer-science", "software-engineering", "data-science"],
      subjectPolicy: "preferred",
    },
    tests: { greRequired: true, greQuantMin: 164, greAWMin: 4.0 },
    tuition: "€12,000 / year (non-EU)",
    scholarship: "DAAD & private foundation merit scholarships",
    deadline: "Winter intake: 1 Apr – 31 May",
    notes: "Admission decided on a 100-point aptitude assessment.",
  },
  {
    id: "de-tum-msc-cse",
    university: "Technical University of Munich (TUM)",
    city: "Munich",
    country: "Germany",
    programName: "MSc in Computational Science & Engineering",
    degreeLevel: "Master",
    field: "engineering",
    english: { ielts: 6.5, toefl: 88, pte: 65 },
    academic: {
      requiresAnabinHPlus: true,
      acceptedFields: ["engineering", "physics", "mathematics", "computer-science", "data-science"],
      subjectPolicy: "strict",
    },
    tests: { greRequired: true, greQuantMin: 157, greAWMin: 3.0 },
    tuition: "€12,000 / year (non-EU)",
    scholarship: "DAAD & private scholarships",
    deadline: "Winter intake: 1 Feb – 31 May",
  },
  {
    id: "de-stuttgart-msc-cs",
    university: "University of Stuttgart",
    city: "Stuttgart",
    country: "Germany",
    programName: "MSc in Computer Science",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 6.5, toefl: 95 },
    academic: {
      requiresAnabinHPlus: true,
      maxGermanGrade: 2.5,
      acceptedFields: ["computer-science", "software-engineering"],
      subjectPolicy: "preferred",
    },
    tuition: "€3,000 / year (non-EU)",
    scholarship: "Exemptions for outstanding profiles",
    deadline: "Winter intake: 15 Nov – 15 Jan",
  },

  // ---------------- Singapore ----------------
  {
    id: "sg-nus-mcomp-spec",
    university: "National University of Singapore (NUS)",
    city: "Singapore",
    country: "Singapore",
    programName: "Master of Computing (Specialisation)",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 6.0, toefl: 90 },
    academic: {
      minUsGpa: 3.5,
      acceptedFields: ["computer-science", "software-engineering"],
      subjectPolicy: "strict",
    },
    tests: { greRequired: true, greQuantMin: 160, greVerbalMin: 160, greAWMin: 3.5 },
    tuition: "~SGD 41,000 / year",
    scholarship: "Limited graduate assistantships",
    deadline: "1 Oct – 31 Jan",
  },
  {
    id: "sg-nus-mcomp-general",
    university: "National University of Singapore (NUS)",
    city: "Singapore",
    country: "Singapore",
    programName: "Master of Computing (General Track)",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 6.0, toefl: 90 },
    academic: { subjectPolicy: "any" },
    tests: { greRequired: true, greCombinedQVMin: 320, greAWMin: 3.5, gmatMin: 650 },
    tuition: "~SGD 37,060 / year",
    deadline: "31 Jan (August intake)",
    notes: "Prior IT work experience improves selection.",
  },

  // ---------------- Canada ----------------
  {
    id: "ca-concordia-macs",
    university: "Concordia University",
    city: "Montreal",
    country: "Canada",
    programName: "Master of Applied Computer Science",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 6.5, ieltsMinBand: 6.0 },
    academic: {
      minUsGpa: 3.0,
      acceptedFields: ["computer-science", "engineering", "mathematics"],
      subjectPolicy: "preferred",
    },
    tuition: "~CAD 28,000–32,000 / year",
    scholarship: "Auto-considered for Entrance Awards",
    deadline: "1 Jun (Fall) · 1 Oct (Winter)",
  },
  {
    id: "ca-concordia-meng-iss",
    university: "Concordia University",
    city: "Montreal",
    country: "Canada",
    programName: "MEng in Information Systems Security",
    degreeLevel: "Master",
    field: "engineering",
    english: { ielts: 6.5 },
    academic: {
      minUsGpa: 3.0,
      acceptedFields: ["engineering", "computer-science"],
      subjectPolicy: "strict",
    },
    tuition: "~CAD 26,000–30,000 / year",
    scholarship: "Entrance fellowships",
    deadline: "Varies by semester",
  },

  // ---------------- United States ----------------
  {
    id: "us-sjsu-ms-cs",
    university: "San Jose State University (SJSU)",
    city: "San Jose",
    country: "United States",
    programName: "MS in Computer Science",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 6.5, toefl: 80, pte: 53, duolingo: 120 },
    academic: {
      minUsGpa: 3.0,
      acceptedFields: ["computer-science", "software-engineering"],
      subjectPolicy: "preferred",
    },
    tests: { greRequired: true, greQuantMin: 155, greVerbalMin: 150 },
    tuition: "~USD 17,000–19,300 / year",
    scholarship: "Departmental TA / RA positions",
    deadline: "Fall: 31 Oct · Spring: 31 Jul",
  },
  {
    id: "us-sjsu-ms-se",
    university: "San Jose State University (SJSU)",
    city: "San Jose",
    country: "United States",
    programName: "MS in Software Engineering",
    degreeLevel: "Master",
    field: "software-engineering",
    english: { ielts: 6.5, toefl: 80 },
    academic: {
      minUsGpa: 2.75,
      acceptedFields: ["software-engineering", "computer-science", "engineering"],
      subjectPolicy: "strict",
    },
    tests: { greRequired: true, greCombinedQVMin: 305, greAWMin: 3.0, greWaiverWithExperience: 5 },
    tuition: "~USD 16,500–18,500 / year",
    scholarship: "Academic achievement awards",
    deadline: "See graduate admissions portal",
  },

  // ---------------- Australia ----------------
  {
    id: "au-melbourne-mit",
    university: "University of Melbourne",
    city: "Melbourne",
    country: "Australia",
    programName: "Master of Information Technology",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 6.5, ieltsMinBand: 6.0, pte: 58, toefl: 79 },
    academic: {
      subjectPolicy: "any",
      noosrSection1MinPct: 65,
      noosrSection2MinPct: 75,
    },
    tuition: "~AUD 48,000–54,000 / year",
    scholarship: "International Merit Scholarships (up to 50% tuition)",
    deadline: "31 Oct (Sem 1) · 30 Apr (Sem 2)",
  },

  // ---------------- United Kingdom ----------------
  {
    id: "uk-greenwich-msc-cs",
    university: "University of Greenwich",
    city: "London",
    country: "United Kingdom",
    programName: "MSc in Computer Science",
    degreeLevel: "Master",
    field: "computer-science",
    english: { ielts: 6.5, ieltsMinBand: 5.5, duolingo: 120 },
    academic: { minUsGpa: 2.5, subjectPolicy: "any" },
    tuition: "~£16,800–20,050 / year",
    scholarship: "Greenwich International Scholarship (up to £3,000)",
    deadline: "Rolling — submit by May for September intake",
  },
  {
    id: "uk-greenwich-bsc-cs",
    university: "University of Greenwich",
    city: "London",
    country: "United Kingdom",
    programName: "BSc (Hons) Computer Science",
    degreeLevel: "Bachelor",
    field: "computer-science",
    english: { ielts: 6.0, ieltsMinBand: 5.5 },
    academic: { minHscGpa: 5.0, requires13thYear: true, subjectPolicy: "any" },
    tuition: "~£15,000–17,000 / year",
    deadline: "Rolling",
    notes: "HSC is 12 years; direct Year-1 entry needs HSC 5.0, otherwise a Foundation Year.",
  },

  // ---------------- Japan ----------------
  {
    id: "jp-mext-grad",
    university: "MEXT (Govt. of Japan Scholarship)",
    country: "Japan",
    programName: "Master's / Doctoral Research Scholarship",
    degreeLevel: "Master",
    field: "other",
    english: { ielts: 6.5, moiAccepted: true },
    academic: { minUsGpa: 3.5, subjectPolicy: "any" },
    tuition: "Fully funded",
    scholarship: "100% tuition waiver + ¥117k–147k/mo stipend + return airfare",
    deadline: "Apply via Japanese Embassy in Dhaka by mid-April",
    notes: "Applicant must be under 35 and pass embassy written tests.",
  },
];

/** Distinct destination countries present in the catalog (for the form). */
export const COUNTRIES: string[] = Array.from(new Set(PROGRAMS.map((p) => p.country))).sort();
