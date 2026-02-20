"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CurrencyProvider } from "@/context/CurrencyContext";
import Navbar from "@/components/Navbar";
import DestinationsMap from "@/components/DestinationsMap";
import FloatingContact from "@/components/FloatingContact";
import SpotlightCursor from "@/components/SpotlightCursor";
import PartnerMarquee from "@/components/PartnerMarquee";
import { db, Destination } from "@/lib/supabase";



function DestinationsContent() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        db.destinations.getAll()
            .then(setDestinations)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <main className="min-h-screen relative">
            {/* Spotlight Cursor Effect */}
            <SpotlightCursor />

            <Navbar />

            {/* Hero Section for Destinations */}
            <section className="pt-32 pb-16 px-6 md:px-12">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-6">
                            🌍 Study Destinations
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Explore Our <span className="text-gradient">European Destinations</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                            Discover the best European countries for international students. Each destination
                            offers unique opportunities, culture, and educational excellence.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Destinations Grid */}
            <section className="py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {destinations.map((dest, index) => (
                                <motion.div
                                    key={dest.id}
                                    className="glass-card rounded-2xl p-6 group cursor-pointer"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02, y: -5 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">{dest.flag}</span>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{dest.country}</h3>
                                            <p className="text-sm text-amber-400">{dest.university_count}+ Partner Universities</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4">{dest.description}</p>
                                    <div className="space-y-2">
                                        {dest.highlights.map((highlight, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-2 text-sm text-slate-300"
                                            >
                                                <span className="text-amber-400">✓</span>
                                                {highlight}
                                            </div>
                                        ))}
                                    </div>
                                    {/* <motion.div
                                        className="mt-6 pt-4 border-t border-slate-700/50"
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                    >
                                        <span className="text-amber-400 text-sm font-medium group-hover:underline">
                                            Learn more →
                                        </span>
                                    </motion.div> */}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Interactive Map */}
            <DestinationsMap />

            {/* Why Study in Europe Section */}
            <section className="py-24 px-6 bg-slate-900/30">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-6">
                            ✨ Benefits
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            Why Study in <span className="text-gradient">Europe?</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: "💰", title: "Affordable Education", desc: "Many countries offer free or low-cost tuition" },
                            { icon: "🌐", title: "Global Recognition", desc: "Degrees recognized worldwide" },
                            { icon: "💼", title: "Work Opportunities", desc: "Post-study work permits available" },
                            { icon: "🎭", title: "Cultural Experience", desc: "Rich history and diverse cultures" },
                        ].map((item, index) => (
                            <motion.div
                                key={item.title}
                                className="glass-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <div className="text-4xl mb-3">{item.icon}</div>
                                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partner Universities Marquee */}
            <PartnerMarquee />

            {/* Floating Contact Buttons */}
            <FloatingContact />
        </main>
    );
}

export default function DestinationsPage() {
    return (
        <CurrencyProvider>
            <DestinationsContent />
        </CurrencyProvider>
    );
}
