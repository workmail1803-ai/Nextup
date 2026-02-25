import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "NextUp Mentor - Study Abroad Consultancy",
        short_name: "NextUp Mentor",
        description:
            "Your trusted partner for European education. Expert guidance for university admissions, visa processing, and complete mentorship.",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#f59e0b",
        icons: [
            {
                src: "/icon.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
