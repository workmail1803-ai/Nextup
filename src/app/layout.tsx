import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import JsonLd from "@/components/JsonLd";
import Providers from "./providers";
import { TopChrome, BottomChrome } from "@/components/chrome/SiteChrome";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nextupmentor.com"),
  title: {
    default: "Italy & Lithuania Study Abroad Agency in Bangladesh | NextUp Mentor",
    template: "%s | NextUp Mentor",
  },
  description:
    "NextUp Mentor is a student-led study abroad agency in Bangladesh for Italy, Lithuania, Germany and Europe. Honest guidance on university admission, scholarships and student visas — from mentors who made the journey themselves.",
  keywords: [
    "NextUp Mentor",
    "nextupmentor",
    "Italy study abroad agency",
    "Lithuania study abroad agency",
    "Italy agency Bangladesh",
    "Lithuania agency Bangladesh",
    "study abroad agency Bangladesh",
    "study in Italy from Bangladesh",
    "study in Lithuania from Bangladesh",
    "European study abroad agency",
    "student visa agency Bangladesh",
    "study in Europe",
    "European universities",
    "Germany study abroad agency",
    "study consultancy Bangladesh",
  ],
  authors: [{ name: "NextUp Mentor" }],
  creator: "NextUp Mentor",
  publisher: "NextUp Mentor",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nextupmentor.com",
    siteName: "NextUp Mentor",
    title: "Italy & Lithuania Study Abroad Agency in Bangladesh | NextUp Mentor",
    description:
      "Student-led study abroad agency for Italy, Lithuania, Germany and Europe. Honest guidance on admission, scholarships and student visas — from mentors who made the journey.",
    images: [
      { url: "/icon.png", width: 512, height: 512, alt: "NextUp Mentor — study abroad agency" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Italy & Lithuania Study Abroad Agency | NextUp Mentor",
    description:
      "Student-led study abroad agency for Italy, Lithuania & Europe — admission, scholarships and visa guidance from Bangladesh.",
    images: ["/icon.png"],
  },
  alternates: { canonical: "https://nextupmentor.com" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="antialiased">
        <JsonLd />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-2.5 focus:text-on-ink focus:shadow-[var(--shadow-lg)]"
        >
          Skip to content
        </a>
        <Providers>
          <TopChrome />
          <main id="main">{children}</main>
          <BottomChrome />
        </Providers>
      </body>
    </html>
  );
}
