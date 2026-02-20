"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CurrencyProvider, useCurrency } from "@/context/CurrencyContext";
import { db, Package } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import FloatingContact from "@/components/FloatingContact";
import SpotlightCursor from "@/components/SpotlightCursor";
import AnimatedPrice from "@/components/AnimatedPrice";
import PaymentModal from "@/components/PaymentModal";
import Image from "next/image";
import Link from "next/link";

function PackageDetailsContent() {
    const params = useParams();
    const id = params.id as string;
    const [pkg, setPkg] = useState<Package | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const { convertPrice, symbol, formatPrice } = useCurrency();

    useEffect(() => {
        const fetchPackage = async () => {
            try {
                if (id) {
                    const data = await db.packages.getById(id);
                    setPkg(data);
                }
            } catch (error) {
                console.error("Error fetching package:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPackage();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!pkg) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                <h1 className="text-4xl font-bold mb-4">Package Not Found</h1>
                <Link href="/services" className="text-amber-400 hover:underline">
                    Back to Packages
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen relative bg-slate-950">
            <SpotlightCursor />
            <Navbar />

            <div className="pt-32 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="mb-8 flex items-center gap-2 text-slate-400 text-sm">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <span>/</span>
                    <Link href="/services" className="hover:text-white transition-colors">Services</Link>
                    <span>/</span>
                    <span className="text-amber-400">{pkg.title}</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Left Column: Images */}
                    <div className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative h-[400px] rounded-2xl overflow-hidden glass-card border border-slate-800"
                        >
                            {pkg.images && pkg.images.length > 0 ? (
                                <Image
                                    src={pkg.images[activeImage]}
                                    alt={pkg.title}
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                                    <span className="text-8xl opacity-20">{pkg.icon}</span>
                                </div>
                            )}

                            {/* Popular Badge */}
                            {pkg.is_popular && (
                                <div className="absolute top-4 right-4 z-20 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full text-sm font-bold text-slate-900 shadow-lg">
                                    Most Popular Choice
                                </div>
                            )}
                        </motion.div>

                        {/* Thumbnails */}
                        {pkg.images && pkg.images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2">
                                {pkg.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={`relative w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? "border-amber-500" : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <Image src={img} alt={`View ${idx + 1}`} fill sizes="96px" className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-8"
                    >
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-4xl">{pkg.icon}</span>
                                <h1 className="text-4xl md:text-5xl font-bold text-white">{pkg.title}</h1>
                            </div>
                            <p className="text-xl text-slate-400 leading-relaxed">
                                {pkg.subtitle}
                            </p>
                        </div>

                        <div className="p-6 glass-card rounded-xl border border-amber-500/20 bg-amber-500/5">
                            <div className="flex items-end gap-2 mb-2">
                                <AnimatedPrice
                                    value={convertPrice(pkg.price)}
                                    symbol={symbol}
                                    className="text-4xl font-bold text-amber-400"
                                />
                            </div>
                            <p className="text-sm text-slate-500">
                                Check with our team for installment options and available discounts.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">What&apos;s Included</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {pkg.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors">
                                        <div className="mt-1 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                            <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-slate-300">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-800">
                            <button
                                onClick={() => setModalOpen(true)}
                                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-bold text-slate-900 text-lg hover:shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] transition-all duration-300"
                            >
                                Book Now - {symbol}{formatPrice(pkg.price)}
                            </button>
                            <p className="text-center text-slate-500 text-sm mt-4">
                                Secure your spot today. 100% money-back guarantee if visa is rejected (Terms Apply).
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <FloatingContact />

            <PaymentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                packageId={pkg.id}
                packageTitle={pkg.title}
                packagePrice={formatPrice(pkg.price)}
                packageAmount={pkg.price}
            />
        </main>
    );
}

export default function PackageDetailsPage() {
    return (
        <CurrencyProvider>
            <PackageDetailsContent />
        </CurrencyProvider>
    );
}
