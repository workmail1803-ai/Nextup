import { MetadataRoute } from "next";
import { COUNTRY_SLUGS } from "@/lib/seo/countries";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://nextupmentor.com";
    const now = new Date();

    const staticPages: MetadataRoute.Sitemap = [
        { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
        { url: `${baseUrl}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
        { url: `${baseUrl}/destinations`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
        { url: `${baseUrl}/eligibility`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
        { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
        { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ];

    // Dedicated country landing pages (Italy, Lithuania, Germany, Poland, Hungary).
    const countryPages: MetadataRoute.Sitemap = COUNTRY_SLUGS.map((slug) => ({
        url: `${baseUrl}/destinations/${slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.9,
    }));

    return [...staticPages, ...countryPages];
}
