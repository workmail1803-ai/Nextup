"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

interface AnimatedPriceProps {
    value: number;
    symbol: string;
    className?: string;
}

export default function AnimatedPrice({ value, symbol, className = "" }: AnimatedPriceProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const previousValue = useRef(value);
    const motionValue = useMotionValue(value);
    const springValue = useSpring(motionValue, {
        stiffness: 100,
        damping: 30,
        mass: 1,
    });

    useEffect(() => {
        if (previousValue.current !== value) {
            motionValue.set(value);
            previousValue.current = value;
        }
    }, [value, motionValue]);

    useEffect(() => {
        const unsubscribe = springValue.on("change", (latest) => {
            setDisplayValue(Math.round(latest));
        });
        return () => unsubscribe();
    }, [springValue]);

    return (
        <motion.span
            className={className}
            key={symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {symbol} {displayValue.toLocaleString()}
        </motion.span>
    );
}
