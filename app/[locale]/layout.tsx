import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { MotionConfig } from "motion/react";
import Header from "@/components/header";
import { ThemeProvider } from "next-themes";
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import NavigationLoader from "@/components/navigation-loader";

const optika = localFont({
  src: [
    {
      path: '../fonts/Optika-Thin.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '../fonts/Optika-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/Optika-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Optika-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/Optika-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Optika-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/Optika-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/Optika-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-optika',
});

export const metadata: Metadata = {
  title: "Ticktasks",
  description: "Ticktasks - A simple and efficient task management app.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} className={optika.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <MotionConfig reducedMotion="user">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NavigationLoader />
              <Header />
              {children}
            </ThemeProvider>
          </MotionConfig>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
