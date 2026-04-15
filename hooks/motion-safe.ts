import { useReducedMotion } from "motion/react";

export function useMotionSafe<T>(
    animated: T,
    reduced: T
): T {
    const prefersReduced = useReducedMotion();
    return prefersReduced ? reduced : animated;
}
