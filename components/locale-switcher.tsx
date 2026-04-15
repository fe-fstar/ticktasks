"use client";

import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useState } from "react";
import { GlobeIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "./ui/button";

export default function LocaleSwitcher() {
    const { locale, ...paramsWithoutLocale } = useParams();
    const pathname = usePathname();
    const locales = routing.locales;
    const [isOpen, setIsOpen] = useState(false);

    const options = locales.map((traversedLocale) => ({
        locale: traversedLocale,
        pathname: getPathname({
            locale: traversedLocale,
            href: {
                pathname,
                params: paramsWithoutLocale
            } as any
        })
    }));

    return (
        <div className="relative overflow-visible">
            <Button
                variant={"ghost"}
                onClick={() => setIsOpen(!isOpen)}
            >
                <GlobeIcon className="me-1" />
                {(locale as string).toUpperCase()}
            </Button>
            <div className={`absolute z-50 left-0 border-foreground/60 max-lg:bottom-[125%] lg:top-[125%] *:block bg-background text-foreground *:hover:bg-foreground *:hover:text-background divide-y divide-foreground/60 border rounded-md *:px-4 *:py-2 ${isOpen ? "" : "sr-only"}`}>
                {options.map(({ locale: optionLocale, pathname: optionPathname }) => (
                    <Link
                        key={optionLocale}
                        href={optionPathname as any}
                        onClick={() => setIsOpen(false)}
                    >
                        {optionLocale.toUpperCase()}
                    </Link>
                ))}
            </div>
        </div>
    );
}