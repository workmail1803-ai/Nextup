"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, X } from "lucide-react";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";

interface Destination {
  id: string;
  name: string;
  universities: string[];
  pathData: string;
  labelX: number;
  labelY: number;
}

const destinations: Destination[] = [
  {
    id: "italy",
    name: "Italy",
    universities: ["Sapienza University of Rome", "Politecnico di Milano", "University of Bologna", "University of Padua"],
    pathData: "M248,180 L255,175 L262,180 L268,190 L265,205 L270,215 L275,230 L280,245 L275,255 L268,265 L258,275 L250,280 L245,275 L250,265 L252,250 L248,235 L242,225 L238,210 L240,195 L245,185 Z M285,270 L295,265 L305,270 L308,280 L300,290 L288,285 Z M255,290 L265,288 L272,295 L268,305 L258,308 L252,300 Z",
    labelX: 260,
    labelY: 220,
  },
  {
    id: "lithuania",
    name: "Lithuania",
    universities: ["Vilnius University", "Kaunas University of Technology", "VILNIUS TECH", "Lithuanian University of Health Sciences"],
    pathData: "M290,95 L310,92 L325,98 L328,108 L320,118 L305,120 L290,115 L285,105 Z",
    labelX: 307,
    labelY: 105,
  },
  {
    id: "germany",
    name: "Germany",
    universities: ["Technical University of Munich", "Ludwig Maximilian University", "Heidelberg University", "Humboldt University of Berlin"],
    pathData: "M210,105 L225,100 L245,105 L260,108 L265,118 L260,130 L255,145 L248,155 L235,160 L220,158 L205,150 L200,138 L195,125 L200,115 Z",
    labelX: 228,
    labelY: 130,
  },
  {
    id: "poland",
    name: "Poland",
    universities: ["University of Warsaw", "Jagiellonian University", "Warsaw University of Technology", "Adam Mickiewicz University"],
    pathData: "M265,108 L285,105 L305,110 L320,118 L318,132 L310,145 L295,155 L278,158 L262,152 L255,145 L260,130 L265,118 Z",
    labelX: 287,
    labelY: 132,
  },
  {
    id: "hungary",
    name: "Hungary",
    universities: ["Semmelweis University", "University of Debrecen", "Eötvös Loránd University", "Budapest University of Technology"],
    pathData: "M262,158 L280,155 L298,160 L308,168 L305,180 L292,188 L275,190 L260,185 L252,175 L255,165 Z",
    labelX: 280,
    labelY: 172,
  },
];

const otherCountries = [
  "M120,140 L145,130 L170,135 L195,140 L200,155 L195,175 L180,190 L155,195 L130,185 L115,170 L110,155 L115,145 Z",
  "M80,175 L110,165 L130,170 L145,180 L150,200 L140,220 L115,230 L85,225 L65,210 L60,190 L70,180 Z",
  "M115,85 L130,80 L140,90 L145,105 L140,120 L125,125 L110,118 L105,105 L108,92 Z M100,105 L108,100 L115,108 L110,118 L100,115 Z",
  "M250,30 L265,25 L275,35 L278,55 L272,75 L262,90 L250,85 L245,65 L248,45 Z",
  "M225,20 L245,15 L255,25 L250,45 L240,60 L235,50 L230,35 Z",
  "M290,25 L310,22 L325,35 L330,55 L320,75 L305,80 L290,70 L285,50 L288,35 Z",
  "M235,160 L255,158 L268,165 L265,175 L252,180 L238,178 L230,170 Z",
  "M245,145 L262,142 L275,148 L278,158 L268,165 L252,162 L242,155 Z",
  "M308,168 L330,165 L345,175 L348,190 L340,205 L320,210 L305,200 L300,185 Z",
  "M295,215 L312,210 L325,218 L330,235 L320,250 L305,255 L295,245 L290,230 Z",
  "M330,115 L365,110 L395,120 L400,145 L390,165 L360,175 L335,170 L320,155 L318,135 Z",
  "M310,95 L335,92 L350,102 L348,118 L335,125 L318,122 L308,112 Z",
  "M185,108 L200,105 L208,115 L205,125 L192,128 L182,120 Z",
  "M175,125 L190,122 L198,132 L192,142 L178,145 L172,135 Z",
  "M200,160 L218,158 L228,165 L225,175 L212,178 L198,172 Z",
  "M55,185 L72,180 L78,195 L75,215 L62,225 L52,215 L50,198 Z",
  "M75,90 L95,85 L102,98 L98,112 L82,115 L70,105 Z",
  "M215,85 L232,82 L240,92 L235,102 L220,105 L212,95 Z",
];

export default function DestinationsMap() {
  const [active, setActive] = useState<Destination | null>(null);

  return (
    <section id="map" className="bg-paper py-20 md:py-28">
      <div className="container-edge max-w-5xl">
        <SectionHeading
          align="center"
          eyebrow="Explore the map"
          title="Find your place in Europe"
          lede="Select a highlighted country to see the universities our students attend there."
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="card mt-12 p-3 md:p-6"
        >
          <div className="relative w-full overflow-hidden rounded-xl bg-paper-2">
            <svg viewBox="0 80 450 250" className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of Europe with study destinations">
              <rect x="0" y="0" width="500" height="400" fill="#f0ece3" />
              <ellipse cx="250" cy="280" rx="180" ry="40" fill="#e4dccb" opacity="0.5" />
              <ellipse cx="280" cy="70" rx="50" ry="30" fill="#e4dccb" opacity="0.5" />

              {otherCountries.map((d, i) => (
                <path key={i} d={d} fill="#ded5c4" stroke="#fbfaf7" strokeWidth="0.5" />
              ))}

              {destinations.map((dest) => {
                const isActive = active?.id === dest.id;
                return (
                  <g key={dest.id}>
                    <path
                      d={dest.pathData}
                      fill={isActive ? "#a85a1a" : "#c79a64"}
                      stroke={isActive ? "#7a3f10" : "#fbfaf7"}
                      strokeWidth={isActive ? "1.5" : "0.5"}
                      className="cursor-pointer transition-colors duration-300 hover:fill-[#b8732e]"
                      onClick={() => setActive(isActive ? null : dest)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Study in ${dest.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setActive(isActive ? null : dest);
                        }
                      }}
                    />
                    <text
                      x={dest.labelX}
                      y={dest.labelY}
                      textAnchor="middle"
                      className="pointer-events-none hidden select-none fill-white text-[7px] font-semibold md:block"
                    >
                      {dest.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-xs text-muted backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" />
              <span className="hidden sm:inline">Click a country</span>
              <span className="sm:hidden">Tap a country</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {active && (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.3 }}
                className="mt-5 rounded-xl border border-line bg-paper-2 p-5 md:p-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-semibold text-ink md:text-2xl">
                    Study in {active.name}
                  </h3>
                  <button
                    onClick={() => setActive(null)}
                    aria-label="Close"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-faint transition-colors hover:bg-surface hover:text-ink"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-faint">Where our students study</p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {active.universities.map((uni, idx) => (
                    <motion.div
                      key={uni}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex items-center gap-2.5 text-sm text-muted"
                    >
                      <GraduationCap className="h-4 w-4 flex-none text-accent" strokeWidth={1.75} />
                      {uni}
                    </motion.div>
                  ))}
                </div>
                <Link
                  href="/services"
                  className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-on-ink transition-transform hover:-translate-y-0.5"
                >
                  See packages for {active.name}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
