// =============================================================================
// Country process guides — "what is the process, how much, what are the steps"
//
// Researched for NextUp's focus countries (Italy, Lithuania) plus light notes
// for the others. Figures are for the 2026 intake and are INDICATIVE — visa
// fees, financial thresholds and deadlines change yearly, so each guide links to
// the official source. Always confirm before a student acts.
// =============================================================================

export interface CountryGuide {
  country: string;
  visa: string;
  intro: string;
  steps: string[];
  facts: { label: string; value: string }[];
  scholarship?: string;
  sources: { label: string; url: string }[];
}

export const COUNTRY_GUIDES: Record<string, CountryGuide> = {
  Italy: {
    country: "Italy",
    visa: "National Visa Type D (Study)",
    intro:
      "Public universities are cheap and income-based (ISEE), with strong regional DSU scholarships that can cover tuition, housing and meals. Non-EU applicants must pre-enrol through the government Universitaly portal before applying for the visa.",
    steps: [
      "Pre-enrol on the Universitaly portal (opens ~April–May) and choose your program.",
      "Secure the university's admission / pre-acceptance.",
      "Prepare documents: legalised HSC/bachelor transcripts with certified translations + IELTS (≈6.0) or an Italian B2 (CILS/CELI) for Italian-taught courses.",
      "Buy health insurance covering €30,000 in medical expenses.",
      "Show proof of funds — about €6,947/year (€534.41/month).",
      "Book VFS Global Dhaka for biometrics and lodge the Type D visa.",
      "After arrival, apply for the Permesso di Soggiorno (residence permit) within 8 working days.",
    ],
    facts: [
      { label: "Public tuition (non-EU)", value: "≈ €400–4,000 / year (ISEE-based)" },
      { label: "Proof of funds", value: "≈ €6,947 / year (€534.41/mo)" },
      { label: "Living cost", value: "≈ €700–1,000 / month" },
      { label: "Work rights", value: "Up to 20 hrs/week (1,040 hrs/yr)" },
      { label: "Post-study", value: "12-month job-search permit" },
      { label: "Visa processing", value: "Apply Jun–Aug for a Fall start" },
    ],
    scholarship:
      "Regional DSU scholarships (e.g. LazioDisco, ER-GO, EDISU) are need-based on ISEE Parificato and can fully waive tuition plus provide housing, meal vouchers and an annual stipend.",
    sources: [
      { label: "Universitaly (official)", url: "https://www.universitaly.it/" },
      { label: "Study in Europe — Italy", url: "https://education.ec.europa.eu/study-in-europe/country-profiles/italy" },
      { label: "VFS Global Italy (Bangladesh)", url: "https://visa.vfsglobal.com/one-pager/italy/bangladesh/english/" },
    ],
  },

  Lithuania: {
    country: "Lithuania",
    visa: "National (D) Visa + Temporary Residence Permit",
    intro:
      "Affordable, English-friendly and with a fast, predictable permit process. Most degrees are taught in English at a fraction of Western-European tuition. Non-EU students apply for a National D visa and then a Temporary Residence Permit (TRP) via the online MIGRIS system.",
    steps: [
      "Apply and receive an admission decision + study agreement from the university.",
      "Pay the tuition deposit / first instalment as required.",
      "Submit the Temporary Residence Permit application online via MIGRIS.",
      "Apply for the National (D) multiple-entry visa at the nearest Lithuanian embassy / VFS before travelling.",
      "Show proof of funds — about €1,153/month (2026 minimum wage) for the stay.",
      "Give biometrics at the visa centre and buy health insurance.",
      "Collect the TRP card; it is issued for 1–2 years and is renewable.",
    ],
    facts: [
      { label: "Tuition", value: "≈ €2,000–6,000 / yr (med ≈ €14,000)" },
      { label: "Proof of funds", value: "≈ €1,153 / month (2026)" },
      { label: "Living cost", value: "≈ €500–700 / month" },
      { label: "Visa + TRP fees", value: "€120 + €120 + €80 state fee" },
      { label: "Processing time", value: "45–90 days" },
      { label: "Work rights", value: "Allowed alongside studies" },
    ],
    scholarship:
      "Lithuanian state scholarships, Erasmus+ and university merit awards are open to non-EU students; baseline tuition is already low versus Western Europe.",
    sources: [
      { label: "Study in Lithuania (official)", url: "https://www.studyinlithuania.lt/" },
      { label: "Migration Dept. — MIGRIS", url: "https://www.migracija.lt/en" },
      { label: "Study in Europe — Lithuania", url: "https://education.ec.europa.eu/study-in-europe/country-profiles/lithuania" },
    ],
  },
};

export function getCountryGuide(country: string): CountryGuide | null {
  return COUNTRY_GUIDES[country] ?? null;
}
