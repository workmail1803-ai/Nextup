import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Free Consultation | NextUp Mentor",
  description:
    "Book a free study-abroad consultation with a NextUp Mentor. Choose your mentor and a time that suits you — no account needed. Honest guidance for Italy, Lithuania, Germany and Europe.",
  alternates: { canonical: "https://nextupmentor.com/book" },
  openGraph: {
    title: "Book a Free Consultation | NextUp Mentor",
    description:
      "Choose your mentor and a time that suits you — free, no account needed.",
    url: "https://nextupmentor.com/book",
  },
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
