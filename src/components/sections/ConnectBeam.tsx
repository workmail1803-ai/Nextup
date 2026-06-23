"use client";

import { forwardRef, useRef } from "react";
import { User, GraduationCap, FileCheck2, Plane } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";

const Node = forwardRef<
  HTMLDivElement,
  { Icon: LucideIcon; label?: string; hub?: boolean }
>(({ Icon, label, hub }, ref) => (
  <div className="flex flex-col items-center gap-2">
    <div
      ref={ref}
      className={`z-10 flex items-center justify-center rounded-full border shadow-[var(--shadow-md)] ${
        hub
          ? "h-16 w-16 border-transparent bg-ink text-on-ink"
          : "h-12 w-12 border-line bg-surface text-accent"
      }`}
    >
      {hub ? <span className="font-display text-2xl font-semibold">N</span> : <Icon className="h-5 w-5" strokeWidth={1.75} />}
    </div>
    {label && <span className="text-xs font-medium text-muted">{label}</span>}
  </div>
));
Node.displayName = "Node";

export default function ConnectBeam() {
  const container = useRef<HTMLDivElement>(null);
  const you = useRef<HTMLDivElement>(null);
  const hub = useRef<HTMLDivElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const r3 = useRef<HTMLDivElement>(null);

  return (
    <section className="bg-paper-2 py-20 md:py-28">
      <div className="container-edge">
        <SectionHeading
          align="center"
          eyebrow="How we bridge the distance"
          title="You, connected to Europe's best"
          lede="We sit between you and the universities — handling applications, documents and visas so the path from home to campus stays clear."
        />

        <Reveal delay={0.1}>
          <div
            ref={container}
            className="relative mx-auto mt-14 flex h-[300px] max-w-3xl items-stretch justify-between rounded-2xl border border-line bg-surface px-8 py-10 md:px-16"
          >
            {/* You */}
            <div className="flex flex-col justify-center">
              <Node ref={you} Icon={User} label="You" />
            </div>

            {/* Hub */}
            <div className="flex flex-col justify-center">
              <Node ref={hub} Icon={GraduationCap} label="NextUp" hub />
            </div>

            {/* Outcomes */}
            <div className="flex flex-col justify-between py-1">
              <Node ref={r1} Icon={GraduationCap} label="Admission" />
              <Node ref={r2} Icon={FileCheck2} label="Visa" />
              <Node ref={r3} Icon={Plane} label="Departure" />
            </div>

            <AnimatedBeam containerRef={container} fromRef={you} toRef={hub} duration={4} />
            <AnimatedBeam containerRef={container} fromRef={hub} toRef={r1} curvature={45} duration={4} delay={0.4} />
            <AnimatedBeam containerRef={container} fromRef={hub} toRef={r2} duration={4} delay={0.8} />
            <AnimatedBeam containerRef={container} fromRef={hub} toRef={r3} curvature={-45} duration={4} delay={1.2} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
