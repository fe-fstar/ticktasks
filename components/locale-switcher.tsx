"use client";

import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { GlobeIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "./ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function LocaleSwitcher() {
    const { locale, ...paramsWithoutLocale } = useParams();
    const pathname = usePathname();
    const locales = routing.locales;

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

    // A real menu primitive instead of a hand-rolled one: Escape and
    // outside-click close it, focus moves into it, arrow keys work, and it
    // scales in from the trigger (origin-aware) like the theme menu beside it.
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                    <GlobeIcon className="me-1" />
                    {(locale as string).toUpperCase()}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto">
                {options.map(({ locale: optionLocale, pathname: optionPathname }) => (
                    <DropdownMenuItem key={optionLocale} asChild>
                        <Link
                            href={optionPathname as any}
                            aria-current={optionLocale === locale ? "true" : undefined}
                            className="cursor-pointer aria-[current]:font-semibold"
                        >
                            {optionLocale.toUpperCase()}
                        </Link>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
