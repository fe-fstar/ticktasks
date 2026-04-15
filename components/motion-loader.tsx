"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "motion/react";

export default function MotionLoader({ pending }: { pending?: boolean }) {
    const reducedMotion = useReducedMotion() ?? false;

    if (!pending) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 h-2 z-9999 overflow-hidden"
            role="progressbar"
            aria-label="Loading"
            style={{ pointerEvents: "none" }}
        >
            <motion.div
                className="h-full w-[200vw]"
                style={{
                    background: "linear-gradient(to right, var(--primary), var(--primary-foreground), var(--primary), var(--primary-foreground), var(--primary))",
                }}
                initial={{ x: "-50%" }}
                animate={{
                    x: "0%",
                }}
                transition={{
                    duration: reducedMotion ? 0 : 3,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />
        </div>
    );
}