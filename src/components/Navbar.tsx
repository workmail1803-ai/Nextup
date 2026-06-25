"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import CurrencyToggle from "@/components/ui/CurrencyToggle";
import Button from "@/components/ui/Button";

const navLinks = [
  { name: "Services", href: "/services" },
  { name: "Eligibility", href: "/eligibility" },
  { name: "Destinations", href: "/destinations" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function Wordmark() {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-0.5" aria-label="NextUp Mentor — home">
      <span className="font-display text-[1.45rem] font-semibold tracking-tight text-ink">
        NextUp
      </span>
      <span className="font-display text-[1.45rem] font-medium italic text-accent">
        Mentor
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { currency, setCurrency } = useCurrency();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-line bg-paper/85 backdrop-blur-xl supports-[backdrop-filter]:bg-paper/70"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-edge flex h-[72px] items-center justify-between">
        <Wordmark />

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`relative rounded-full px-4 py-2 text-[0.95rem] font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {link.name}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 -bottom-px h-px bg-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <CurrencyToggle currency={currency} onChange={setCurrency} />
          <Button href="/contact" size="sm" withArrow>
            Book a call
          </Button>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-paper-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-paper md:hidden"
          >
            <div className="container-edge flex flex-col gap-1 py-5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-4 py-3 text-lg font-medium transition-colors ${
                    isActive(link.href)
                      ? "bg-paper-2 text-ink"
                      : "text-muted hover:bg-paper-2 hover:text-ink"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-4">
                <CurrencyToggle currency={currency} onChange={setCurrency} />
                <Button href="/contact" size="sm" withArrow onClick={() => setOpen(false)}>
                  Book a call
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
