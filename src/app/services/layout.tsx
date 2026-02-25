import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Services - Mentorship Packages for Studying in Europe",
    description:
        "Explore NextUp Mentor's comprehensive mentorship packages for studying abroad in Europe. From university selection and application to visa processing, we provide end-to-end support.",
    alternates: {
        canonical: "https://nextupmentor.com/services",
    },
    openGraph: {
        title: "Mentorship Packages - NextUp Mentor",
        description:
            "Choose from our study abroad mentorship packages. Complete guidance for university admissions, visa processing, and more.",
        url: "https://nextupmentor.com/services",
    },
};

export default function ServicesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
