// =============================================================================
// Eligibility engine — academic credential conversions
//
// Pure functions, no I/O. Each maps a Bangladeshi credential onto a global
// scale used by destination universities. These tables are *indicative* — they
// follow standard WES / Anabin / NOOSR / UK-NARIC conventions but real credential
// evaluation is course-by-course, so results are framed as estimates.
// =============================================================================

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * Bangladeshi SSC/HSC GPA (5.0 scale) → US GPA (4.0 scale).
 * WES-style percentage banding rather than a linear rescale.
 */
export function hscGpaToUsGpa(gpa5: number): number {
  if (gpa5 >= 5.0) return 4.0;
  if (gpa5 >= 4.0) return 3.0;
  if (gpa5 >= 3.5) return 2.0;
  if (gpa5 >= 3.0) return 1.0;
  return 0.0;
}

/**
 * Tertiary CGPA → US 4.0 scale.
 * A 4.0-scale Bangladeshi CGPA is treated ≈ 1:1 by US graduate programs; a
 * 5.0-scale CGPA is banded like the HSC. Clamped to [0, 4].
 */
export function cgpaToUsGpa(cgpa: number, scale = 4.0): number {
  if (!cgpa || !scale) return 0;
  if (scale <= 4.0) return clamp(cgpa, 0, 4.0);
  if (scale === 5.0) return hscGpaToUsGpa(cgpa);
  // Any other scale: linear rescale to 4.0.
  return clamp((cgpa / scale) * 4.0, 0, 4.0);
}

/** Rough percentage equivalent of a CGPA, for AU NOOSR percentage cutoffs. */
export function cgpaToPercent(cgpa: number, scale = 4.0): number {
  if (!cgpa || !scale) return 0;
  return clamp((cgpa / scale) * 100, 0, 100);
}

/**
 * Modified Bavarian Formula → German grade (1.0 best … 4.0 pass, >4 fail).
 *   grade = 1 + 3 · (Nmax − Nd) / (Nmax − Nmin)
 * with Nmax = 4.0, Nmin = 2.0 (the doc's parameters). Lower is better.
 */
export function bavarianGrade(cgpa: number, scale = 4.0): number {
  const nd = cgpaToUsGpa(cgpa, scale);
  const nMax = 4.0;
  const nMin = 2.0;
  if (nd <= nMin) return 5.0; // below the passing floor → fail band
  const grade = 1 + 3 * ((nMax - nd) / (nMax - nMin));
  return Math.round(clamp(grade, 1.0, 5.0) * 100) / 100;
}

/** Bangladeshi 4-year bachelor CGPA → British honours classification. */
export function ukHonoursClass(cgpa: number, scale = 4.0): string {
  const g = cgpaToUsGpa(cgpa, scale);
  if (g >= 3.75) return "First Class (1st)";
  if (g >= 3.25) return "Upper Second (2:1)";
  if (g >= 2.5) return "Lower Second (2:2)";
  if (g >= 2.2) return "Third Class (3rd)";
  return "Below honours threshold";
}

// -----------------------------------------------------------------------------
// Institution-derived recognition (Australia NOOSR section, German Anabin)
// Resolved from the catalog's INSTITUTIONS table; see catalog.ts.
// -----------------------------------------------------------------------------

/** O/A-Level letter grade → unified 5.0 grade point (kept for completeness). */
export function levelGradeToPoint(grade: string): number {
  const table: Record<string, number> = {
    "A*": 5, A: 5, B: 4, C: 3, D: 2, E: 1, U: 0,
  };
  return table[grade.toUpperCase()] ?? 0;
}
