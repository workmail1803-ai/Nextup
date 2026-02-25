import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact Us - Book a Free Consultation",
    description:
        "Get in touch with NextUp Mentor for a free study abroad consultation. Our experienced mentors are ready to help you start your European education journey from Bangladesh.",
    alternates: {
        canonical: "https://nextupmentor.com/contact",
    },
    openGraph: {
        title: "Contact NextUp Mentor - Free Consultation",
        description:
            "Book a free consultation with our experienced mentors. Get personalized guidance for studying in Europe.",
        url: "https://nextupmentor.com/contact",
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
