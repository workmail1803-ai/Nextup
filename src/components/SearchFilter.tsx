"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface SearchFilterProps {
    onSearchChange: (query: string) => void;
    onFilterChange: (filters: string[]) => void;
    activeFilters: string[];
}

const filterChips = [
    { id: "mountain", label: "Mountain", icon: "🏔️" },
    { id: "beach", label: "Beach", icon: "🏖️" },
    { id: "city", label: "City", icon: "🌆" },
    { id: "luxury", label: "Luxury", icon: "✨" },
];

export default function SearchFilter({
    onSearchChange,
    onFilterChange,
    activeFilters,
}: SearchFilterProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        onSearchChange(value);
    };

    const toggleFilter = (filterId: string) => {
        if (activeFilters.includes(filterId)) {
            onFilterChange(activeFilters.filter((f) => f !== filterId));
        } else {
            onFilterChange([...activeFilters, filterId]);
        }
    };

    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="py-12 px-6"
        >
            <div className="max-w-4xl mx-auto">
                {/* Glassmorphic Search Container */}
                <div className="glass-card rounded-2xl p-6 glow-cyan">
                    {/* Search Input */}
                    <div className="relative mb-6">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg
                                className="w-5 h-5 text-cyan-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchInput}
                            placeholder="Where do you want to go?"
                            className="w-full bg-slate-800/80 rounded-xl pl-12 pr-4 py-4 text-lg text-white placeholder-slate-500 border border-slate-700 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        />
                    </div>

                    {/* Filter Chips */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        {filterChips.map((chip) => {
                            const isActive = activeFilters.includes(chip.id);
                            return (
                                <button
                                    key={chip.id}
                                    onClick={() => toggleFilter(chip.id)}
                                    className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all flex items-center gap-2 hover:scale-105 duration-200 ${isActive
                                        ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900"
                                        : "bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-cyan-500/50"
                                        }`}
                                >
                                    <span>{chip.icon}</span>
                                    <span>{chip.label}</span>
                                </button>
                            );
                        })}

                        {/* Clear filters button */}
                        {activeFilters.length > 0 && (
                            <button
                                onClick={() => onFilterChange([])}
                                className="px-4 py-2.5 rounded-full text-sm text-slate-400 hover:text-cyan-400 transition-all duration-200 hover:scale-105"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
