import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/admin", "/staff_portal"],
            },
        ],
        sitemap: "https://nextupmentor.com/sitemap.xml",
    };
}
