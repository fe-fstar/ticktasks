"use client";

import React from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useReducedMotion } from "motion/react";

/* ---------------------------------- */
/* Context                            */
/* ---------------------------------- */

type AccordionContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  buttonId: string;
  panelId: string;
  reducedMotion: boolean;
};

const AccordionContext = React.createContext<AccordionContextType | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error("Accordion components must be used within <Accordion>");
  return ctx;
}

/* ---------------------------------- */
/* Root                               */
/* ---------------------------------- */

export function Accordion({
  children,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const reducedMotion = useReducedMotion() ?? false;

  const buttonId = React.useId();
  const panelId = React.useId();

  return (
    <AccordionContext.Provider
      value={{ open, setOpen, buttonId, panelId, reducedMotion }}
    >
      <div>{children}</div>
    </AccordionContext.Provider>
  );
}

/* ---------------------------------- */
/* Trigger                            */
/* ---------------------------------- */

export function AccordionTrigger({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen, buttonId, panelId, reducedMotion } = useAccordion();

  return (
    <button
      {...props}
      id={buttonId}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={(e) => {
        props.onClick?.(e);
        setOpen((v) => !v);
      }}
      className={`
        cursor-pointer w-full flex items-center justify-between gap-4
        bg-primary text-primary-foreground p-2
        ${className}
      `}
    >
      {children}

      <CaretDownIcon
        className={`
          transition-transform
          ${reducedMotion ? "duration-0" : "duration-300"}
          ${open ? "rotate-180" : ""}
        `}
      />
    </button>
  );
}

/* ---------------------------------- */
/* Content                            */
/* ---------------------------------- */

export function AccordionContent({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, panelId, buttonId, reducedMotion } = useAccordion();

  const durationOpen = reducedMotion ? "0ms" : "320ms";
  const durationClose = reducedMotion ? "0ms" : "220ms";

  const contentDurationOpen = reducedMotion ? "0ms" : "350ms";
  const contentDurationClose = reducedMotion ? "0ms" : "150ms";

  return (
    <div
      {...props}
      id={panelId}
      role="region"
      aria-labelledby={buttonId}
      className={`
        border border-foreground
        grid transition-[grid-template-rows]
        ${className}
      `}
      style={{
        gridTemplateRows: open ? "1fr" : "0fr",
        transitionDuration: open ? durationOpen : durationClose,
        transitionTimingFunction: reducedMotion
          ? "linear"
          : open
          ? "cubic-bezier(0.22, 1, 0.36, 1)" // natural open
          : "cubic-bezier(0.4, 0, 1, 1)",   // fast close
      }}
    >
      <div className="overflow-hidden">
        <div
          className={`
            transition-[opacity,transform]
            ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}
          `}
          style={{
            transitionDuration: open
              ? contentDurationOpen
              : contentDurationClose,
            transitionTimingFunction: reducedMotion
              ? "linear"
              : open
              ? "cubic-bezier(0.22, 1, 0.36, 1)"
              : "linear",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}