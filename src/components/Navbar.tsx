"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/services" },
    { name: "Destinations", href: "/destinations" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { currency, toggleCurrency } = useCurrency();
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const isActive = (href: string) => {
        if (href === "/") {
            return pathname === "/";
        }
        return pathname.startsWith(href);
    };

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "glass py-4" : "py-6 bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/">
                    <div
                        className="flex items-center gap-2 cursor-pointer transition-transform duration-300 hover:scale-105"
                    >
                        <span className="text-2xl font-bold">
                            <span className="text-white">NextUp</span>
                            <span className="text-gradient"> Mentor</span>
                        </span>
                    </div>
                </Link>

                {/* Navigation Links */}
                <ul className="hidden md:flex items-center gap-8">
                    {navLinks.map((link, index) => (
                        <motion.li
                            key={link.name}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.4 }}
                        >
                            <Link href={link.href}>
                                <span
                                    className={`relative font-medium transition-colors duration-300 cursor-pointer ${isActive(link.href)
                                        ? "text-amber-400"
                                        : "text-slate-300 hover:text-amber-400"
                                        } hover:scale-110 inline-block transition-transform`}
                                >
                                    {link.name}
                                    {isActive(link.href) && (
                                        <motion.span
                                            layoutId="activeNav"
                                            className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-600"
                                        />
                                    )}
                                </span>
                            </Link>
                        </motion.li>
                    ))}
                </ul>

                {/* Currency Toggle Switch */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="hidden md:flex items-center"
                >
                    <div className="relative flex items-center glass-card rounded-full p-1">
                        {/* Toggle Background */}
                        <motion.div
                            className="absolute h-8 w-14 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                            initial={false}
                            animate={{
                                x: currency === "BDT" ? 4 : 60,
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />

                        {/* BDT Option */}
                        <button
                            onClick={() => currency !== "BDT" && toggleCurrency()}
                            className={`relative z-10 px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${currency === "BDT" ? "text-slate-900" : "text-slate-400"
                                }`}
                        >
                            BDT
                        </button>

                        {/* EUR Option */}
                        <button
                            onClick={() => currency !== "EUR" && toggleCurrency()}
                            className={`relative z-10 px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${currency === "EUR" ? "text-slate-900" : "text-slate-400"
                                }`}
                        >
                            EUR
                        </button>
                    </div>
                </motion.div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-slate-300 hover:text-amber-400 transition-transform duration-300 hover:scale-110"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        {mobileMenuOpen ? (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        ) : (
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="md:hidden glass mt-4 mx-6 rounded-2xl p-4"
                >
                    <ul className="space-y-4">
                        {navLinks.map((link) => (
                            <li key={link.name}>
                                <Link
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block py-2 px-4 rounded-lg transition-colors ${isActive(link.href)
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "text-slate-300 hover:text-amber-400 hover:bg-slate-800/50"
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {/* Mobile Currency Toggle */}
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-slate-400 text-sm">Currency:</span>
                            <div className="relative flex items-center glass-card rounded-full p-1">
                                <motion.div
                                    className="absolute h-7 w-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                                    initial={false}
                                    animate={{
                                        x: currency === "BDT" ? 4 : 52,
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                                <button
                                    onClick={() => currency !== "BDT" && toggleCurrency()}
                                    className={`relative z-10 px-3 py-1 text-xs font-semibold transition-colors duration-200 ${currency === "BDT" ? "text-slate-900" : "text-slate-400"
                                        }`}
                                >
                                    BDT
                                </button>
                                <button
                                    onClick={() => currency !== "EUR" && toggleCurrency()}
                                    className={`relative z-10 px-3 py-1 text-xs font-semibold transition-colors duration-200 ${currency === "EUR" ? "text-slate-900" : "text-slate-400"
                                        }`}
                                >
                                    EUR
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
}

