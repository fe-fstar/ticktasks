import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/dal";
import AuthorizationRequiredCard from "@/components/authorization-required-card";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import PlansTable from "./components/plans-table";
import { getUserPlansWithBookmarkStatus } from "@/app/actions/plans";
import AnimatedFormBox from "@/components/animated-form-box";
import ReducableViewTransition from "@/components/reducable-view-transition";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getAlternateLanguages } from "@/lib/utils";

type SearchParams = Promise<{
  page?: string;
  search?: string;
}>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("MyPlansPage");
  const { locale } = await params;
  const alternates = getAlternateLanguages(locale, { pathname: "/plans/me" });

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

export default async function MyPlansPage(props: { searchParams: SearchParams }) {
  const t = await getTranslations("MyPlansPage");
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

  const searchParams = await props.searchParams;
  const currentPage = Number(searchParams.page) || 1;
  const searchTerm = searchParams.search || "";
  const pageSize = 10;

  const plansData = await getUserPlansWithBookmarkStatus(currentPage, pageSize, searchTerm);

  return (
    <main className="min-h-100vh-minus-header flex flex-col justify-center items-center gap-8 py-10">
      <div className="text-center space-y-4 max-w-4xl mx-auto text-pretty">
        <ReducableViewTransition name="my-plans-text">
          <h1 className="text-xl lg:text-3xl">
            {t("title")}
          </h1>
        </ReducableViewTransition>
        <div className="text-base lg:text-lg text-muted-foreground space-y-3 pt-2">
          <p>{t("description.intro")}</p>
          <p className="text-sm lg:text-base">{t("description.features")}</p>
        </div>

        {plansData.total > 0 && (
          <p className="text-sm lg:text-base font-medium text-muted-foreground pt-2">
            {t("description.stats", { total: plansData.total })}
          </p>
        )}

        <div className="pt-4">
          <Button size="lg" asChild>
            <Link href="/create-plan">
              <PlusIcon className="mr-2 h-4 w-4" weight="bold" />
              {t("createPlanButton")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="w-between-95-percent-and-1440 mx-auto">
        <AnimatedFormBox name="form-container" className="grid place-items-center w-full">
        <PlansTable
          initialPlans={plansData.plans}
          total={plansData.total}
          currentPage={plansData.page}
          totalPages={plansData.totalPages}
          searchTerm={searchTerm}
        />
        </AnimatedFormBox>
      </div>
    </main>
  );
}
