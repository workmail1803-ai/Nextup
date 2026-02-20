import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Footer from "@/components/Footer";
import ChatBot from "@/components/ChatBot";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "NextUp Mentor | Study Abroad Consultancy for Europe",
  description: "Your trusted partner for European education. Expert guidance for university admissions, visa processing, and complete mentorship for studying in Italy, Lithuania, Germany, and beyond.",
  keywords: "study abroad, European universities, Italy education, Lithuania university, visa guidance, study consultancy Bangladesh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${plusJakarta.variable} antialiased`}>
        {children}
        <Footer />
        <ChatBot />
      </body>
    </html>
  );
}
