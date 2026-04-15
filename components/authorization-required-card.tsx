"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockKeyIcon } from "@phosphor-icons/react";
import { getPathname, Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import AnimatedFormBox from "./animated-form-box";
import { useLocale, useTranslations } from "next-intl";

interface AuthorizationRequiredCardProps {
    title: string;
    description: string;
}

export default function AuthorizationRequiredCard({ title, description }: AuthorizationRequiredCardProps) {
    const t = useTranslations("AuthorizationCard");
    const pathname = usePathname();
    const locale = useLocale();

    const handleRedirectCookie = async (path: string) => {
        // Set the redirect cookie before navigating
        await fetch("/api/set-redirect", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ redirect: pathname }),
        });
    };

    return (
        <AnimatedFormBox name="form-container" className="w-between-95-percent-and-720 p-0 bg-transparent border-0">
            <Card className="border-2 border-foreground">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                        <LockKeyIcon size={32} weight="bold" />
                    </div>
                    <CardTitle className="text-2xl">{title}</CardTitle>
                    <CardDescription className="text-base">{description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button className="w-full" size="lg" asChild>
                        <Link
                            href="/login"
                            onClick={() => handleRedirectCookie(getPathname({ href: "/login", locale }))}
                            className="block"
                        >
                            {t("loginButton")}
                        </Link>
                    </Button>
                    <Link
                        href="/register"
                        onClick={() => handleRedirectCookie(getPathname({ href: "/register", locale }))}
                        className="block"
                    >
                        <Button className="w-full" size="lg" variant="outline">
                            {t("registerButton")}
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </AnimatedFormBox>
    );
}
