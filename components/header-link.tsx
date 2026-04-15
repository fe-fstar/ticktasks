"use client";

import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";
import { ComponentProps } from "react";
import ReducableViewTransition from "./reducable-view-transition";

export default function HeaderLink({ className, ...props }: ComponentProps<typeof Link>) {
    const pathname = usePathname();
    const isActive = pathname === props.href;

    return (<Link
        className={cn("relative transition-colors h-header px-4 flex items-center", isActive ? "text-primary-foreground" : "text-foreground", className)}
        {...props}
    >
        {isActive && (<ReducableViewTransition name="header-link-bg">
            <span className="absolute inset-0 -z-10 bg-primary" />
        </ReducableViewTransition>)}
        {props.children}
    </Link>);
}