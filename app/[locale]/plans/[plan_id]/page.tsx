import { getPathname, Link, redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getPlanById } from "@/app/actions/plans";
import { getUser } from "@/lib/dal";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { PlanExecutor } from "./components/plan-executor";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { getAlternateLanguages } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ plan_id: string; locale: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("PlanDetailPage");
  const { plan_id, locale } = await params;
  const plan = await getPlanById(plan_id);

  if (!plan) {
    return {
      title: "Plan Not Found - Ticktasks",
    };
  }

  const alternates = getAlternateLanguages(locale, {
    pathname: "/plans/[plan_id]",
    params: { plan_id },
  });

  return {
    title: t("metadata.title", { title: plan.title }),
    description: t("metadata.description", { title: plan.title }),
    keywords: t("metadata.keywords", { title: plan.title }),
    alternates,
    openGraph: {
      title: t("metadata.title", { title: plan.title }),
      description: t("metadata.description", { title: plan.title }),
      type: "website",
    },
  };
}

export default async function PlanPage({
  params,
}: {
  params: Promise<{
    plan_id: string,
    locale: string
  }>;
}) {
  const t = await getTranslations("PlanDetailPage");
  const { locale, plan_id } = await params;
  const [plan, user] = await Promise.all([
    getPlanById(plan_id),
    getUser(),
  ]);

  if (!plan) {
    redirect({ href: "/plans", locale });
  }

  const foundPlan = plan!;

  if (!foundPlan.isPublic) {
    if (!user) {
      redirect({ href: "/plans", locale });
    }
    if (user!.id !== foundPlan.userId) {
      redirect({ href: "/plans/me", locale });
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/plans">
            <ArrowLeftIcon className="me-2 size-4" weight="bold" />
            {t("backToPlans")}
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{foundPlan.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("created")} {new Date(foundPlan.createdAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {user && user.id === foundPlan.userId && (
            <Button asChild>
              <Link href={{
                pathname: '/plans/[plan_id]/edit',
                params: { plan_id: foundPlan.id }
              }}>{t("editPlan")}</Link>
            </Button>
          )}
        </div>

        <PlanExecutor plan={foundPlan} isAuthenticated={!!user} />
      </div>
    </div>
  );
}
