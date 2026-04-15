"use client";

import { useMotionSafe } from "@/hooks/motion-safe";
import { motion } from "motion/react";
import ReducableViewTransition from "@/components/reducable-view-transition";
import { cn } from "@/lib/utils";

interface AnimatedFormBoxProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedFormBox({
  name,
  children,
  className,
}: AnimatedFormBoxProps) {
  const clip = useMotionSafe(
    {
      clipPath: [
        "inset(0 97% 97% 0)",
        "inset(0 0 97% 0)",
        "inset(0 0 0 0)",
      ],
    },
    { clipPath: "inset(0 0 0 0)" }
  );

  return (
    <ReducableViewTransition name={name}>
      <motion.div
        className={cn(
          "p-6 grid bg-card text-card-foreground border-2 border-foreground",
          className
        )}
        animate={clip}
      >
        {children}
      </motion.div>
    </ReducableViewTransition>
  );
}
