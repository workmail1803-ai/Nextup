// =============================================================================
// Country study-abroad guides — content + SEO metadata for the dedicated
// /destinations/[country] landing pages. Each page targets a specific query
// (e.g. "Italy study abroad agency") with accurate, useful content.
// =============================================================================

export interface CountryFaq {
  q: string;
  a: string;
}

export interface CountryGuide {
  slug: string;
  name: string;
  flag: string;
  /** <title> — keyword-first. */
  metaTitle: string;
  metaDescription: string;
  /** Hero H1. */
  heading: string;
  intro: string;
  keywords: string[];
  stats: { label: string; value: string }[];
  why: { title: string; desc: string }[];
  universities: string[];
  process: { step: string; desc: string }[];
  faqs: CountryFaq[];
}

export const COUNTRY_GUIDES: CountryGuide[] = [
  {
    slug: "italy",
    name: "Italy",
    flag: "🇮🇹",
    metaTitle: "Italy Study Abroad Agency for Bangladeshi Students | NextUp Mentor",
    metaDescription:
      "Looking for a trusted Italy study abroad agency in Bangladesh? NextUp Mentor guides you through public university admission, DSU scholarships, IELTS, and Italy student visa — honest, student-led mentorship from people who studied there.",
    heading: "Your agency for studying in Italy",
    intro:
      "Italy is one of the most affordable ways for a Bangladeshi student to earn a globally recognised European degree. Public universities charge little to no tuition, regional DSU scholarships cover living costs, and hundreds of programmes are taught in English. As a student-led Italy study abroad agency, NextUp Mentor walks you through every step — from choosing the right university to the VFS visa appointment.",
    keywords: [
      "Italy study abroad agency",
      "study in Italy from Bangladesh",
      "Italy student visa agency Bangladesh",
      "Italy university admission consultancy",
      "DSU scholarship Italy",
      "study in Italy agency",
    ],
    stats: [
      { label: "Public tuition / year", value: "€0 – €4,000" },
      { label: "Main intake", value: "September" },
      { label: "Living cost / month", value: "€450 – €800" },
      { label: "Post-study stay", value: "12 months" },
    ],
    why: [
      { title: "Low or no tuition", desc: "Public universities are heavily state-funded; many students pay only regional taxes, and low-income applicants often pay nothing." },
      { title: "DSU regional scholarships", desc: "Region-based DSU grants can cover tuition, a monthly stipend, free meals, and subsidised accommodation." },
      { title: "English-taught degrees", desc: "Hundreds of Bachelor's and Master's programmes are fully in English — no Italian required to start." },
      { title: "Schengen + work rights", desc: "Study, work part-time (up to 20h/week), and travel across 27 Schengen countries on one residence permit." },
    ],
    universities: [
      "University of Bologna",
      "Sapienza University of Rome",
      "University of Padua",
      "Politecnico di Milano",
      "University of Pisa",
      "University of Milan",
      "University of Turin",
      "Ca' Foscari University of Venice",
    ],
    process: [
      { step: "Profile & university match", desc: "We assess your SSC/HSC/Bachelor results and IELTS, then shortlist universities where you're genuinely competitive." },
      { step: "Documents & CIMEA", desc: "We prepare your Declaration of Value / CIMEA statement, transcripts, SOP and reference letters." },
      { step: "Pre-enrolment on Universitaly", desc: "We handle the Universitaly pre-enrolment and university application within the official deadlines." },
      { step: "DSU scholarship application", desc: "Where eligible, we apply for the regional DSU scholarship to cover your tuition and living costs." },
      { step: "Student visa (VFS)", desc: "We prepare your financial documents, accommodation proof and book the VFS appointment, then run mock interviews." },
    ],
    faqs: [
      { q: "Is studying in Italy really free for Bangladeshi students?", a: "Public university tuition in Italy is very low, and with an income-based DSU scholarship many students pay no tuition and receive a stipend. Private universities cost more. We help you target the affordable public options and apply for DSU." },
      { q: "Do I need IELTS to study in Italy?", a: "Most English-taught programmes ask for IELTS 6.0–6.5 (or equivalent). Some universities accept a Medium-of-Instruction certificate. We confirm each university's exact requirement before you apply." },
      { q: "Can I work while studying in Italy?", a: "Yes. A student residence permit allows part-time work up to 20 hours per week, which many students use to support living costs alongside their DSU scholarship." },
      { q: "How much bank balance do I need for an Italy student visa?", a: "You typically need to show proof of financial means (around €6,000+ for a year) plus tuition and accommodation. We prepare your financial file to match the consulate's current requirement." },
      { q: "Why use an agency instead of applying myself?", a: "Italy's process — Universitaly, CIMEA, DSU and VFS — has strict deadlines and easy-to-miss steps. A good agency saves you from costly mistakes; we've been through it ourselves and keep the guidance honest." },
    ],
  },
  {
    slug: "lithuania",
    name: "Lithuania",
    flag: "🇱🇹",
    metaTitle: "Lithuania Study Abroad Agency for Bangladeshi Students | NextUp Mentor",
    metaDescription:
      "NextUp Mentor is a trusted Lithuania study abroad agency for Bangladeshi students — affordable EU degrees, English-taught programmes, high acceptance, and full Lithuania student visa support from application to arrival.",
    heading: "Your agency for studying in Lithuania",
    intro:
      "Lithuania has become one of the smartest choices for Bangladeshi students who want an affordable, safe, English-taught EU degree with a genuinely high acceptance rate. As a student-led Lithuania study abroad agency, NextUp Mentor handles your university admission, TRC/visa file and pre-departure — with the honesty that only comes from having made the journey ourselves.",
    keywords: [
      "Lithuania study abroad agency",
      "study in Lithuania from Bangladesh",
      "Lithuania student visa agency Bangladesh",
      "Lithuania university admission consultancy",
      "study in Lithuania agency",
    ],
    stats: [
      { label: "Tuition / year", value: "€1,500 – €5,500" },
      { label: "Intakes", value: "September & February" },
      { label: "Living cost / month", value: "€400 – €650" },
      { label: "Post-study work", value: "Available" },
    ],
    why: [
      { title: "Affordable EU tuition", desc: "Degrees cost a fraction of Western Europe, with predictable annual fees and part-payment options at many universities." },
      { title: "High acceptance, English-taught", desc: "Strong acceptance rates for well-prepared applicants, with the majority of programmes fully in English." },
      { title: "Safe & growing economy", desc: "Lithuania is among Europe's safest countries and a fast-rising tech and fintech hub with graduate opportunities." },
      { title: "Schengen + work rights", desc: "Work part-time during studies and travel across the Schengen area on your Lithuanian residence permit." },
    ],
    universities: [
      "Vilnius University",
      "Kaunas University of Technology (KTU)",
      "Vytautas Magnus University",
      "Vilnius Gediminas Technical University (VILNIUS TECH)",
      "Mykolas Romeris University",
      "ISM University of Management and Economics",
    ],
    process: [
      { step: "Profile & university match", desc: "We review your academics and IELTS and match you to Lithuanian universities and programmes with strong acceptance for your profile." },
      { step: "Application & offer letter", desc: "We prepare and submit your application, transcripts, SOP and references, and follow up until your offer letter arrives." },
      { step: "Tuition payment & documents", desc: "We guide the tuition deposit, accommodation and the document set required for your national visa (D)." },
      { step: "TRC / student visa", desc: "We prepare your financial and supporting documents and book the visa appointment, with mock interview practice." },
      { step: "Pre-departure & arrival", desc: "Flight, accommodation, airport pickup and settling-in guidance so your first weeks are smooth." },
    ],
    faqs: [
      { q: "Why is Lithuania popular with Bangladeshi students?", a: "It combines affordable EU-standard tuition, English-taught programmes, a high acceptance rate for prepared applicants, safety, and Schengen access — an excellent value-for-money route into Europe." },
      { q: "What IELTS score do I need for Lithuania?", a: "Most universities ask for IELTS 6.0 overall (sometimes 5.5). A few accept a Medium-of-Instruction certificate. We confirm the exact requirement per programme before applying." },
      { q: "How much does it cost to study in Lithuania?", a: "Tuition is typically €1,500–€5,500 per year depending on the university and programme, with living costs around €400–€650 per month. We help you plan the full budget up front." },
      { q: "Can I work while studying in Lithuania?", a: "Yes — students can work part-time during their studies, and Lithuania's growing economy offers graduate opportunities after your degree." },
      { q: "How long does the Lithuania admission and visa process take?", a: "From application to visa it usually takes a few months, so we start early to hit intake deadlines. We manage every step and keep you updated throughout." },
    ],
  },
  {
    slug: "germany",
    name: "Germany",
    flag: "🇩🇪",
    metaTitle: "Germany Study Abroad Agency for Bangladeshi Students | NextUp Mentor",
    metaDescription:
      "NextUp Mentor helps Bangladeshi students study in Germany — tuition-free public universities, blocked-account guidance, APS, and German student visa support from a student-led education agency.",
    heading: "Your agency for studying in Germany",
    intro:
      "Germany offers tuition-free public universities and a world-class reputation in engineering, IT and research. NextUp Mentor guides Bangladeshi students through APS verification, the blocked account, admission and the German student visa — clearly and honestly.",
    keywords: [
      "Germany study abroad agency",
      "study in Germany from Bangladesh",
      "Germany student visa agency Bangladesh",
    ],
    stats: [
      { label: "Public tuition", value: "€0 (mostly)" },
      { label: "Intakes", value: "Winter & Summer" },
      { label: "Blocked account", value: "~€11,904 / year" },
      { label: "Post-study stay", value: "18 months" },
    ],
    why: [
      { title: "Tuition-free public universities", desc: "Most public universities charge no tuition — only a small semester contribution." },
      { title: "Engineering & research strength", desc: "Globally respected in engineering, IT, and applied sciences with strong industry links." },
      { title: "18-month job-seeker stay", desc: "Graduates can stay 18 months to find work, with clear routes to permanent residence." },
      { title: "Schengen access", desc: "Live, work part-time and travel across the Schengen area." },
    ],
    universities: [
      "Technical University of Munich",
      "RWTH Aachen University",
      "Technical University of Berlin",
      "University of Stuttgart",
      "Leibniz University Hannover",
    ],
    process: [
      { step: "Profile & APS", desc: "We assess eligibility and guide your APS certificate verification (required for Bangladeshi students)." },
      { step: "University applications", desc: "We shortlist and apply to public universities and uni-assist where applicable." },
      { step: "Blocked account & finances", desc: "We help you open a blocked account and prepare your financial documents." },
      { step: "German student visa", desc: "We prepare your visa file and book the appointment, with interview preparation." },
    ],
    faqs: [
      { q: "Is university in Germany really free?", a: "Most public universities charge no tuition — you pay only a small semester fee. You must, however, show funds in a blocked account for living costs." },
      { q: "Do I need APS for Germany?", a: "Yes. Bangladeshi students need an APS certificate verifying their academic documents before applying for admission and a visa. We guide you through it." },
      { q: "How much money do I need for a Germany student visa?", a: "You typically need to block roughly €11,904 for a year in a blocked account, plus health insurance. We prepare the full financial file." },
    ],
  },
  {
    slug: "poland",
    name: "Poland",
    flag: "🇵🇱",
    metaTitle: "Poland Study Abroad Agency for Bangladeshi Students | NextUp Mentor",
    metaDescription:
      "Study in Poland from Bangladesh with NextUp Mentor — affordable English-taught degrees, strong acceptance, and full Poland student visa support from a trusted education agency.",
    heading: "Your agency for studying in Poland",
    intro:
      "Poland offers affordable, English-taught EU degrees, a fast-growing economy and a welcoming environment for international students. NextUp Mentor supports Bangladeshi students through admission, the Poland student visa and pre-departure.",
    keywords: [
      "Poland study abroad agency",
      "study in Poland from Bangladesh",
      "Poland student visa agency Bangladesh",
    ],
    stats: [
      { label: "Tuition / year", value: "€2,000 – €4,500" },
      { label: "Intakes", value: "October & February" },
      { label: "Living cost / month", value: "€350 – €600" },
      { label: "Schengen", value: "Yes" },
    ],
    why: [
      { title: "Affordable EU degrees", desc: "Low tuition and living costs compared with Western Europe." },
      { title: "English-taught programmes", desc: "A wide range of Bachelor's and Master's fully in English." },
      { title: "Growing economy", desc: "One of Europe's fastest-growing economies with graduate opportunities." },
      { title: "Schengen + work rights", desc: "Work part-time and travel across the Schengen area." },
    ],
    universities: [
      "University of Warsaw",
      "Jagiellonian University",
      "Warsaw University of Technology",
      "AGH University of Krakow",
      "University of Wroclaw",
    ],
    process: [
      { step: "Profile & match", desc: "We match your profile to Polish universities with strong acceptance." },
      { step: "Application & offer", desc: "We prepare and submit applications and follow up to your offer letter." },
      { step: "Documents & tuition", desc: "We guide tuition payment, accommodation and document legalisation." },
      { step: "Poland student visa", desc: "We prepare your visa file and appointment, with interview practice." },
    ],
    faqs: [
      { q: "How much does it cost to study in Poland?", a: "Tuition is usually €2,000–€4,500 per year with living costs of €350–€600 per month — very affordable for an EU degree." },
      { q: "Do I need IELTS for Poland?", a: "Most English-taught programmes require IELTS 6.0 or an accepted equivalent. We confirm each programme's requirement." },
      { q: "Can I work while studying in Poland?", a: "Yes — students can work part-time, and full-time during holidays, under Polish student rules." },
    ],
  },
  {
    slug: "hungary",
    name: "Hungary",
    flag: "🇭🇺",
    metaTitle: "Hungary Study Abroad Agency for Bangladeshi Students | NextUp Mentor",
    metaDescription:
      "Study in Hungary from Bangladesh with NextUp Mentor — affordable English-taught EU degrees, scholarships, and full Hungary student visa support from a student-led education agency.",
    heading: "Your agency for studying in Hungary",
    intro:
      "Hungary combines affordable, English-taught EU degrees with a rich culture and central-European location. NextUp Mentor guides Bangladeshi students through admission, scholarships and the Hungary student visa.",
    keywords: [
      "Hungary study abroad agency",
      "study in Hungary from Bangladesh",
      "Hungary student visa agency Bangladesh",
    ],
    stats: [
      { label: "Tuition / year", value: "€2,000 – €5,000" },
      { label: "Intakes", value: "September & February" },
      { label: "Living cost / month", value: "€400 – €600" },
      { label: "Schengen", value: "Yes" },
    ],
    why: [
      { title: "Affordable EU degrees", desc: "Competitive tuition and low living costs for an EU-recognised degree." },
      { title: "English-taught programmes", desc: "Many Bachelor's and Master's programmes fully in English." },
      { title: "Central location", desc: "A central-European base with easy Schengen travel." },
      { title: "Scholarship options", desc: "Merit and government scholarship routes for strong applicants." },
    ],
    universities: [
      "University of Debrecen",
      "University of Szeged",
      "Eötvös Loránd University (ELTE)",
      "Budapest University of Technology and Economics",
      "University of Pécs",
    ],
    process: [
      { step: "Profile & match", desc: "We match your profile to Hungarian universities and scholarship options." },
      { step: "Application & offer", desc: "We prepare and submit applications and entrance requirements to your offer." },
      { step: "Documents & tuition", desc: "We guide tuition payment, accommodation and document preparation." },
      { step: "Hungary student visa", desc: "We prepare your visa file and appointment, with interview practice." },
    ],
    faqs: [
      { q: "Is Hungary affordable for Bangladeshi students?", a: "Yes — tuition is typically €2,000–€5,000 per year with living costs of €400–€600 per month, and scholarships are available for strong applicants." },
      { q: "Do I need IELTS for Hungary?", a: "Most English-taught programmes require IELTS 6.0 or an accepted equivalent. Some run an entrance exam. We confirm each programme's requirement." },
      { q: "Can I work while studying in Hungary?", a: "Yes — students may work part-time during studies under Hungarian rules." },
    ],
  },
];

export const COUNTRY_SLUGS = COUNTRY_GUIDES.map((c) => c.slug);

export function getCountryGuide(slug: string): CountryGuide | undefined {
  return COUNTRY_GUIDES.find((c) => c.slug === slug.toLowerCase());
}
