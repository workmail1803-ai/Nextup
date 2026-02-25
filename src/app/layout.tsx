import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nextupmentor.com"),
  title: {
    default: "NextUp Mentor | Study Abroad Consultancy for Europe",
    template: "%s | NextUp Mentor",
  },
  description:
    "Your trusted partner for European education. Expert guidance for university admissions, visa processing, and complete mentorship for studying in Italy, Lithuania, Germany, and beyond.",
  keywords: [
    "NextUp Mentor",
    "nextupmentor",
    "study abroad",
    "study in Europe",
    "European universities",
    "Italy education",
    "Lithuania university",
    "Germany university",
    "visa guidance",
    "study consultancy Bangladesh",
    "study abroad from Bangladesh",
    "European education consultancy",
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
    title: "NextUp Mentor | Study Abroad Consultancy for Europe",
    description:
      "Your trusted partner for European education. Expert guidance for university admissions, visa processing, and complete mentorship for studying in Italy, Lithuania, Germany, and beyond.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "NextUp Mentor Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextUp Mentor | Study Abroad Consultancy for Europe",
    description:
      "Your trusted partner for European education. Expert guidance for university admissions, visa processing, and complete mentorship.",
    images: ["/icon.png"],
  },
  alternates: {
    canonical: "https://nextupmentor.com",
  },
  // verification: {
  //   google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${plusJakarta.variable} antialiased`}>
        <JsonLd />
        {children}
        <Footer />
        <ChatBot />
      </body>
    </html>
  );
}
