// =============================================================================
// University directory — the "Explore" dataset
//
// A browsable directory of universities, focused on Italy and Lithuania (NextUp's
// primary destinations) with a representative world set. Figures are INDICATIVE
// per-year, non-EU, in EUR — tuition in Italy is ISEE/income-based and Lithuanian
// fees vary by program, so every card links to the official site to verify.
//
// Hardcoded by design (no API). To grow to hundreds, append rows here or, later,
// swap this constant for a fetch returning the same University[] shape.
//
// Sources for the tuition/process baselines: study.eu, mastersportal.com,
// European Education Area country profiles, and each university's official site.
// =============================================================================

import { WORLD_RAW } from "./world-universities";

export interface BroadField {
  key: string;
  label: string;
}

export const BROAD_FIELDS: BroadField[] = [
  { key: "eng", label: "Engineering & IT" },
  { key: "biz", label: "Business & Economics" },
  { key: "med", label: "Medicine & Health" },
  { key: "sci", label: "Sciences" },
  { key: "art", label: "Arts & Design" },
  { key: "hum", label: "Humanities & Law" },
  { key: "soc", label: "Social Sciences" },
];

export const BROAD_FIELD_LABEL: Record<string, string> = Object.fromEntries(
  BROAD_FIELDS.map((f) => [f.key, f.label]),
);

export type Level = "Bachelor" | "Master" | "PhD";

export interface University {
  id: string;
  name: string;
  city: string;
  country: string;
  type: "Public" | "Private" | "Applied Sciences";
  website: string;
  fields: string[]; // BroadField keys
  levels: Level[];
  language: string;
  ielts: number; // typical minimum overall (indicative)
  tuitionMin: number; // EUR / year, non-EU, indicative
  tuitionMax: number;
  intakes: string[];
  scholarship?: string;
  note?: string;
}

const ALL: Level[] = ["Bachelor", "Master", "PhD"];
const BM: Level[] = ["Bachelor", "Master"];

// -----------------------------------------------------------------------------
// 🇮🇹 ITALY — primary focus. Public universities are ISEE/income-based, so the
// low end of each range reflects need-based reductions; non-EU flat rates sit
// higher. English-taught degrees are concentrated at Master's level.
// -----------------------------------------------------------------------------

const ITALY: University[] = [
  { id: "it-sapienza", name: "Sapienza University of Rome", city: "Rome", country: "Italy", type: "Public", website: "https://www.uniroma1.it/en", fields: ["eng", "sci", "hum", "soc", "med", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 400, tuitionMax: 2900, intakes: ["Fall"], scholarship: "DSU LazioDisco — need-based waiver + housing + meals" },
  { id: "it-bologna", name: "University of Bologna", city: "Bologna", country: "Italy", type: "Public", website: "https://www.unibo.it/en", fields: ["eng", "sci", "hum", "soc", "biz", "med"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1500, tuitionMax: 3000, intakes: ["Fall"], scholarship: "ER-GO regional study grants" },
  { id: "it-padova", name: "University of Padua", city: "Padua", country: "Italy", type: "Public", website: "https://www.unipd.it/en", fields: ["eng", "sci", "med", "soc", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 2600, tuitionMax: 3500, intakes: ["Fall"], scholarship: "Padua International Excellence Scholarships" },
  { id: "it-unimi", name: "University of Milan (Statale)", city: "Milan", country: "Italy", type: "Public", website: "https://www.unimi.it/en", fields: ["sci", "med", "hum", "soc", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 900, tuitionMax: 4000, intakes: ["Fall"] },
  { id: "it-polimi", name: "Politecnico di Milano", city: "Milan", country: "Italy", type: "Public", website: "https://www.polimi.it/en", fields: ["eng", "art", "sci"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 900, tuitionMax: 3900, intakes: ["Fall"], scholarship: "Merit-based DSU & PoliMi scholarships" },
  { id: "it-bocconi", name: "Bocconi University", city: "Milan", country: "Italy", type: "Private", website: "https://www.unibocconi.eu", fields: ["biz", "soc"], levels: ALL, language: "English", ielts: 7.0, tuitionMin: 14000, tuitionMax: 16500, intakes: ["Fall"], scholarship: "Need & merit tuition waivers", note: "Top-ranked for economics, finance & management" },
  { id: "it-unito", name: "University of Turin", city: "Turin", country: "Italy", type: "Public", website: "https://en.unito.it", fields: ["sci", "hum", "soc", "med", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 2500, tuitionMax: 3000, intakes: ["Fall"], scholarship: "EDISU Piemonte grants" },
  { id: "it-polito", name: "Politecnico di Torino", city: "Turin", country: "Italy", type: "Public", website: "https://www.polito.it/en", fields: ["eng", "art"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 2500, tuitionMax: 3500, intakes: ["Fall"], scholarship: "EDISU & PoliTo scholarships" },
  { id: "it-unipi", name: "University of Pisa", city: "Pisa", country: "Italy", type: "Public", website: "https://www.unipi.it/index.php/english", fields: ["eng", "sci", "hum", "med"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1500, tuitionMax: 2900, intakes: ["Fall"], scholarship: "DSU Toscana grants" },
  { id: "it-unifi", name: "University of Florence", city: "Florence", country: "Italy", type: "Public", website: "https://www.unifi.it/en", fields: ["eng", "sci", "hum", "art", "med"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1500, tuitionMax: 2600, intakes: ["Fall"] },
  { id: "it-unipv", name: "University of Pavia", city: "Pavia", country: "Italy", type: "Public", website: "https://web-en.unipv.it", fields: ["eng", "sci", "med", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1500, tuitionMax: 3800, intakes: ["Fall"], scholarship: "EDiSU Pavia + university scholarships" },
  { id: "it-unitn", name: "University of Trento", city: "Trento", country: "Italy", type: "Public", website: "https://www.unitn.it/en", fields: ["eng", "sci", "soc", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1500, tuitionMax: 3500, intakes: ["Fall"], scholarship: "Opera Universitaria + merit grants" },
  { id: "it-uniroma3", name: "Roma Tre University", city: "Rome", country: "Italy", type: "Public", website: "https://www.uniroma3.it/en", fields: ["eng", "hum", "soc", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2500, intakes: ["Fall"], scholarship: "DSU LazioDisco" },
  { id: "it-uniroma2", name: "University of Rome Tor Vergata", city: "Rome", country: "Italy", type: "Public", website: "https://web.uniroma2.it/en", fields: ["eng", "sci", "med", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 600, tuitionMax: 3000, intakes: ["Fall"], scholarship: "DSU LazioDisco" },
  { id: "it-unina", name: "University of Naples Federico II", city: "Naples", country: "Italy", type: "Public", website: "https://www.international.unina.it", fields: ["eng", "sci", "med", "hum"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2500, intakes: ["Fall"], scholarship: "ADISURC Campania grants" },
  { id: "it-unimib", name: "University of Milan-Bicocca", city: "Milan", country: "Italy", type: "Public", website: "https://en.unimib.it", fields: ["sci", "med", "soc", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 700, tuitionMax: 4000, intakes: ["Fall"] },
  { id: "it-unive", name: "Ca' Foscari University of Venice", city: "Venice", country: "Italy", type: "Public", website: "https://www.unive.it/web/en", fields: ["biz", "hum", "soc", "sci"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1800, tuitionMax: 2800, intakes: ["Fall"], scholarship: "Ca' Foscari International welcome scholarships" },
  { id: "it-unige", name: "University of Genoa", city: "Genoa", country: "Italy", type: "Public", website: "https://unige.it/en", fields: ["eng", "sci", "med", "hum"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1000, tuitionMax: 2800, intakes: ["Fall"] },
  { id: "it-unisi", name: "University of Siena", city: "Siena", country: "Italy", type: "Public", website: "https://www.unisi.it/en", fields: ["sci", "med", "hum", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1000, tuitionMax: 2400, intakes: ["Fall"], scholarship: "DSU Toscana" },
  { id: "it-unipg", name: "University of Perugia", city: "Perugia", country: "Italy", type: "Public", website: "https://www.unipg.it/en", fields: ["eng", "sci", "med", "hum"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 600, tuitionMax: 2400, intakes: ["Fall"], scholarship: "ADiSU Umbria" },
  { id: "it-unipr", name: "University of Parma", city: "Parma", country: "Italy", type: "Public", website: "https://www.unipr.it/en", fields: ["eng", "sci", "med", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1500, tuitionMax: 3000, intakes: ["Fall"] },
  { id: "it-univr", name: "University of Verona", city: "Verona", country: "Italy", type: "Public", website: "https://www.univr.it/en", fields: ["biz", "med", "hum", "sci"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1500, tuitionMax: 3000, intakes: ["Fall"] },
  { id: "it-unimore", name: "University of Modena & Reggio Emilia", city: "Modena", country: "Italy", type: "Public", website: "https://www.unimore.it/en", fields: ["eng", "sci", "med", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1000, tuitionMax: 3000, intakes: ["Fall"] },
  { id: "it-units", name: "University of Trieste", city: "Trieste", country: "Italy", type: "Public", website: "https://www.units.it/en", fields: ["eng", "sci", "hum", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1000, tuitionMax: 3000, intakes: ["Fall"] },
  { id: "it-unibg", name: "University of Bergamo", city: "Bergamo", country: "Italy", type: "Public", website: "https://www.unibg.it/en", fields: ["eng", "biz", "hum", "soc"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1500, tuitionMax: 4000, intakes: ["Fall"] },
  { id: "it-unibs", name: "University of Brescia", city: "Brescia", country: "Italy", type: "Public", website: "https://www.unibs.it/en", fields: ["eng", "med", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1200, tuitionMax: 3000, intakes: ["Fall"] },
  { id: "it-unict", name: "University of Catania", city: "Catania", country: "Italy", type: "Public", website: "https://www.unict.it/en", fields: ["eng", "sci", "med", "hum"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2500, intakes: ["Fall"], scholarship: "ERSU Catania" },
  { id: "it-unipa", name: "University of Palermo", city: "Palermo", country: "Italy", type: "Public", website: "https://www.unipa.it/target/international-students", fields: ["eng", "sci", "med", "hum"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2500, intakes: ["Fall"], scholarship: "ERSU Palermo" },
  { id: "it-uniba", name: "University of Bari Aldo Moro", city: "Bari", country: "Italy", type: "Public", website: "https://www.uniba.it/en", fields: ["sci", "med", "hum", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2500, intakes: ["Fall"] },
  { id: "it-unica", name: "University of Cagliari", city: "Cagliari", country: "Italy", type: "Public", website: "https://www.unica.it/unica/en/homepage.page", fields: ["eng", "sci", "med", "hum"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2500, intakes: ["Fall"], scholarship: "ERSU Cagliari" },
  { id: "it-unife", name: "University of Ferrara", city: "Ferrara", country: "Italy", type: "Public", website: "https://www.unife.it/en", fields: ["eng", "sci", "med", "art"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1000, tuitionMax: 3000, intakes: ["Fall"] },
  { id: "it-unibz", name: "Free University of Bozen-Bolzano", city: "Bolzano", country: "Italy", type: "Public", website: "https://www.unibz.it/en", fields: ["eng", "biz", "sci", "art"], levels: ALL, language: "English, Italian & German", ielts: 6.0, tuitionMin: 1500, tuitionMax: 1500, intakes: ["Fall"], scholarship: "Province of Bolzano study grants", note: "Trilingual teaching" },
  { id: "it-luiss", name: "Luiss Guido Carli", city: "Rome", country: "Italy", type: "Private", website: "https://www.luiss.edu", fields: ["biz", "soc", "hum"], levels: ALL, language: "English", ielts: 6.5, tuitionMin: 12000, tuitionMax: 14500, intakes: ["Fall"], scholarship: "Merit & need-based reductions", note: "Strong for politics, law & management" },
  { id: "it-univpm", name: "Marche Polytechnic University", city: "Ancona", country: "Italy", type: "Public", website: "https://www.univpm.it/Entra/English_version", fields: ["eng", "sci", "med", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1000, tuitionMax: 3000, intakes: ["Fall"] },
  { id: "it-unical", name: "University of Calabria", city: "Cosenza", country: "Italy", type: "Public", website: "https://www.unical.it/internazionale/intenational-students/", fields: ["eng", "sci", "hum", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2800, intakes: ["Fall"] },
  { id: "it-uniss", name: "University of Sassari", city: "Sassari", country: "Italy", type: "Public", website: "https://en.uniss.it", fields: ["sci", "med", "hum", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2500, intakes: ["Fall"] },
  { id: "it-uninsubria", name: "University of Insubria", city: "Varese", country: "Italy", type: "Public", website: "https://www.uninsubria.eu", fields: ["sci", "med", "biz", "hum"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1000, tuitionMax: 3000, intakes: ["Fall"] },
  { id: "it-unisalento", name: "University of Salento", city: "Lecce", country: "Italy", type: "Public", website: "https://www.unisalento.it/en_GB/home", fields: ["eng", "sci", "hum", "biz"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 500, tuitionMax: 2500, intakes: ["Fall"] },
  { id: "it-uniud", name: "University of Udine", city: "Udine", country: "Italy", type: "Public", website: "https://www.uniud.it/en", fields: ["eng", "sci", "med", "hum"], levels: ALL, language: "English & Italian", ielts: 6.0, tuitionMin: 1000, tuitionMax: 2800, intakes: ["Fall"] },
  { id: "it-iulm", name: "IULM University", city: "Milan", country: "Italy", type: "Private", website: "https://www.iulm.it/en", fields: ["art", "biz", "soc"], levels: BM, language: "English & Italian", ielts: 6.0, tuitionMin: 12000, tuitionMax: 14000, intakes: ["Fall"], note: "Communication, media & the arts" },
];

// -----------------------------------------------------------------------------
// 🇱🇹 LITHUANIA — primary focus. Affordable, English-friendly. Master's fees run
// roughly €4,500–9,000; medicine is the outlier near €14,000.
// -----------------------------------------------------------------------------

const LITHUANIA: University[] = [
  { id: "lt-vu", name: "Vilnius University", city: "Vilnius", country: "Lithuania", type: "Public", website: "https://www.vu.lt/en", fields: ["sci", "hum", "soc", "med", "biz", "eng"], levels: ALL, language: "English & Lithuanian", ielts: 6.0, tuitionMin: 3000, tuitionMax: 6500, intakes: ["Fall", "Spring"], scholarship: "VU & Lithuanian state scholarships", note: "Oldest & top-ranked (QS) university in Lithuania" },
  { id: "lt-vilniustech", name: "Vilnius Gediminas Technical University (VILNIUS TECH)", city: "Vilnius", country: "Lithuania", type: "Public", website: "https://vilniustech.lt/english/", fields: ["eng", "sci", "biz", "art"], levels: ALL, language: "English", ielts: 6.0, tuitionMin: 3500, tuitionMax: 5500, intakes: ["Fall", "Spring"], scholarship: "VILNIUS TECH merit scholarships" },
  { id: "lt-ktu", name: "Kaunas University of Technology (KTU)", city: "Kaunas", country: "Lithuania", type: "Public", website: "https://en.ktu.edu", fields: ["eng", "sci", "biz", "soc"], levels: ALL, language: "English", ielts: 6.0, tuitionMin: 3300, tuitionMax: 5800, intakes: ["Fall", "Spring"], scholarship: "KTU talent & motivation scholarships" },
  { id: "lt-vmu", name: "Vytautas Magnus University (VMU)", city: "Kaunas", country: "Lithuania", type: "Public", website: "https://www.vdu.lt/en/", fields: ["hum", "soc", "sci", "biz", "art"], levels: ALL, language: "English & Lithuanian", ielts: 6.0, tuitionMin: 3000, tuitionMax: 5500, intakes: ["Fall", "Spring"], scholarship: "VMU & state scholarships" },
  { id: "lt-mru", name: "Mykolas Romeris University (MRU)", city: "Vilnius", country: "Lithuania", type: "Public", website: "https://www.mruni.eu/en/", fields: ["hum", "soc", "biz"], levels: ALL, language: "English", ielts: 6.0, tuitionMin: 2800, tuitionMax: 4500, intakes: ["Fall", "Spring"], note: "Law, public governance & social sciences" },
  { id: "lt-lsmu", name: "Lithuanian University of Health Sciences (LSMU)", city: "Kaunas", country: "Lithuania", type: "Public", website: "https://lsmu.lt/en/", fields: ["med", "sci"], levels: ALL, language: "English", ielts: 6.5, tuitionMin: 9000, tuitionMax: 14000, intakes: ["Fall"], note: "Medicine, dentistry, veterinary, pharmacy" },
  { id: "lt-ku", name: "Klaipėda University", city: "Klaipėda", country: "Lithuania", type: "Public", website: "https://www.ku.lt/en/", fields: ["sci", "eng", "hum", "soc"], levels: ALL, language: "English & Lithuanian", ielts: 6.0, tuitionMin: 2500, tuitionMax: 4500, intakes: ["Fall", "Spring"], note: "Marine sciences & maritime engineering" },
  { id: "lt-lsu", name: "Lithuanian Sports University (LSU)", city: "Kaunas", country: "Lithuania", type: "Public", website: "https://www.lsu.lt/en/", fields: ["med", "soc"], levels: ALL, language: "English", ielts: 6.0, tuitionMin: 2800, tuitionMax: 4000, intakes: ["Fall"], note: "Sports science, coaching & physiotherapy" },
  { id: "lt-vda", name: "Vilnius Academy of Arts (VAA)", city: "Vilnius", country: "Lithuania", type: "Public", website: "https://www.vda.lt/en", fields: ["art"], levels: ALL, language: "English & Lithuanian", ielts: 6.0, tuitionMin: 3500, tuitionMax: 6000, intakes: ["Fall"], note: "Design, fine arts & architecture" },
  { id: "lt-lmta", name: "Lithuanian Academy of Music & Theatre (LMTA)", city: "Vilnius", country: "Lithuania", type: "Public", website: "https://lmta.lt/en/", fields: ["art"], levels: ALL, language: "English & Lithuanian", ielts: 6.0, tuitionMin: 4000, tuitionMax: 7000, intakes: ["Fall"], note: "Music, theatre & film" },
  { id: "lt-ism", name: "ISM University of Management & Economics", city: "Vilnius", country: "Lithuania", type: "Private", website: "https://www.ism.lt/en/", fields: ["biz", "soc"], levels: BM, language: "English", ielts: 6.0, tuitionMin: 4500, tuitionMax: 7500, intakes: ["Fall"], scholarship: "ISM merit scholarships", note: "Business, economics & management" },
  { id: "lt-ksu", name: "Kazimieras Simonavičius University", city: "Vilnius", country: "Lithuania", type: "Private", website: "https://www.ksu.lt/en/", fields: ["biz", "soc", "art"], levels: BM, language: "English", ielts: 6.0, tuitionMin: 3500, tuitionMax: 5000, intakes: ["Fall", "Spring"] },
  { id: "lt-ehu", name: "European Humanities University (EHU)", city: "Vilnius", country: "Lithuania", type: "Private", website: "https://en.ehu.lt", fields: ["hum", "soc", "art"], levels: BM, language: "English", ielts: 6.0, tuitionMin: 2800, tuitionMax: 4500, intakes: ["Fall"], note: "Liberal arts; Belarusian university-in-exile" },
  { id: "lt-lcc", name: "LCC International University", city: "Klaipėda", country: "Lithuania", type: "Private", website: "https://www.lcc.lt", fields: ["hum", "soc", "biz"], levels: BM, language: "English", ielts: 6.0, tuitionMin: 8000, tuitionMax: 10000, intakes: ["Fall", "Spring"], scholarship: "Need-based aid", note: "US-style liberal arts, fully English" },
  { id: "lt-viko", name: "Vilniaus Kolegija / University of Applied Sciences (VIKO)", city: "Vilnius", country: "Lithuania", type: "Applied Sciences", website: "https://en.viko.lt", fields: ["biz", "eng", "med", "art"], levels: BM, language: "English & Lithuanian", ielts: 5.5, tuitionMin: 2000, tuitionMax: 3500, intakes: ["Fall", "Spring"], note: "Career-focused professional bachelor degrees" },
  { id: "lt-kauko", name: "Kauno Kolegija / Higher Education Institution", city: "Kaunas", country: "Lithuania", type: "Applied Sciences", website: "https://en.kaunokolegija.lt", fields: ["biz", "eng", "med", "art"], levels: BM, language: "English & Lithuanian", ielts: 5.5, tuitionMin: 2000, tuitionMax: 3200, intakes: ["Fall", "Spring"], note: "Applied sciences & professional studies" },
];

// -----------------------------------------------------------------------------
// 🌍 REST OF WORLD — representative set (the universities behind the match
// catalog). Deliberately small; Italy & Lithuania are the focus.
// -----------------------------------------------------------------------------

const WORLD: University[] = [
  { id: "de-tum", name: "Technical University of Munich (TUM)", city: "Munich", country: "Germany", type: "Public", website: "https://www.tum.de/en/", fields: ["eng", "sci", "biz", "med"], levels: ALL, language: "English & German", ielts: 6.5, tuitionMin: 12000, tuitionMax: 12000, intakes: ["Fall", "Spring"], scholarship: "DAAD & foundation scholarships", note: "Anabin H+ recognition required from your BD university" },
  { id: "de-stuttgart", name: "University of Stuttgart", city: "Stuttgart", country: "Germany", type: "Public", website: "https://www.uni-stuttgart.de/en/", fields: ["eng", "sci"], levels: ALL, language: "English & German", ielts: 6.5, tuitionMin: 3000, tuitionMax: 3000, intakes: ["Fall"], scholarship: "Exemptions for strong profiles" },
  { id: "sg-nus", name: "National University of Singapore (NUS)", city: "Singapore", country: "Singapore", type: "Public", website: "https://nus.edu.sg", fields: ["eng", "sci", "biz", "med", "soc"], levels: ALL, language: "English", ielts: 6.0, tuitionMin: 20000, tuitionMax: 30000, intakes: ["Fall"], note: "GRE required for many graduate programs" },
  { id: "ca-concordia", name: "Concordia University", city: "Montreal", country: "Canada", type: "Public", website: "https://www.concordia.ca", fields: ["eng", "biz", "art", "soc"], levels: ALL, language: "English", ielts: 6.5, tuitionMin: 17000, tuitionMax: 22000, intakes: ["Fall", "Spring"], scholarship: "Entrance awards" },
  { id: "us-sjsu", name: "San Jose State University (SJSU)", city: "San Jose", country: "United States", type: "Public", website: "https://www.sjsu.edu", fields: ["eng", "biz", "sci", "art"], levels: BM, language: "English", ielts: 6.5, tuitionMin: 16000, tuitionMax: 19500, intakes: ["Fall", "Spring"], note: "GRE required for CS/SE; Silicon Valley location" },
  { id: "au-melbourne", name: "University of Melbourne", city: "Melbourne", country: "Australia", type: "Public", website: "https://www.unimelb.edu.au", fields: ["eng", "sci", "biz", "med", "hum"], levels: ALL, language: "English", ielts: 6.5, tuitionMin: 30000, tuitionMax: 36000, intakes: ["Fall", "Spring"], scholarship: "International Merit (up to 50%)", note: "NOOSR section affects entry from BD" },
  { id: "uk-greenwich", name: "University of Greenwich", city: "London", country: "United Kingdom", type: "Public", website: "https://www.gre.ac.uk", fields: ["eng", "biz", "sci", "art"], levels: ALL, language: "English", ielts: 6.0, tuitionMin: 15000, tuitionMax: 20000, intakes: ["Fall", "Spring"], scholarship: "International Scholarship (up to £3,000)" },
];

/** Curated, deeply-researched universities (Italy + Lithuania focus + world set). */
export const UNIVERSITIES: University[] = [...ITALY, ...LITHUANIA, ...WORLD];

// =============================================================================
// World directory — the ~10k open dataset layered UNDER the curated set.
// Curated universities keep their rich fields; the rest carry name + country +
// official site, enriched with country-level INDICATIVE bands for tuition/IELTS.
// =============================================================================

export interface DirectoryUniversity {
  id: string;
  name: string;
  country: string;
  website: string;
  curated: boolean;
  // Rich fields — present for curated universities only.
  city?: string;
  type?: University["type"];
  fields?: string[];
  levels?: Level[];
  language?: string;
  ielts?: number;
  tuitionMin?: number;
  tuitionMax?: number;
  intakes?: string[];
  scholarship?: string;
  note?: string;
}

/** Indicative annual international tuition (EUR) + typical IELTS, by country. */
export interface CountryBand {
  tuitionMin: number;
  tuitionMax: number;
  ielts: number;
}

export const COUNTRY_BANDS: Record<string, CountryBand> = {
  Italy: { tuitionMin: 900, tuitionMax: 4000, ielts: 6.0 },
  Lithuania: { tuitionMin: 2000, tuitionMax: 6000, ielts: 6.0 },
  Germany: { tuitionMin: 0, tuitionMax: 3000, ielts: 6.5 },
  France: { tuitionMin: 200, tuitionMax: 5000, ielts: 6.0 },
  Spain: { tuitionMin: 1500, tuitionMax: 6000, ielts: 6.0 },
  Portugal: { tuitionMin: 1000, tuitionMax: 7000, ielts: 6.0 },
  Netherlands: { tuitionMin: 8000, tuitionMax: 15000, ielts: 6.5 },
  Belgium: { tuitionMin: 1000, tuitionMax: 6000, ielts: 6.5 },
  Switzerland: { tuitionMin: 1000, tuitionMax: 4000, ielts: 6.5 },
  Austria: { tuitionMin: 1500, tuitionMax: 3000, ielts: 6.5 },
  Poland: { tuitionMin: 2000, tuitionMax: 6000, ielts: 6.0 },
  Hungary: { tuitionMin: 1500, tuitionMax: 7000, ielts: 6.0 },
  "Czech Republic": { tuitionMin: 2000, tuitionMax: 6000, ielts: 6.0 },
  Sweden: { tuitionMin: 9000, tuitionMax: 16000, ielts: 6.5 },
  Finland: { tuitionMin: 8000, tuitionMax: 15000, ielts: 6.5 },
  Norway: { tuitionMin: 7000, tuitionMax: 15000, ielts: 6.5 },
  Denmark: { tuitionMin: 8000, tuitionMax: 16000, ielts: 6.5 },
  Greece: { tuitionMin: 1500, tuitionMax: 6000, ielts: 6.0 },
  Romania: { tuitionMin: 2000, tuitionMax: 5000, ielts: 6.0 },
  Bulgaria: { tuitionMin: 3000, tuitionMax: 8000, ielts: 6.0 },
  Croatia: { tuitionMin: 2000, tuitionMax: 6000, ielts: 6.0 },
  Slovenia: { tuitionMin: 2000, tuitionMax: 6000, ielts: 6.0 },
  Slovakia: { tuitionMin: 2000, tuitionMax: 6000, ielts: 6.0 },
  Estonia: { tuitionMin: 2000, tuitionMax: 8000, ielts: 6.0 },
  Latvia: { tuitionMin: 2000, tuitionMax: 7000, ielts: 6.0 },
  Cyprus: { tuitionMin: 4000, tuitionMax: 9000, ielts: 6.0 },
  Malta: { tuitionMin: 1000, tuitionMax: 11000, ielts: 6.0 },
  Ireland: { tuitionMin: 10000, tuitionMax: 25000, ielts: 6.5 },
  "United Kingdom": { tuitionMin: 12000, tuitionMax: 30000, ielts: 6.5 },
  "United States": { tuitionMin: 15000, tuitionMax: 40000, ielts: 6.5 },
  Canada: { tuitionMin: 13000, tuitionMax: 30000, ielts: 6.5 },
  Australia: { tuitionMin: 18000, tuitionMax: 38000, ielts: 6.5 },
  "New Zealand": { tuitionMin: 16000, tuitionMax: 30000, ielts: 6.5 },
  Japan: { tuitionMin: 4000, tuitionMax: 8000, ielts: 6.0 },
  "South Korea": { tuitionMin: 4000, tuitionMax: 9000, ielts: 6.0 },
  China: { tuitionMin: 3000, tuitionMax: 8000, ielts: 6.0 },
  Malaysia: { tuitionMin: 3000, tuitionMax: 8000, ielts: 6.0 },
  Singapore: { tuitionMin: 18000, tuitionMax: 30000, ielts: 6.0 },
  Taiwan: { tuitionMin: 3000, tuitionMax: 6000, ielts: 6.0 },
  Thailand: { tuitionMin: 3000, tuitionMax: 7000, ielts: 6.0 },
  "Hong Kong": { tuitionMin: 12000, tuitionMax: 20000, ielts: 6.5 },
  "United Arab Emirates": { tuitionMin: 8000, tuitionMax: 20000, ielts: 6.0 },
  "Türkiye": { tuitionMin: 1500, tuitionMax: 6000, ielts: 6.0 },
  "Saudi Arabia": { tuitionMin: 0, tuitionMax: 8000, ielts: 6.0 },
  Russia: { tuitionMin: 2000, tuitionMax: 6000, ielts: 6.0 },
  Ukraine: { tuitionMin: 2000, tuitionMax: 5000, ielts: 6.0 },
  Georgia: { tuitionMin: 3000, tuitionMax: 8000, ielts: 6.0 },
};

// Registrable-domain extraction so curated entries aren't duplicated by the
// open dataset (handles multi-label TLDs like ac.uk / edu.au).
const MULTI_TLD = new Set([
  "ac.uk", "edu.au", "ac.nz", "ac.jp", "edu.sg", "ac.kr", "edu.cn",
  "edu.my", "com.tr", "edu.tr", "edu.hk", "ac.in", "edu.pk", "ac.th", "edu.tw",
]);
function regDomain(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    if (parts.length <= 2) return host;
    const lastTwo = parts.slice(-2).join(".");
    return MULTI_TLD.has(lastTwo) ? parts.slice(-3).join(".") : lastTwo;
  } catch {
    return url;
  }
}

const curatedDomains = new Set(UNIVERSITIES.map((u) => regDomain(u.website)));

const CURATED_DIR: DirectoryUniversity[] = UNIVERSITIES.map((u) => ({
  id: u.id, name: u.name, country: u.country, website: u.website, curated: true,
  city: u.city, type: u.type, fields: u.fields, levels: u.levels, language: u.language,
  ielts: u.ielts, tuitionMin: u.tuitionMin, tuitionMax: u.tuitionMax, intakes: u.intakes,
  scholarship: u.scholarship, note: u.note,
}));

const WORLD_DIR: DirectoryUniversity[] = WORLD_RAW
  .filter(([, , w]) => !curatedDomains.has(regDomain(w)))
  .map(([n, c, w], i) => ({ id: `w-${i}`, name: n, country: c, website: w, curated: false }));

/** The full browsable directory: curated (rich) first, then the world set. */
export const DIRECTORY: DirectoryUniversity[] = [...CURATED_DIR, ...WORLD_DIR];

export const DIRECTORY_TOTAL = DIRECTORY.length;

/** Distinct countries, focus countries first, then alphabetical. */
export const DIRECTORY_COUNTRIES: string[] = (() => {
  const focus = ["Italy", "Lithuania"];
  const rest = Array.from(new Set(DIRECTORY.map((u) => u.country)))
    .filter((c) => !focus.includes(c))
    .sort();
  return [...focus, ...rest];
})();

/** Tuition string + whether it's a country-typical band vs an institution figure. */
export function tuitionLabel(u: DirectoryUniversity): { text: string; typical: boolean } | null {
  if (u.tuitionMin !== undefined && u.tuitionMax !== undefined) {
    const text =
      u.tuitionMin === u.tuitionMax
        ? `≈ €${u.tuitionMin.toLocaleString()}/yr`
        : `€${u.tuitionMin.toLocaleString()}–€${u.tuitionMax.toLocaleString()}/yr`;
    return { text, typical: false };
  }
  const b = COUNTRY_BANDS[u.country];
  if (b) return { text: `€${b.tuitionMin.toLocaleString()}–€${b.tuitionMax.toLocaleString()}/yr`, typical: true };
  return null;
}

/** Best-known IELTS for filtering (curated value, else country band). */
export function ieltsValue(u: DirectoryUniversity): number | null {
  if (u.ielts !== undefined) return u.ielts;
  return COUNTRY_BANDS[u.country]?.ielts ?? null;
}

/** Lowest plausible tuition for filtering (curated min, else country band min). */
export function tuitionFloor(u: DirectoryUniversity): number | null {
  if (u.tuitionMin !== undefined) return u.tuitionMin;
  return COUNTRY_BANDS[u.country]?.tuitionMin ?? null;
}
