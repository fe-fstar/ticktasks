import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getPathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Constructs a full URL by combining the base URL with a pathname
 */
export function constructUrl(pathname: string): string {
  const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  return `${baseUrl.replace(/\/$/, "")}${pathname.startsWith("/") ? pathname : `/${pathname}`}`
}

/**
 * Generates alternate language URLs for SEO metadata
 */
export function getAlternateLanguages(
  locale: string,
  href: Parameters<typeof getPathname>[0]["href"]
): { canonical: string; languages: Record<string, string> } {
  const canonical = constructUrl(
    getPathname({
      locale,
      href,
    })
  )

  const languages = routing.locales.reduce((acc, loc) => {
    acc[loc] = constructUrl(
      getPathname({
        locale: loc,
        href,
      })
    )
    return acc
  }, {} as Record<string, string>)

  return { canonical, languages }
}
