import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eligibility Check — Match Your Profile to Global Programs",
  description:
    "Enter your IELTS, SSC/HSC and CGPA to instantly see which universities across Europe, North America, Asia and beyond you qualify for — with clear pathways where you fall short. Free, private, runs in your browser.",
  alternates: {
    canonical: "https://nextupmentor.com/eligibility",
  },
  openGraph: {
    title: "Eligibility Check — NextUp Mentor",
    description:
      "Instantly match your academic profile to eligible global university programs. Indicative results with honest next steps.",
    url: "https://nextupmentor.com/eligibility",
  },
};

export default function EligibilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
