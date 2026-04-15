import AuthorizationRequiredCard from "@/components/authorization-required-card";
import { getUser } from "@/lib/dal";
import AccountCredentials from "./components/account-credentials";
import ReducableViewTransition from "@/components/reducable-view-transition";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getAlternateLanguages } from "@/lib/utils";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const t = await getTranslations("AccountPage");
    const { locale } = await params;
    const alternates = getAlternateLanguages(locale, { pathname: "/account" });

    return {
        title: t("metadata.title"),
        description: t("metadata.description"),
        keywords: t("metadata.keywords"),
        alternates,
        openGraph: {
            title: t("metadata.title"),
            description: t("metadata.description"),
            type: "website",
        },
    };
}

export default async function AccountPage() {
    const t = await getTranslations("AccountPage");
    const user = await getUser();

    if (!user) {
        return (
            <main className="w-full min-h-100vh-minus-header grid place-items-center">
                <AuthorizationRequiredCard
                    title={t("auth.title")}
                    description={t("auth.description")}
                />
            </main>
        );
    }

    return (
        <main className="min-h-100vh-minus-header flex flex-col justify-center items-center gap-8">
            <div className="text-center space-y-4 max-w-4xl mx-auto text-pretty">
                <ReducableViewTransition name="account-text">
                    <h1 className="text-xl lg:text-3xl">
                        {t("title")}
                    </h1>
                </ReducableViewTransition>
                <div className="text-base lg:text-lg text-muted-foreground space-y-3 pt-2">
                    <p>{t("description.intro")}</p>
                    <p className="text-sm lg:text-base">{t("description.features")}</p>
                </div>
            </div>

            <div className="w-between-95-percent-and-720 mx-auto">
                <AccountCredentials user={user} />
            </div>
        </main>
    );
}
