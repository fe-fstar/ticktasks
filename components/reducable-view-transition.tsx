"use client";

import { useReducedMotion } from "motion/react";
import { ViewTransition, type ViewTransitionProps } from "react";

export default function ReducableViewTransition({ 
    children, 
    ...props 
}: ViewTransitionProps) {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
        return <>{children}</>;
    }

    return <ViewTransition {...props}>{children}</ViewTransition>;
}
