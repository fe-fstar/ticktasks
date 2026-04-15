import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'tr'],
    defaultLocale: 'en',
    localePrefix: "as-needed",
    localeCookie: false,
    pathnames: {
        "/": {
            en: "/",
            tr: "/"
        },
        "/plans": {
            en: "/plans",
            tr: "/planlar"
        },
        "/plans/me": {
            en: "/plans/me",
            tr: "/planlarim"
        },
        "/bookmarks": {
            en: "/bookmarks",
            tr: "/kaydedilenler"
        },
        "/create-plan": {
            en: "/create-plan",
            tr: "/plan-olustur"
        },
        "/account": {
            en: "/account",
            tr: "/hesap"
        },
        "/forgot-password": {
            en: "/forgot-password",
            tr: "/sifremi-unuttum"
        },
        "/reset-password": {
            en: "/reset-password",
            tr: "/sifre-sifirla"
        },
        "/login": {
            en: "/login",
            tr: "/giris"
        },
        "/register": {
            en: "/register",
            tr: "/kayit"
        },
        "/plans/[plan_id]": {
            en: "/plans/[plan_id]",
            tr: "/planlar/[plan_id]"
        },
        "/plans/[plan_id]/edit": {
            en: "/plans/[plan_id]/edit",
            tr: "/planlar/[plan_id]/duzenle"
        }
    }
});