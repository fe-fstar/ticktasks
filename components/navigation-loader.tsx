"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import MotionLoader from "./motion-loader";

export default function NavigationLoader() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleLinkClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest("a");

            if (!link) return;
            const href = link.getAttribute("href");
            if (!href) return;
            if (href.startsWith("#")) return;
            try {
                const url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) return;
                if (url.pathname === pathname) return;
            } catch {
                return;
            }
            setLoading(true);
        };
        document.addEventListener("click", handleLinkClick);
        return () => {
            document.removeEventListener("click", handleLinkClick);
        };
    }, [pathname]);

    useEffect(() => {
        setLoading(false);
    }, [pathname]);

    return <MotionLoader pending={loading} />;
}
