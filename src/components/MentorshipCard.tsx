"use client";

import { motion } from "framer-motion";
import { useCurrency } from "@/context/CurrencyContext";
import AnimatedPrice from "./AnimatedPrice";
import Link from "next/link";
import Image from "next/image";

interface MentorshipCardProps {
    id: string;
    icon: string;
    title: string;
    subtitle: string;
    features: string[];
    price: number;
    popular?: boolean;
    images?: string[];
    index: number;
}

export default function MentorshipCard({
    id,
    icon,
    title,
    subtitle,
    features,
    price,
    popular = false,
    images = [],
    index,
}: MentorshipCardProps) {
    const { convertPrice, symbol } = useCurrency();
    const coverImage = images.length > 0 ? images[0] : null;

    return (
        <Link href={`/packages/${id}`} className="block h-full">
            <div className={`glass-card rounded-2xl overflow-hidden group relative flex flex-col h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/10 ${popular ? "ring-1 ring-amber-500/50 glow-gold" : ""
                }`}>
                {/* Popular badge */}
                {popular && (
                    <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full text-xs font-semibold text-slate-900 shadow-lg">
                        Most Popular
                    </div>
                )}

                {/* Image Section */}
                <div className="w-full h-48 relative overflow-hidden bg-slate-800">
                    {coverImage ? (
                        <Image
                            src={coverImage}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800/50">
                            <span className="text-6xl opacity-20">{icon}</span>
                        </div>
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                </div>

                {/* Content Section */}
                <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{icon}</span>
                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                            {title}
                        </h3>
                    </div>

                    <p className="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                        {subtitle}
                    </p>

                    <div className="mb-6">
                        <AnimatedPrice
                            value={convertPrice(price)}
                            symbol={symbol}
                            className="text-2xl font-bold text-amber-400"
                        />
                        <span className="text-slate-500 text-xs">per package</span>
                    </div>

                    {/* Features Preview (First 3) */}
                    <div className="space-y-2 mb-6 flex-1">
                        {features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-start text-slate-300 text-sm">
                                <span className="text-amber-500 mr-2">✓</span>
                                <span className="line-clamp-1">{feature}</span>
                            </div>
                        ))}
                        {features.length > 3 && (
                            <div className="text-xs text-slate-500 pl-4 pt-1">
                                + {features.length - 3} more features
                            </div>
                        )}
                    </div>

                    {/* CTA Button */}
                    <div className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl font-semibold text-slate-900 text-center relative overflow-hidden group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all duration-300">
                        View Details
                    </div>
                </div>
            </div>
        </Link>
    );
}
