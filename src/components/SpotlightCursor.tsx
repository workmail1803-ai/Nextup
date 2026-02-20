"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function SpotlightCursor() {
    const [mounted, setMounted] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const spotlightX = useSpring(mouseX, springConfig);
    const spotlightY = useSpring(mouseY, springConfig);

    useEffect(() => {
        setMounted(true);

        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    if (!mounted) return null;

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
            style={{
                background: "transparent",
            }}
        >
            <motion.div
                className="absolute"
                style={{
                    width: 400,
                    height: 400,
                    x: spotlightX,
                    y: spotlightY,
                    translateX: "-50%",
                    translateY: "-50%",
                    background: `radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(20, 184, 166, 0.08) 30%, transparent 70%)`,
                    filter: "blur(1px)",
                }}
            />
            {/* Secondary smaller glow for more intensity at center */}
            <motion.div
                className="absolute"
                style={{
                    width: 200,
                    height: 200,
                    x: spotlightX,
                    y: spotlightY,
                    translateX: "-50%",
                    translateY: "-50%",
                    background: `radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 60%)`,
                }}
            />
        </motion.div>
    );
}
