export default function JsonLd() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "NextUp Mentor",
        alternateName: "NextUp Mentors",
        url: "https://nextupmentor.com",
        logo: "https://nextupmentor.com/icon.png",
        description:
            "NextUp Mentor is a premium study abroad consultancy in Bangladesh specializing in European destinations. We provide structured, transparent, and student-focused guidance from university application to visa processing and beyond.",
        email: "nextupmentor@gmail.com",
        telephone: "+8801726867991",
        sameAs: [
            "https://www.facebook.com/profile.php?id=61585820771768",
            "https://www.instagram.com/nextup_mentor",
        ],
        areaServed: {
            "@type": "Country",
            name: "Bangladesh",
        },
        serviceType: [
            "Study Abroad Consultancy",
            "University Admissions",
            "Visa Processing",
            "Education Mentorship",
        ],
    };

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "NextUp Mentor",
        alternateName: "NextUp Mentors",
        url: "https://nextupmentor.com",
        potentialAction: {
            "@type": "SearchAction",
            target: "https://nextupmentor.com/services",
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema),
                }}
            />
        </>
    );
}
