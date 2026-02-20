"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { CurrencyProvider, useCurrency } from "@/context/CurrencyContext";
import { db, Package } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import MentorshipCard from "@/components/MentorshipCard";
import PaymentModal from "@/components/PaymentModal";
import FloatingContact from "@/components/FloatingContact";
import SpotlightCursor from "@/components/SpotlightCursor";

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

function ServicesContent() {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState({
        id: "",
        title: "",
        price: "",
        amount: 0,
    });
    const { formatPrice } = useCurrency();

    // Fetch packages from Supabase
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await db.packages.getAll();
                setPackages(data);
            } catch (error) {
                console.error("Error fetching packages:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    const handleEnroll = (id: string, title: string, price: number) => {
        setSelectedPackage({ id, title, price: formatPrice(price), amount: price });
        setModalOpen(true);
    };

    return (
        <main className="min-h-screen relative">
            {/* Spotlight Cursor Effect */}
            <SpotlightCursor />

            <Navbar />

            {/* Hero Section for Services */}
            <section className="pt-32 pb-16 px-6 md:px-12">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-6">
                            📋 Our Services
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Mentorship <span className="text-gradient">Packages</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Choose the support level that fits your journey to Europe. We offer comprehensive
                            guidance for every step of your study abroad experience.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mentorship Packages Section */}
            <section className="py-16 px-6 md:px-12">
                <div className="max-w-7xl mx-auto">
                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
                        </div>
                    )}

                    {/* Grid Layout for Cards */}
                    {!loading && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {packages.map((pkg, index) => (
                                <motion.div
                                    key={pkg.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="h-full"
                                >
                                    <MentorshipCard
                                        id={pkg.id}
                                        icon={pkg.icon}
                                        title={pkg.title}
                                        subtitle={pkg.subtitle || ""}
                                        features={pkg.features}
                                        price={pkg.price}
                                        popular={pkg.is_popular}
                                        images={pkg.images}
                                        index={index}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && packages.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-400">No packages available. Please check back later.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Why Choose Us Section */}
            <section className="py-24 px-6 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                            Why Choose <span className="text-gradient">Our Services?</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: "🎓", title: "Expert Mentors", desc: "Guidance from European alumni" },
                            { icon: "📋", title: "Proven Process", desc: "Structured step-by-step methodology" },
                            { icon: "💯", title: "High Success Rate", desc: "Above 95% visa approval" },
                            { icon: "🤝", title: "Ongoing Support", desc: "Pre & post-departure assistance" },
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
                                <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                                <p className="text-sm text-slate-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>



            {/* Floating Contact Buttons */}
            <FloatingContact />

            {/* Payment Modal */}
            <PaymentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                packageId={selectedPackage.id}
                packageTitle={selectedPackage.title}
                packagePrice={selectedPackage.price}
                packageAmount={selectedPackage.amount}
            />
        </main>
    );
}

export default function ServicesPage() {
    return (
        <CurrencyProvider>
            <ServicesContent />
        </CurrencyProvider>
    );
}
