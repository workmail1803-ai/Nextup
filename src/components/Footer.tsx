import Link from "next/link";
import { Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/ui/BrandIcons";

const explore = [
  { name: "Services", href: "/services" },
  { name: "Destinations", href: "/destinations" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const resources = [
  { name: "FAQ — English", href: "/docs/nextup-faq-english.pdf" },
  { name: "FAQ — Banglish", href: "/docs/nextup-faq-banglish.pdf" },
  { name: "FAQ — বাংলা", href: "/docs/nextup-faq-bangla.pdf" },
];

const socials = [
  { name: "Facebook", href: "https://www.facebook.com/profile.php?id=61585820771768", Icon: FacebookIcon },
  { name: "Instagram", href: "https://www.instagram.com/nextup_mentor", Icon: InstagramIcon },
  { name: "WhatsApp", href: "https://wa.me/8801726867991", Icon: MessageCircle },
  { name: "Email", href: "mailto:nextupmentor@gmail.com", Icon: Mail },
];

export default function Footer() {
  return (
    <footer className="bg-ink-surface text-on-ink">
      {/* Closing CTA band */}
      <div className="container-edge border-b border-white/10 py-16 md:py-20">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow !text-accent-bright">Your next chapter</p>
            <h2 className="h2 mt-4 text-on-ink text-balance">
              The journey to Europe begins <span className="accent-serif !text-accent-bright">with a conversation.</span>
            </h2>
          </div>
          <Link
            href="/book"
            className="group inline-flex h-14 items-center gap-2 rounded-full bg-accent px-8 font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Book a free call
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {/* Link columns */}
      <div className="container-edge grid grid-cols-2 gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <span className="font-display text-2xl font-semibold tracking-tight">
            NextUp <span className="italic text-accent-bright">Mentor</span>
          </span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-ink-muted">
            Student-led mentorship for European university admissions. Built by people who made
            the journey themselves — and kept it honest.
          </p>
          <div className="mt-6 flex gap-2">
            {socials.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-on-ink-muted transition-colors hover:border-accent-bright hover:text-accent-bright"
              >
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol title="Explore" links={explore} />
        <FooterCol title="Resources" links={resources} external />

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-ink-muted">
            Talk to us
          </h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a href="mailto:nextupmentor@gmail.com" className="text-on-ink transition-colors hover:text-accent-bright">
                nextupmentor@gmail.com
              </a>
            </li>
            <li>
              <a href="tel:+8801726867991" className="text-on-ink transition-colors hover:text-accent-bright">
                +880 1726 867991
              </a>
            </li>
            <li className="text-on-ink-muted">Sat–Thu · 10 AM – 8 PM (BST)</li>
          </ul>
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-white/10">
        <div className="container-edge flex flex-col items-center justify-between gap-3 py-6 text-xs text-on-ink-muted md:flex-row">
          <p>© {new Date().getFullYear()} NextUp Mentor. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/staff_portal" className="transition-colors hover:text-accent-bright">
              Staff Portal
            </Link>
            <span className="text-white/15">·</span>
            <p>Built by students, for students.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  external = false,
}: {
  title: string;
  links: { name: string; href: string }[];
  external?: boolean;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-on-ink-muted">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm">
        {links.map((l) => (
          <li key={l.name}>
            <Link
              href={l.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-on-ink transition-colors hover:text-accent-bright"
            >
              {l.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
