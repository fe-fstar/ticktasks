import { getUser } from "@/lib/dal";
import { redirect } from "@/i18n/navigation";
import AuthorizationRequiredCard from "@/components/authorization-required-card";
import { getPlanById } from "@/app/actions/plans";
import EditPlanForm from "./components/edit-plan-form";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getAlternateLanguages } from "@/lib/utils";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; plan_id: string }>;
}): Promise<Metadata> {
    const t = await getTranslations("EditPlanPage");
    const { locale, plan_id } = await params;
    const alternates = getAlternateLanguages(locale, {
        pathname: "/plans/[plan_id]/edit",
        params: { plan_id },
    });

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

export default async function EditPlanPage({
    params,
}: {
    params: Promise<{ locale: string; plan_id: string }>;
}) {    const { locale, plan_id } = await params;    const t = await getTranslations("EditPlanPage");
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

    const plan = await getPlanById(plan_id);

    if (!plan) {
        redirect({ href: "/plans/me", locale });
    }

    const foundPlan = plan!;

    if (foundPlan.userId !== user.id) {
        redirect({ href: "/plans/me", locale });
    }

    return (
        <main className="min-h-100vh-minus-header grid place-items-center gap-8 py-8">
            <div className="w-between-95-percent-and-720 space-y-8">
                <div className="space-y-4">
                    <h1 className="text-3xl lg:text-5xl font-bold">{t("title")}</h1>
                    <p className="text-lg">
                        {t("description")}
                    </p>
                </div>
                <EditPlanForm plan={foundPlan} />
            </div>
        </main>
    );
}
