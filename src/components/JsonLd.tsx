export default function JsonLd() {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "NextUp Mentor",
        alternateName: ["NextUp Mentors", "NextUp Mentor Study Abroad Agency"],
        url: "https://nextupmentor.com",
        logo: "https://nextupmentor.com/icon.png",
        description:
            "NextUp Mentor is a student-led study abroad agency in Bangladesh specialising in Italy, Lithuania, Germany and wider Europe. We provide honest, structured guidance from university admission and scholarships to student visa processing and beyond.",
        email: "nextupmentor@gmail.com",
        telephone: "+8801726867991",
        address: {
            "@type": "PostalAddress",
            addressCountry: "BD",
        },
        sameAs: [
            "https://www.facebook.com/profile.php?id=61585820771768",
            "https://www.instagram.com/nextup_mentor",
        ],
        areaServed: {
            "@type": "Country",
            name: "Bangladesh",
        },
        knowsAbout: [
            "Study in Italy",
            "Study in Lithuania",
            "Study in Germany",
            "Study abroad from Bangladesh",
            "European university admission",
            "DSU scholarship Italy",
            "Student visa processing",
        ],
        serviceType: [
            "Italy study abroad agency",
            "Lithuania study abroad agency",
            "University Admissions",
            "Student Visa Processing",
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
