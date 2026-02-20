"use client";

import { motion } from "framer-motion";
import { CurrencyProvider } from "@/context/CurrencyContext";
import Navbar from "@/components/Navbar";
import DestinationsMap from "@/components/DestinationsMap";
import FloatingContact from "@/components/FloatingContact";
import SpotlightCursor from "@/components/SpotlightCursor";
import PartnerMarquee from "@/components/PartnerMarquee";

function AboutContent() {
    return (
        <main className="min-h-screen relative">
            {/* Spotlight Cursor Effect */}
            <SpotlightCursor />

            <Navbar />

            {/* Hero Section for About */}
            <section className="pt-32 pb-16 px-6 md:px-12">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-6">
                            🎯 About Us
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Your <span className="text-gradient">Trusted Partner</span> for European Education
                        </h1>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                            NextUp Mentor is a premium study abroad consultancy in Bangladesh specializing in
                            European destinations. We provide structured, transparent, and student-focused
                            guidance from university application to visa processing and beyond.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Our <span className="text-gradient">Story</span>
                            </h2>
                            <p className="text-lg text-slate-400 mb-6">
                                Founded by alumni of top European universities, NextUp Mentor was born from a simple
                                observation: too many talented Bangladeshi students miss out on incredible European
                                opportunities due to lack of proper guidance.
                            </p>
                            <p className="text-lg text-slate-400 mb-6">
                                Our team of experienced mentors, who themselves studied and worked in Europe, provide
                                personalized guidance at every step of your journey. We don&apos;t just process
                                applications—we build futures.
                            </p>
                            <p className="text-lg text-slate-400">
                                Today, we&apos;ve helped hundreds of students secure admissions and visas to their dream
                                European universities, with a success rate that speaks for itself.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {[
                                { number: "500+", label: "Students Placed" },
                                { number: "95%", label: "Visa Success Rate" },
                                { number: "15+", label: "Partner Universities" },
                                { number: "5+", label: "Years Experience" },
                            ].map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    className="glass-card rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                >
                                    <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">{stat.number}</div>
                                    <p className="text-sm text-slate-400">{stat.label}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* What We Offer Section */}
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
                            ✨ What We Offer
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            Our <span className="text-gradient">Core Values</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: "🎓", title: "Expert Mentors", desc: "European alumni guides with firsthand experience" },
                            { icon: "📋", title: "Proven Process", desc: "Structured methodology ensuring nothing is missed" },
                            { icon: "💯", title: "High Success", desc: "Industry-leading visa approval rates" },
                            { icon: "🤝", title: "Ongoing Support", desc: "Complete pre & post-departure assistance" },
                            { icon: "🛡️", title: "100% Transparency", desc: "All the payment will be done by you and you will have your email access" },
                            { icon: "💎", title: "No Hidden Charges", desc: "Full transparency on costs. No surprise fees." },
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

            {/* Interactive Destinations Map */}
            <DestinationsMap />

            {/* Partner Universities Marquee */}
            <PartnerMarquee />

            {/* Floating Contact Buttons */}
            <FloatingContact />
        </main>
    );
}

export default function AboutPage() {
    return (
        <CurrencyProvider>
            <AboutContent />
        </CurrencyProvider>
    );
}
