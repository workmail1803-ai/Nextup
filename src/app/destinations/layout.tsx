import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Destinations - Study in Italy, Germany, Lithuania & More",
    description:
        "Discover the best European countries for international students. NextUp Mentor helps you explore study opportunities in Italy, Germany, Lithuania, Poland, Hungary, and beyond.",
    alternates: {
        canonical: "https://nextupmentor.com/destinations",
    },
    openGraph: {
        title: "European Study Destinations - NextUp Mentor",
        description:
            "Explore top European destinations for Bangladeshi students. Italy, Germany, Lithuania, Poland, and more.",
        url: "https://nextupmentor.com/destinations",
    },
};

export default function DestinationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
