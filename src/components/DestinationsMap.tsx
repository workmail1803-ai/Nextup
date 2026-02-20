"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Destination {
    id: string;
    name: string;
    flag: string;
    universities: string[];
    pathData: string;
    labelX: number;
    labelY: number;
}

// Real simplified country paths for Europe map (viewBox coordinates)
const destinations: Destination[] = [
    {
        id: "italy",
        name: "Italy",
        flag: "🇮🇹",
        universities: [
            "Sapienza University of Rome",
            "Politecnico di Milano",
            "University of Bologna",
            "University of Padua",
        ],
        pathData: "M248,180 L255,175 L262,180 L268,190 L265,205 L270,215 L275,230 L280,245 L275,255 L268,265 L258,275 L250,280 L245,275 L250,265 L252,250 L248,235 L242,225 L238,210 L240,195 L245,185 Z M285,270 L295,265 L305,270 L308,280 L300,290 L288,285 Z M255,290 L265,288 L272,295 L268,305 L258,308 L252,300 Z",
        labelX: 260,
        labelY: 220,
    },
    {
        id: "lithuania",
        name: "Lithuania",
        flag: "🇱🇹",
        universities: [
            "Vilnius University",
            "Kaunas University of Technology",
            "Vilnius Gediminas Technical University",
            "Lithuanian University of Health Sciences",
        ],
        pathData: "M290,95 L310,92 L325,98 L328,108 L320,118 L305,120 L290,115 L285,105 Z",
        labelX: 307,
        labelY: 105,
    },
    {
        id: "germany",
        name: "Germany",
        flag: "🇩🇪",
        universities: [
            "Technical University of Munich",
            "Ludwig Maximilian University",
            "Heidelberg University",
            "Humboldt University of Berlin",
        ],
        pathData: "M210,105 L225,100 L245,105 L260,108 L265,118 L260,130 L255,145 L248,155 L235,160 L220,158 L205,150 L200,138 L195,125 L200,115 Z",
        labelX: 228,
        labelY: 130,
    },
    {
        id: "poland",
        name: "Poland",
        flag: "🇵🇱",
        universities: [
            "University of Warsaw",
            "Jagiellonian University",
            "Warsaw University of Technology",
            "Adam Mickiewicz University",
        ],
        pathData: "M265,108 L285,105 L305,110 L320,118 L318,132 L310,145 L295,155 L278,158 L262,152 L255,145 L260,130 L265,118 Z",
        labelX: 287,
        labelY: 132,
    },
    {
        id: "hungary",
        name: "Hungary",
        flag: "🇭🇺",
        universities: [
            "Semmelweis University",
            "University of Debrecen",
            "Eötvös Loránd University",
            "Budapest University of Technology",
        ],
        pathData: "M262,158 L280,155 L298,160 L308,168 L305,180 L292,188 L275,190 L260,185 L252,175 L255,165 Z",
        labelX: 280,
        labelY: 172,
    },
];

// Other European countries for context (not clickable)
const otherCountries = [
    // France
    { path: "M120,140 L145,130 L170,135 L195,140 L200,155 L195,175 L180,190 L155,195 L130,185 L115,170 L110,155 L115,145 Z", id: "france" },
    // Spain
    { path: "M80,175 L110,165 L130,170 L145,180 L150,200 L140,220 L115,230 L85,225 L65,210 L60,190 L70,180 Z", id: "spain" },
    // UK
    { path: "M115,85 L130,80 L140,90 L145,105 L140,120 L125,125 L110,118 L105,105 L108,92 Z M100,105 L108,100 L115,108 L110,118 L100,115 Z", id: "uk" },
    // Sweden
    { path: "M250,30 L265,25 L275,35 L278,55 L272,75 L262,90 L250,85 L245,65 L248,45 Z", id: "sweden" },
    // Norway
    { path: "M225,20 L245,15 L255,25 L250,45 L240,60 L235,50 L230,35 Z", id: "norway" },
    // Finland
    { path: "M290,25 L310,22 L325,35 L330,55 L320,75 L305,80 L290,70 L285,50 L288,35 Z", id: "finland" },
    // Austria
    { path: "M235,160 L255,158 L268,165 L265,175 L252,180 L238,178 L230,170 Z", id: "austria" },
    // Czech Republic
    { path: "M245,145 L262,142 L275,148 L278,158 L268,165 L252,162 L242,155 Z", id: "czech" },
    // Romania
    { path: "M308,168 L330,165 L345,175 L348,190 L340,205 L320,210 L305,200 L300,185 Z", id: "romania" },
    // Greece
    { path: "M295,215 L312,210 L325,218 L330,235 L320,250 L305,255 L295,245 L290,230 Z", id: "greece" },
    // Ukraine
    { path: "M330,115 L365,110 L395,120 L400,145 L390,165 L360,175 L335,170 L320,155 L318,135 Z", id: "ukraine" },
    // Belarus
    { path: "M310,95 L335,92 L350,102 L348,118 L335,125 L318,122 L308,112 Z", id: "belarus" },
    // Netherlands
    { path: "M185,108 L200,105 L208,115 L205,125 L192,128 L182,120 Z", id: "netherlands" },
    // Belgium
    { path: "M175,125 L190,122 L198,132 L192,142 L178,145 L172,135 Z", id: "belgium" },
    // Switzerland
    { path: "M200,160 L218,158 L228,165 L225,175 L212,178 L198,172 Z", id: "switzerland" },
    // Portugal
    { path: "M55,185 L72,180 L78,195 L75,215 L62,225 L52,215 L50,198 Z", id: "portugal" },
    // Ireland
    { path: "M75,90 L95,85 L102,98 L98,112 L82,115 L70,105 Z", id: "ireland" },
    // Denmark
    { path: "M215,85 L232,82 L240,92 L235,102 L220,105 L212,95 Z", id: "denmark" },
];

export default function DestinationsMap() {
    const [activeDestination, setActiveDestination] = useState<Destination | null>(null);

    const handleDestinationClick = (dest: Destination) => {
        setActiveDestination(activeDestination?.id === dest.id ? null : dest);
    };

    return (
        <section id="destinations" className="py-16 md:py-24 px-4 md:px-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8 md:mb-12"
                >
                    <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-4 md:mb-6">
                        🌍 Study Destinations
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
                        Explore <span className="text-gradient">European Universities</span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto px-4">
                        Click on a highlighted country to discover top universities and programs
                    </p>
                </motion.div>

                {/* Interactive Map Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative glass-card rounded-2xl md:rounded-3xl p-3 md:p-8"
                >
                    {/* Real Europe Map SVG */}
                    <div className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-xl md:rounded-2xl overflow-hidden">
                        <svg
                            viewBox="0 80 450 250"
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {/* Ocean/Sea background */}
                            <rect x="0" y="0" width="500" height="400" fill="#0f172a" />

                            {/* Mediterranean Sea hint */}
                            <ellipse cx="250" cy="280" rx="180" ry="40" fill="#1e3a5f" opacity="0.2" />

                            {/* Baltic Sea */}
                            <ellipse cx="280" cy="70" rx="50" ry="30" fill="#1e3a5f" opacity="0.2" />

                            {/* Other European countries (background context - no borders) */}
                            {otherCountries.map((country) => (
                                <path
                                    key={country.id}
                                    d={country.path}
                                    fill="#1e293b"
                                    stroke="none"
                                    className="transition-colors duration-300"
                                />
                            ))}

                            {/* Partner destination countries (interactive) */}
                            {destinations.map((dest) => (
                                <g key={dest.id}>
                                    <motion.path
                                        d={dest.pathData}
                                        fill={activeDestination?.id === dest.id ? "#f59e0b" : "#475569"}
                                        stroke={activeDestination?.id === dest.id ? "#fbbf24" : "none"}
                                        strokeWidth={activeDestination?.id === dest.id ? "2" : "0"}
                                        className="cursor-pointer transition-all duration-300 hover:fill-[#f59e0b] hover:fill-opacity-80"
                                        onClick={() => handleDestinationClick(dest)}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    />

                                    {/* Country label - hidden on mobile, visible on larger screens */}
                                    <text
                                        x={dest.labelX}
                                        y={dest.labelY}
                                        textAnchor="middle"
                                        className="hidden md:block text-[8px] font-bold fill-white pointer-events-none select-none"
                                        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                                    >
                                        {dest.name}
                                    </text>
                                </g>
                            ))}
                        </svg>

                        {/* Legend - responsive */}
                        <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 glass rounded-lg px-2 md:px-3 py-1 md:py-2 text-[10px] md:text-xs text-slate-400">
                            <span className="inline-block w-2 h-2 md:w-3 md:h-3 bg-amber-500 rounded mr-1 md:mr-2"></span>
                            <span className="hidden sm:inline">Partner Countries (Click to explore)</span>
                            <span className="sm:hidden">Tap to explore</span>
                        </div>
                    </div>

                    {/* Tooltip / Info Panel - Mobile Optimized */}
                    <AnimatePresence>
                        {activeDestination && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="mt-4 md:mt-6 p-4 md:p-6 bg-slate-800/80 rounded-xl md:rounded-2xl border border-amber-500/20"
                            >
                                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                                    <span className="text-2xl md:text-3xl">{activeDestination.flag}</span>
                                    <h3 className="text-xl md:text-2xl font-bold text-white">
                                        Study in {activeDestination.name}
                                    </h3>
                                </div>
                                <p className="text-slate-400 mb-3 md:mb-4 text-sm md:text-base">Top Partner Universities:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                                    {activeDestination.universities.map((uni, idx) => (
                                        <motion.div
                                            key={uni}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-center gap-2 text-slate-300"
                                        >
                                            <svg
                                                className="w-4 h-4 text-amber-400 flex-shrink-0"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                            </svg>
                                            <span className="text-xs md:text-sm">{uni}</span>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 mt-4 md:mt-6">
                                    <a
                                        href="#packages"
                                        className="px-4 md:px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full font-semibold text-slate-900 text-sm text-center hover:scale-105 transition-transform duration-200"
                                    >
                                        View Programs in {activeDestination.name}
                                    </a>
                                    <button
                                        onClick={() => setActiveDestination(null)}
                                        className="px-4 md:px-6 py-2 glass rounded-full font-medium text-slate-300 text-sm hover:text-white hover:scale-105 transition-transform duration-200"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
}
