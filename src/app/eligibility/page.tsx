"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Compass, Sparkles } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import MatchWizard from "@/components/eligibility/MatchWizard";
import UniversityExplorer from "@/components/eligibility/UniversityExplorer";

type Mode = "explore" | "match";

const modes: { value: Mode; label: string; Icon: typeof Compass }[] = [
  { value: "explore", label: "Explore universities", Icon: Compass },
  { value: "match", label: "Match my profile", Icon: Sparkles },
];

export default function EligibilityPage() {
  const [mode, setMode] = useState<Mode>("explore");

  return (
    <>
      <PageHero
        eyebrow="Eligibility & university finder"
        title={
          <>
            Where you can study, <span className="accent-serif">honestly mapped.</span>
          </>
        }
        lede="Browse universities across Italy, Lithuania and beyond — tuition, intakes, language and the visa process, each linked to its official source. Or match your IELTS, SSC/HSC and CGPA to programs you actually qualify for. Everything runs in your browser; nothing is sent anywhere."
      />

      <div className="bg-paper pb-24">
        {/* Mode toggle */}
        <div className="container-edge mb-10 flex justify-center">
          <div className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-paper-2 p-1">
            {modes.map((m) => {
              const active = m.value === mode;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    active ? "text-on-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="mode-active"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <m.Icon className="relative h-4 w-4" strokeWidth={2} />
                  <span className="relative">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {mode === "explore" ? <UniversityExplorer /> : <MatchWizard />}
      </div>
    </>
  );
}
