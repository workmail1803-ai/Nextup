"use client";

const partners = [
  "SAPIENZA · ROMA",
  "VILNIUS UNIVERSITY",
  "POLITECNICO DI MILANO",
  "KAUNAS TECH",
  "UNIVERSITÀ DI BOLOGNA",
  "JAGIELLONIAN",
  "SEMMELWEIS",
  "UNIVERSITÀ DI PADOVA",
  "HEIDELBERG",
  "EÖTVÖS LORÁND",
];

export default function PartnerMarquee() {
  const row = [...partners, ...partners];
  return (
    <section className="border-y border-line bg-paper py-10 md:py-12">
      <p className="container-edge text-center text-xs font-medium uppercase tracking-[0.18em] text-faint">
        Students placed across Europe&apos;s leading universities
      </p>

      <div className="relative mt-7 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-paper to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-paper to-transparent md:w-40" />

        <div className="marquee-track gap-12 md:gap-20">
          {row.map((p, i) => (
            <span
              key={`${p}-${i}`}
              className="whitespace-nowrap font-display text-lg font-medium tracking-tight text-[#b6ad9d] transition-colors hover:text-ink md:text-xl"
              aria-hidden={i >= partners.length}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
