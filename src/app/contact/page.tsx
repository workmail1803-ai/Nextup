"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, Clock, CheckCircle2, Plus, MessageCircle } from "lucide-react";
import { db } from "@/lib/supabase";
import PageHero from "@/components/ui/PageHero";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { FacebookIcon, InstagramIcon } from "@/components/ui/BrandIcons";

type Status = "idle" | "submitting" | "success" | "error";

const faqs = [
  { q: "How soon should I start my application?", a: "Start at least 6–8 months before your intended intake. That leaves comfortable time for documents, university applications, and visa processing without last-minute stress." },
  { q: "Do I need to know the local language?", a: "Many European universities offer programs entirely in English, so it's not required. That said, picking up the local language will enrich your experience and widen job prospects." },
  { q: "What are the real costs involved?", a: "Costs vary by country and university — several European countries offer free or low-cost public education. We map out every fee transparently so there are no surprises, and you pay each one directly." },
  { q: "Can I work while studying?", a: "Yes. Most European countries let international students work part-time (typically around 20 hours/week) during their studies, which helps with living costs." },
];

const channels = [
  { Icon: Mail, label: "Email", value: "nextupmentor@gmail.com", href: "mailto:nextupmentor@gmail.com" },
  { Icon: Phone, label: "Phone", value: "+880 1726 867991", href: "tel:+8801726867991" },
  { Icon: MessageCircle, label: "WhatsApp", value: "Chat with a mentor", href: "https://wa.me/8801726867991" },
];

function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    try {
      await db.messages.create({
        name: data.get("name") as string,
        email: data.get("email") as string,
        phone: (data.get("phone") as string) || null,
        destination: (data.get("destination") as string) || null,
        message: data.get("message") as string,
        status: "unread",
        replied_at: null,
      });
      setStatus("success");
      form.reset();
    } catch (err) {
      console.error("Error sending message:", err);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card flex flex-col items-center justify-center p-10 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf3ed] text-positive">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="h3 mt-5 text-ink">Message received</h3>
        <p className="mt-2 max-w-sm text-muted">
          Thank you — a mentor will reach out within one working day. For anything urgent, message us
          on WhatsApp.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-accent hover:underline"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder-faint transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8">
      <h2 className="font-display text-2xl font-semibold text-ink">Send us a message</h2>
      <p className="mt-1 text-sm text-muted">Tell us where you are in your journey.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input name="name" required placeholder="Your name" className={inputCls} />
        </Field>
        <Field label="Email">
          <input type="email" name="email" required placeholder="you@email.com" className={inputCls} />
        </Field>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label="Phone (optional)">
          <input type="tel" name="phone" placeholder="+880 1XXX-XXXXXX" className={inputCls} />
        </Field>
        <Field label="Preferred destination">
          <select name="destination" className={inputCls} defaultValue="">
            <option value="">Select a country</option>
            <option>Italy</option>
            <option>Germany</option>
            <option>Lithuania</option>
            <option>Poland</option>
            <option>Hungary</option>
            <option>Other</option>
          </select>
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Your message">
          <textarea
            name="message"
            rows={4}
            required
            placeholder="Tell us about your academic background and goals…"
            className={`${inputCls} resize-none`}
          />
        </Field>
      </div>

      {status === "error" && (
        <p className="mt-4 rounded-lg bg-[#fbeceb] px-4 py-3 text-sm text-danger">
          Something went wrong sending your message. Please try again, or reach us on WhatsApp.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-ink py-4 font-semibold text-on-ink transition-[transform,background-color] hover:bg-[#2a241c] active:scale-[0.99] disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Request free consultation"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-display text-lg font-medium text-ink">{q}</span>
        <Plus
          className={`h-5 w-5 flex-none text-accent transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-10 leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title={
          <>
            Your journey begins with <span className="accent-serif">a conversation.</span>
          </>
        }
        lede="Book a free consultation and let's talk through your European education goals. No pressure, no obligation — just honest guidance from people who've done it."
      />

      <section className="bg-paper pb-20 md:pb-28">
        <div className="container-edge grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          <Reveal>
            <ContactForm />
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col gap-4">
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-ink">Talk to us directly</h3>
              <ul className="mt-5 space-y-4">
                {channels.map((c) => (
                  <li key={c.label}>
                    <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center gap-3.5">
                      <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <c.Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <span>
                        <span className="block text-xs uppercase tracking-wider text-faint">{c.label}</span>
                        <span className="block font-medium text-ink transition-colors group-hover:text-accent">{c.value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex gap-2 border-t border-line pt-5">
                <a href="https://www.facebook.com/profile.php?id=61585820771768" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent">
                  <FacebookIcon className="h-[18px] w-[18px]" />
                </a>
                <a href="https://www.instagram.com/nextup_mentor" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent">
                  <InstagramIcon className="h-[18px] w-[18px]" />
                </a>
              </div>
            </div>

            <div className="card flex items-start gap-3.5 p-6">
              <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Clock className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="text-sm">
                <p className="font-semibold text-ink">Office hours</p>
                <p className="mt-1 text-muted">Sat – Thu · 10:00 AM – 8:00 PM (BST)</p>
                <p className="text-faint">Friday · Closed</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-paper-2 py-20 md:py-28">
        <div className="container-edge max-w-3xl">
          <SectionHeading align="center" eyebrow="FAQ" title="Questions, answered honestly" />
          <div className="mt-12">
            {faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
