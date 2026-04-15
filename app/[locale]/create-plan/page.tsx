import { getUser } from "@/lib/dal";
import AuthorizationRequiredCard from "@/components/authorization-required-card";
import CreatePlanForm from "./components/create-plan-form";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getAlternateLanguages } from "@/lib/utils";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const t = await getTranslations("CreatePlanPage");
    const { locale } = await params;
    const alternates = getAlternateLanguages(locale, { pathname: "/create-plan" });

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

export default async function CreatePlanPage() {
    const t = await getTranslations("CreatePlanPage");
    const user = await getUser();

    if (!user) {
        return (
            <main className="min-h-100vh-minus-header grid place-items-center gap-8">
                <AuthorizationRequiredCard
                    title={t("auth.title")}
                    description={t("auth.description")}
                />
            </main>
        );
    }

    return (<main className="min-h-100vh-minus-header grid place-items-center gap-8 py-8">
        <div className="w-between-95-percent-and-720 space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl lg:text-5xl font-bold">{t("title")}</h1>
                <p className="text-lg">
                    {t("description")}
                </p>
            </div>
            <CreatePlanForm />
        </div>
    </main>);
}