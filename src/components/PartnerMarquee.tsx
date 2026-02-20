"use client";

import { motion } from "framer-motion";

const partners = [
    "SAPIENZA UNIVERSITY",
    "VILNIUS UNIVERSITY",
    "POLITECNICO DI MILANO",
    "KAUNAS UNIVERSITY",
    "UNIVERSITY OF BOLOGNA",
    "JAGIELLONIAN UNIVERSITY",
    "SEMMELWEIS UNIVERSITY",
    "UNIVERSITY OF PADUA",
    "HEIDELBERG UNIVERSITY",
    "EÖTVÖS LORÁND UNIVERSITY",
];

export default function PartnerMarquee() {
    // Duplicate partners for seamless infinite scroll
    const duplicatedPartners = [...partners, ...partners];

    return (
        <section className="py-8 md:py-12 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-6 md:mb-8">
                <p className="text-center text-xs md:text-sm text-slate-500 uppercase tracking-widest">
                    Partnered with Leading European Universities
                </p>
            </div>

            {/* Marquee Container */}
            <div className="relative">
                {/* Gradient fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

                {/* Scrolling content */}
                <motion.div
                    className="flex gap-8 md:gap-16 items-center"
                    animate={{
                        x: [0, -50 * partners.length * 2],
                    }}
                    transition={{
                        x: {
                            duration: 40,
                            repeat: Infinity,
                            ease: "linear",
                        },
                    }}
                    style={{ width: "fit-content" }}
                >
                    {duplicatedPartners.map((partner, index) => (
                        <div
                            key={`${partner}-${index}`}
                            className="flex-shrink-0 px-4 md:px-8 py-2 md:py-4 flex items-center gap-2 md:gap-3"
                        >
                            <span className="text-lg md:text-xl">🎓</span>
                            <span className="text-sm md:text-lg lg:text-xl font-semibold text-slate-600 hover:text-amber-400 transition-colors duration-300 whitespace-nowrap tracking-wide">
                                {partner}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
