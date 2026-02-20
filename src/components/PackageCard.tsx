"use client";

import { useRef, MouseEvent } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCurrency } from "@/context/CurrencyContext";
import AnimatedPrice from "./AnimatedPrice";

interface PackageCardProps {
    image: string;
    title: string;
    features: string[];
    price: number; // Price in BDT as a number
    onPayNow: () => void;
    index: number;
}

export default function PackageCard({
    image,
    title,
    features,
    price,
    onPayNow,
    index,
}: PackageCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const { convertPrice, symbol } = useCurrency();

    // Magnetic hover effect state
    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cardRef.current.style.setProperty("--mouse-x", `${x}px`);
        cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    };

    return (
        <motion.div
            ref={cardRef}
            className="glass-card rounded-2xl overflow-hidden group cursor-pointer relative"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onMouseMove={handleMouseMove}
            whileHover={{ scale: 1.02 }}
            layout
        >
            {/* Image */}
            <div className="relative h-56 overflow-hidden">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

                {/* Price badge with animated price */}
                <div className="absolute top-4 right-4 px-4 py-2 glass rounded-full">
                    <AnimatedPrice
                        value={convertPrice(price)}
                        symbol={symbol}
                        className="text-cyan-400 font-bold"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                    {title}
                </h3>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-slate-400">
                            <svg
                                className="w-5 h-5 text-teal-400 mr-3 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            {feature}
                        </li>
                    ))}
                </ul>

                {/* Pay Now Button */}
                <button
                    onClick={onPayNow}
                    className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl font-semibold text-slate-900 relative overflow-hidden group/btn hover:scale-102 transition-transform duration-200"
                >
                    <span className="relative z-10">Pay Now</span>
                </button>
            </div>
        </motion.div>
    );
}
