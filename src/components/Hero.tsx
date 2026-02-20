"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// Animated particle component - academic themed
const Particle = ({ delay, size, left, top }: { delay: number; size: number; left: string; top: string }) => (
    <motion.div
        className="absolute rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 particle"
        style={{ width: size, height: size, left, top }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
        transition={{
            duration: 4,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
        }}
    />
);

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden animated-gradient-bg">
            {/* Animated Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <Particle delay={0} size={100} left="10%" top="20%" />
                <Particle delay={1} size={60} left="80%" top="15%" />
                <Particle delay={2} size={80} left="70%" top="60%" />
                <Particle delay={0.5} size={120} left="20%" top="70%" />
                <Particle delay={1.5} size={50} left="50%" top="30%" />
                <Particle delay={2.5} size={90} left="85%" top="80%" />
                <Particle delay={3} size={70} left="5%" top="50%" />

                {/* Gradient orbs - Gold themed */}
                <motion.div
                    className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
                    style={{ left: "60%", top: "20%" }}
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
                <motion.div
                    className="absolute w-80 h-80 bg-amber-600/10 rounded-full blur-3xl"
                    style={{ left: "10%", top: "60%" }}
                    animate={{
                        x: [0, -30, 0],
                        y: [0, -40, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-6"
                >
                    <span className="inline-block px-4 py-2 glass-card rounded-full text-sm text-amber-400 font-medium mb-8">
                        🎓 Your Gateway to European Education
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
                >
                    Secure Your Future in
                    <br />
                    <span className="text-gradient">Europe&apos;s Top Universities</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12"
                >
                    Comprehensive guidance for Italy, Lithuania, and beyond.
                    <br />
                    From admission to visa—we are your mentors.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/services">
                        <button
                            className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full font-semibold text-slate-900 overflow-hidden hover:scale-105 transition-transform duration-300"
                        >
                            <span className="relative z-10">Start Assessment</span>
                        </button>
                    </Link>

                    <Link href="/contact">
                        <button
                            className="px-8 py-4 glass-card rounded-full font-semibold text-slate-300 hover:text-amber-400 hover:scale-105 transition-all duration-300"
                        >
                            Book Free Consultation
                        </button>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
