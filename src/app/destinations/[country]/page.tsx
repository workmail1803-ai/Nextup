import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, GraduationCap } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/ui/Reveal";
import {
  COUNTRY_GUIDES,
  COUNTRY_SLUGS,
  getCountryGuide,
} from "@/lib/seo/countries";

const SITE = "https://nextupmentor.com";

export function generateStaticParams() {
  return COUNTRY_SLUGS.map((country) => ({ country }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const guide = getCountryGuide(country);
  if (!guide) return { title: "Destination not found" };
  const url = `${SITE}/destinations/${guide.slug}`;
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.metaDescription,
    },
  };
}

export default async function CountryGuidePage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const guide = getCountryGuide(country);
  if (!guide) notFound();

  const url = `${SITE}/destinations/${guide.slug}`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE}/destinations` },
      { "@type": "ListItem", position: 3, name: `Study in ${guide.name}`, item: url },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: `${guide.name} study abroad agency`,
    provider: { "@type": "EducationalOrganization", name: "NextUp Mentor", url: SITE },
    areaServed: { "@type": "Country", name: "Bangladesh" },
    description: guide.metaDescription,
    name: `Study in ${guide.name} — university admission & visa support`,
  };

  const others = COUNTRY_GUIDES.filter((c) => c.slug !== guide.slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      <PageHero
        eyebrow={`${guide.flag} Study in ${guide.name}`}
        title={guide.heading}
        lede={guide.intro}
      >
        <div className="flex flex-wrap gap-3">
          <Link
            href="/book"
            className="group inline-flex h-13 items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Book a free consultation
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/eligibility"
            className="inline-flex h-13 items-center rounded-full border border-line-strong px-7 py-3.5 font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Check your eligibility
          </Link>
        </div>
      </PageHero>

      {/* Stats band */}
      <section className="border-y border-line bg-surface">
        <div className="container-edge grid grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
          {guide.stats.map((s) => (
            <div key={s.label} className="px-2 py-8 text-center">
              <p className="font-display text-2xl font-semibold text-ink md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-faint">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <Section alt>
        <SectionHeading
          eyebrow={`Why ${guide.name}`}
          title={`Why Bangladeshi students choose ${guide.name}`}
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {guide.why.map((w, i) => (
            <Reveal key={w.title} delay={(i % 2) * 0.08}>
              <div className="h-full rounded-2xl border border-line bg-surface p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{w.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Universities */}
      <Section>
        <SectionHeading
          eyebrow="Universities"
          title={`Popular universities in ${guide.name}`}
          lede={`Programmes our students commonly apply to across ${guide.name}. We match you to the ones where your profile is genuinely competitive.`}
        />
        <div className="mt-10 flex flex-wrap gap-3">
          {guide.universities.map((u) => (
            <span
              key={u}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink"
            >
              <GraduationCap className="h-4 w-4 text-accent" strokeWidth={2} />
              {u}
            </span>
          ))}
        </div>
      </Section>

      {/* Process */}
      <Section dark>
        <SectionHeading
          onDark
          eyebrow="How it works"
          title={`Your ${guide.name} journey, step by step`}
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guide.process.map((p, i) => (
            <Reveal key={p.step} delay={(i % 3) * 0.08}>
              <li className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <span className="font-display text-3xl font-semibold text-accent-bright">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold text-on-ink">{p.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-ink-muted">{p.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* FAQ */}
      <Section alt as="div">
        <SectionHeading
          align="center"
          eyebrow="FAQ"
          title={`Studying in ${guide.name} — your questions answered`}
          className="mx-auto"
        />
        <div className="mx-auto mt-12 max-w-3xl divide-y divide-line rounded-2xl border border-line bg-surface">
          {guide.faqs.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium text-ink marker:content-none">
                {f.q}
                <span className="text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section>
        <div className="rounded-3xl bg-ink-surface px-8 py-14 text-center text-on-ink md:px-16 md:py-20">
          <h2 className="h2 mx-auto max-w-2xl text-balance text-on-ink">
            Ready to start your{" "}
            <span className="accent-serif !text-accent-bright">{guide.name}</span> journey?
          </h2>
          <p className="lede mx-auto mt-5 max-w-xl !text-on-ink-muted">
            Talk to a mentor who has actually studied in Europe. Honest advice, no pressure.
          </p>
          <Link
            href="/book"
            className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-accent px-8 py-3.5 font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Book a free consultation
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Internal links to other destinations */}
        <div className="mt-14">
          <p className="text-center text-xs uppercase tracking-wide text-faint">Other destinations</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/destinations/${o.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
              >
                <span aria-hidden>{o.flag}</span> Study in {o.name}
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
