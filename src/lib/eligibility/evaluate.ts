// =============================================================================
// Eligibility engine — the evaluator
//
// evaluate(profile) is the single entry point. It is pure and synchronous:
//   normalize → filter (degree + country) → score each program → bucket + rank.
// No network, no DB. The catalog is injected (defaults to the hardcoded one),
// so a future API only has to supply the same Program[] shape.
// =============================================================================

import {
  bavarianGrade,
  cgpaToPercent,
  cgpaToUsGpa,
  ukHonoursClass,
} from "./conversions";
import { PROGRAMS, resolveInstitution } from "./catalog";
import type {
  ApplicantProfile,
  EvaluationResult,
  Likelihood,
  NormalizedProfile,
  Program,
  ProgramMatch,
  Reason,
  Verdict,
} from "./types";

const fmt = (n: number, d = 1) => n.toFixed(d);

// -----------------------------------------------------------------------------
// 1. Normalize the applicant once
// -----------------------------------------------------------------------------

export function normalize(profile: ApplicantProfile): NormalizedProfile {
  const inst = resolveInstitution(profile.institutionKey);
  const hasTertiary = profile.studyLevel === "Master" && typeof profile.cgpa === "number";
  const scale = profile.cgpaScale ?? 4.0;

  return {
    raw: profile,
    usGpa: hasTertiary ? cgpaToUsGpa(profile.cgpa!, scale) : null,
    germanGrade: hasTertiary ? bavarianGrade(profile.cgpa!, scale) : null,
    ukClass: hasTertiary ? ukHonoursClass(profile.cgpa!, scale) : null,
    gpaPercent: hasTertiary ? cgpaToPercent(profile.cgpa!, scale) : null,
    noosrSection: inst ? inst.noosrSection : null,
    anabinStatus: inst ? inst.anabin : "N/A",
    educationYears: profile.studyLevel === "Master" ? 16 : 12,
  };
}

// -----------------------------------------------------------------------------
// 2. Per-criterion outcomes
// -----------------------------------------------------------------------------

type Outcome =
  | { type: "pass"; label: string }
  | { type: "gap"; label: string }                          // bridgeable → conditional
  | { type: "pathway"; label: string; pathway: string }     // not direct, but a route exists
  | { type: "block"; label: string };                       // genuine mismatch

function checkSubject(n: NormalizedProfile, p: Program): Outcome | null {
  const policy = p.academic.subjectPolicy ?? "any";
  const accepted = p.academic.acceptedFields;
  if (policy === "any" || !accepted) return null;

  const field = n.raw.studyLevel === "Master" ? n.raw.bachelorField : n.raw.intendedField;
  if (!field) return null;
  if (accepted.includes(field)) return { type: "pass", label: "Academic background aligns with the program" };

  if (policy === "strict") return { type: "block", label: "Academic background not aligned with this program" };
  return { type: "gap", label: "Prerequisite / bridge courses may be required (different background)" };
}

function checkEnglish(p: Program, profile: ApplicantProfile): Outcome {
  const { englishTest: test, englishOverall: overall, englishMinBand: band } = profile;
  const e = p.english;

  if (test === "None") {
    if (e.moiAccepted) return { type: "gap", label: "Submit a Medium-of-Instruction letter, or take IELTS" };
    return {
      type: "pathway",
      label: "No English test on file",
      pathway: `Take IELTS (target ${e.ielts ?? 6.5} overall) or an accepted equivalent`,
    };
  }

  // Map the applicant's test to this program's threshold for that test.
  const req: Record<string, number | undefined> = {
    IELTS: e.ielts,
    TOEFL: e.toefl,
    PTE: e.pte,
    Duolingo: e.duolingo,
  };
  const threshold = req[test];

  if (threshold === undefined) {
    return { type: "gap", label: `This program lists IELTS ${e.ielts ?? "—"}; confirm ${test} is accepted` };
  }
  if (overall === undefined) {
    return { type: "gap", label: `Add your ${test} score (needs ${threshold})` };
  }

  // IELTS minimum-band rule.
  if (test === "IELTS" && e.ieltsMinBand && band !== undefined && band < e.ieltsMinBand) {
    return { type: "gap", label: `Raise your lowest IELTS band to ${e.ieltsMinBand} (currently ${band})` };
  }

  if (overall >= threshold) return { type: "pass", label: `${test} ${overall} meets ${threshold}` };

  // How far below? IELTS uses 0.5 granularity; others use a small relative margin.
  const nearMargin = test === "IELTS" ? 0.5 : test === "Duolingo" ? 10 : 5;
  if (threshold - overall <= nearMargin) {
    return { type: "gap", label: `${test} ${overall} — just below ${threshold}; a small improvement qualifies` };
  }
  return {
    type: "pathway",
    label: `${test} ${overall} below the ${threshold} minimum`,
    pathway: `Improve ${test} to ${threshold}+ (IELTS prep available)`,
  };
}

function checkAcademic(n: NormalizedProfile, p: Program): Outcome[] {
  const out: Outcome[] = [];
  const a = p.academic;

  if (p.degreeLevel === "Bachelor") {
    const hsc = n.raw.hscGpa;
    if (a.requires13thYear) {
      // UK: HSC is 12 years. Direct Year-1 entry needs HSC 5.0; otherwise Foundation.
      if (hsc !== undefined && hsc >= 5.0) {
        out.push({ type: "gap", label: "Direct entry possible (HSC 5.0); placement is competitive" });
      } else {
        out.push({
          type: "pathway",
          label: "HSC is 12 years — below the 13-year bar for direct UK entry",
          pathway: "International Foundation Year (accepts HSC ≥4.0 & IELTS 5.5), then progress to Year 1",
        });
      }
      return out;
    }
    if (a.minHscGpa !== undefined) {
      if (hsc === undefined) out.push({ type: "gap", label: "Add your HSC GPA to confirm the academic bar" });
      else if (hsc >= a.minHscGpa) out.push({ type: "pass", label: `HSC ${fmt(hsc, 2)} meets ${a.minHscGpa}` });
      else if (a.minHscGpa - hsc <= 0.3) out.push({ type: "gap", label: `HSC ${fmt(hsc, 2)} just below ${a.minHscGpa}` });
      else out.push({
        type: "pathway",
        label: `HSC ${fmt(hsc, 2)} below ${a.minHscGpa}`,
        pathway: "Foundation / pre-degree pathway recommended",
      });
    }
    return out;
  }

  // --- Master ---
  if (a.minUsGpa !== undefined) {
    if (n.usGpa === null) out.push({ type: "gap", label: "Add your CGPA for an accurate GPA assessment" });
    else if (n.usGpa >= a.minUsGpa) out.push({ type: "pass", label: `GPA ≈ ${fmt(n.usGpa, 2)}/4.0 meets ${a.minUsGpa}` });
    else if (a.minUsGpa - n.usGpa <= 0.25) out.push({ type: "gap", label: `GPA ≈ ${fmt(n.usGpa, 2)} — slightly under ${a.minUsGpa}; strengthen with SOP / experience` });
    else out.push({
      type: "pathway",
      label: `GPA ≈ ${fmt(n.usGpa, 2)} below ${a.minUsGpa}`,
      pathway: "Pre-Master's / qualifying program recommended",
    });
  }

  if (a.maxGermanGrade !== undefined) {
    if (n.germanGrade === null) out.push({ type: "gap", label: "Add your CGPA to compute the German grade" });
    else if (n.germanGrade <= a.maxGermanGrade) out.push({ type: "pass", label: `German grade ≈ ${fmt(n.germanGrade, 2)} (meets ≤ ${a.maxGermanGrade})` });
    else if (n.germanGrade - a.maxGermanGrade <= 0.3) out.push({ type: "gap", label: `German grade ≈ ${fmt(n.germanGrade, 2)}, just above ≤ ${a.maxGermanGrade}` });
    else out.push({
      type: "pathway",
      label: `German grade ≈ ${fmt(n.germanGrade, 2)} above ≤ ${a.maxGermanGrade}`,
      pathway: "Strengthen profile or consider a program with a softer cutoff",
    });
  }

  return out;
}

function checkAnabin(n: NormalizedProfile, p: Program): Outcome | null {
  if (!p.academic.requiresAnabinHPlus) return null;
  if (n.anabinStatus === "H+") return { type: "pass", label: "Institution recognised by Germany (Anabin H+)" };
  return {
    type: "pathway",
    label: "Institution not confirmed as Anabin H+",
    pathway: "Verify Anabin status, or complete a Studienkolleg / 1–2 years of study before applying",
  };
}

function checkNoosr(n: NormalizedProfile, p: Program): Outcome | null {
  const { noosrSection1MinPct: s1, noosrSection2MinPct: s2 } = p.academic;
  if (s1 === undefined && s2 === undefined) return null;
  const section = n.noosrSection ?? 2;
  const pct = n.gpaPercent;
  if (pct === null) return { type: "gap", label: "Add your CGPA for the Australian (NOOSR) assessment" };

  if (section === 1) {
    if (s1 !== undefined && pct >= s1) return { type: "pass", label: `Section-1 university, GPA ≈ ${Math.round(pct)}% meets ≥ ${s1}%` };
    return { type: "pathway", label: `GPA ≈ ${Math.round(pct)}% below the Section-1 bar (${s1}%)`, pathway: "Strengthen GPA evidence or consider a Pre-Master's" };
  }
  // Section 2: a higher bar plus a near-universal pathway requirement.
  if (s2 !== undefined && pct >= s2) {
    return { type: "gap", label: `Section-2 institution — Pre-Master's or 2+ yrs relevant experience usually required (GPA ≈ ${Math.round(pct)}%)` };
  }
  return { type: "pathway", label: `Section-2 institution, GPA ≈ ${Math.round(pct)}% below ${s2}%`, pathway: "Pre-Master's pathway program required" };
}

function checkTests(profile: ApplicantProfile, p: Program): Outcome | null {
  const t = p.tests;
  if (!t?.greRequired) return null;

  if (t.greWaiverWithExperience && (profile.yearsExperience ?? 0) >= t.greWaiverWithExperience) {
    return { type: "pass", label: `GRE waived (≥ ${t.greWaiverWithExperience} yrs experience)` };
  }

  // GMAT alternative (e.g. NUS general track).
  if (t.gmatMin && profile.gmat !== undefined && profile.gmat >= t.gmatMin) {
    return { type: "pass", label: `GMAT ${profile.gmat} meets ${t.gmatMin}` };
  }

  const hasGre = profile.greQuant !== undefined || profile.greVerbal !== undefined;
  if (!hasGre) {
    const target = [
      t.greQuantMin && `Quant ≥ ${t.greQuantMin}`,
      t.greVerbalMin && `Verbal ≥ ${t.greVerbalMin}`,
      t.greCombinedQVMin && `Q+V ≥ ${t.greCombinedQVMin}`,
      t.greAWMin && `AW ≥ ${t.greAWMin}`,
    ].filter(Boolean).join(", ");
    return { type: "gap", label: `GRE required and not yet provided (${target})` };
  }

  const q = profile.greQuant ?? 0;
  const v = profile.greVerbal ?? 0;
  const aw = profile.greAW ?? 0;
  const shortfalls: string[] = [];
  let near = true;

  if (t.greQuantMin && q < t.greQuantMin) { shortfalls.push(`Quant ${q} vs ${t.greQuantMin}`); if (t.greQuantMin - q > 3) near = false; }
  if (t.greVerbalMin && v < t.greVerbalMin) { shortfalls.push(`Verbal ${v} vs ${t.greVerbalMin}`); if (t.greVerbalMin - v > 3) near = false; }
  if (t.greCombinedQVMin && q + v < t.greCombinedQVMin) { shortfalls.push(`Q+V ${q + v} vs ${t.greCombinedQVMin}`); if (t.greCombinedQVMin - (q + v) > 5) near = false; }
  if (t.greAWMin && aw < t.greAWMin) { shortfalls.push(`AW ${aw} vs ${t.greAWMin}`); if (t.greAWMin - aw > 0.5) near = false; }

  if (shortfalls.length === 0) return { type: "pass", label: "GRE meets the program cutoffs" };
  if (near) return { type: "gap", label: `GRE slightly below (${shortfalls.join("; ")}) — a retake likely qualifies` };
  return {
    type: "pathway",
    label: `GRE below cutoffs (${shortfalls.join("; ")})`,
    pathway: "Retake the GRE or target a program with a lower requirement",
  };
}

// -----------------------------------------------------------------------------
// 3. Combine outcomes into a verdict + score for one program
// -----------------------------------------------------------------------------

function buildMatch(n: NormalizedProfile, p: Program): ProgramMatch {
  const outcomes: Outcome[] = [];
  const subject = checkSubject(n, p);
  if (subject) outcomes.push(subject);
  outcomes.push(checkEnglish(p, n.raw));
  outcomes.push(...checkAcademic(n, p));
  const anabin = checkAnabin(n, p);
  if (anabin) outcomes.push(anabin);
  const noosr = checkNoosr(n, p);
  if (noosr) outcomes.push(noosr);
  const tests = checkTests(n.raw, p);
  if (tests) outcomes.push(tests);

  const reasons: Reason[] = outcomes.map((o) => ({
    kind: o.type === "pass" ? "pass" : o.type === "block" ? "blocker" : "gap",
    label: o.label,
  }));

  const blocks = outcomes.filter((o) => o.type === "block").length;
  const pathways = outcomes.filter((o): o is Extract<Outcome, { type: "pathway" }> => o.type === "pathway");
  const gaps = outcomes.filter((o) => o.type === "gap").length;

  let verdict: Verdict;
  let likelihood: Likelihood;
  let score: number;
  let pathway: string | undefined;

  if (blocks > 0) {
    verdict = "not-eligible";
    likelihood = "—";
    score = 0;
  } else if (pathways.length > 0) {
    verdict = "pathway";
    likelihood = "Competitive";
    score = 40 - pathways.length * 4 - gaps * 2;
    pathway = pathways.map((p2) => p2.pathway).join(" · ");
  } else if (gaps > 0) {
    verdict = "conditional";
    likelihood = "Medium";
    score = 70 - gaps * 6;
  } else {
    verdict = "eligible";
    likelihood = "High";
    score = 90;
  }

  // Tie-breaker so stronger-fit programs sort first within a bucket.
  const fit = (n.usGpa ?? 0) * 2 + (n.raw.englishOverall ?? 0);
  score += fit;

  return { program: p, verdict, likelihood, score, reasons, pathway };
}

// -----------------------------------------------------------------------------
// 4. Public entry point
// -----------------------------------------------------------------------------

export function evaluate(
  profile: ApplicantProfile,
  catalog: Program[] = PROGRAMS,
): EvaluationResult {
  const summary = normalize(profile);
  const prefs = profile.preferredCountries ?? [];

  const matches: ProgramMatch[] = [];
  for (const p of catalog) {
    if (p.degreeLevel !== profile.studyLevel) continue;          // wrong level → filter out
    if (prefs.length > 0 && !prefs.includes(p.country)) continue; // outside preferences
    matches.push(buildMatch(summary, p));
  }

  const byScore = (a: ProgramMatch, b: ProgramMatch) => b.score - a.score;

  return {
    summary,
    eligible: matches.filter((m) => m.verdict === "eligible").sort(byScore),
    conditional: matches.filter((m) => m.verdict === "conditional").sort(byScore),
    pathway: matches.filter((m) => m.verdict === "pathway").sort(byScore),
    notEligibleCount: matches.filter((m) => m.verdict === "not-eligible").length,
  };
}
