"use client";

import { useEffect, useState } from "react";
import { useMotionSafe } from "@/hooks/motion-safe";
import { motion, type TargetAndTransition } from "motion/react";
import ReducableViewTransition from "@/components/reducable-view-transition";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";

interface AnimatedFormBoxProps {
  name: string;
  children: React.ReactNode;
  className?: string;
}

// How many form boxes are on screen right now. Every form box shares the
// view-transition name, so when one page with a box navigates to another, the
// browser already morphs the old box into the new one. Playing the clip reveal
// on top of that morph would be two entrances for one element.
let mountedBoxes = 0;

export default function AnimatedFormBox({
  name,
  children,
  className,
}: AnimatedFormBoxProps) {
  // Read during render, before the outgoing page's box unmounts: if one is
  // still mounted, this box arrives through the morph and skips the reveal.
  // On the first page load there is no other box, so the reveal plays (and the
  // server and client agree, so hydration is unaffected).
  const [arrivesByMorph] = useState(() => mountedBoxes > 0);

  useEffect(() => {
    mountedBoxes++;
    return () => {
      mountedBoxes--;
    };
  }, []);

  const reveal = useMotionSafe<TargetAndTransition>(
    {
      clipPath: [
        "inset(0 97% 97% 0)",
        "inset(0 0 97% 0)",
        "inset(0 0 0 0)",
      ],
      // Without an explicit transition Motion plays keyframes for 800ms with
      // linear easing, which hides the form well past the UI budget.
      transition: { duration: 0.45, times: [0, 0.4, 1], ease: EASE_OUT },
    },
    { clipPath: "inset(0 0 0 0)", transition: { duration: 0 } }
  );

  const clip: TargetAndTransition = arrivesByMorph
    ? { clipPath: "inset(0 0 0 0)", transition: { duration: 0 } }
    : reveal;

  return (
    <ReducableViewTransition name={name}>
      <motion.div
        className={cn(
          // grid-cols-1 is minmax(0, 1fr): without it the single implicit column
          // is `auto` and grows to its content's min-content width (a wide table),
          // pushing the box's children past the box and the page into sideways scroll.
          "p-2 py-4 sm:p-6 grid grid-cols-1 bg-card text-card-foreground border-2 border-foreground",
          className
        )}
        animate={clip}
      >
        {children}
      </motion.div>
    </ReducableViewTransition>
  );
}
