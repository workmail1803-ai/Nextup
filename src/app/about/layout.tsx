import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us - Your Trusted Study Abroad Partner",
    description:
        "Learn about NextUp Mentor, a premium study abroad consultancy in Bangladesh founded by European alumni. We provide transparent, student-focused guidance for studying in Italy, Lithuania, Germany, and beyond.",
    alternates: {
        canonical: "https://nextupmentor.com/about",
    },
    openGraph: {
        title: "About NextUp Mentor - Your Trusted Study Abroad Partner",
        description:
            "Founded by European alumni, NextUp Mentor provides structured and transparent guidance for Bangladeshi students aspiring to study in Europe.",
        url: "https://nextupmentor.com/about",
    },
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
