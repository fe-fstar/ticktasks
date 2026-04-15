import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import HomeLinks from "./components/home-links";
import { Accordion, AccordionContent, AccordionTrigger } from "@/components/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon, ClockIcon, ShareNetworkIcon, BookmarkSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { getAlternateLanguages } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const t = await getTranslations("HomePage");
  const { locale } = await params;
  const alternates = getAlternateLanguages(locale, { pathname: "/" });

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

export default function HomePage() {
    const t = useTranslations("HomePage");

    return (
        <main className="w-between-95-percent-and-1440 mx-auto py-12 space-y-16">
            {/* Hero Section */}
            <section className="text-center space-y-6 w-between-95-percent-and-1440 mx-auto">
                <h1 className="text-4xl lg:text-6xl font-bold text-balance">
                    {t("hero.title")}
                </h1>
                <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
                    {t("hero.subtitle")}
                </p>
                <HomeLinks />
            </section>

            {/* Features Section */}
            <section className="space-y-8">
                <h2 className="text-3xl lg:text-4xl font-bold text-center text-balance">
                    {t("features.title")}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <ClockIcon className="size-8 text-primary" weight="duotone" />
                                <h3 className="text-xl font-semibold text-balance">{t("features.timedSteps.title")}</h3>
                            </div>
                            <p className="text-muted-foreground text-pretty">
                                {t("features.timedSteps.description")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <CheckCircleIcon className="size-8 text-primary" weight="duotone" />
                                <h3 className="text-xl font-semibold text-balance">{t("features.stepGroups.title")}</h3>
                            </div>
                            <p className="text-muted-foreground text-pretty">
                                {t("features.stepGroups.description")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <ShareNetworkIcon className="size-8 text-primary" weight="duotone" />
                                <h3 className="text-xl font-semibold text-balance">{t("features.publicPlans.title")}</h3>
                            </div>
                            <p className="text-muted-foreground text-pretty">
                                {t("features.publicPlans.description")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <BookmarkSimpleIcon className="size-8 text-primary" weight="duotone" />
                                <h3 className="text-xl font-semibold text-balance">{t("features.bookmarks.title")}</h3>
                            </div>
                            <p className="text-muted-foreground text-pretty">
                                {t("features.bookmarks.description")}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="space-y-8">
                <h2 className="text-3xl lg:text-4xl font-bold text-center text-balance">
                    {t("howItWorks.title")}
                </h2>
                <div className="space-y-4 max-w-3xl mx-auto">
                    <Accordion defaultOpen>
                        <AccordionTrigger className="text-left px-6 py-4 bg-accent rounded-lg">
                            <span className="text-lg font-semibold text-balance">
                                1. {t("howItWorks.step1.title")}
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="px-6 py-4 text-muted-foreground text-pretty">
                                {t("howItWorks.step1.description")}
                            </div>
                        </AccordionContent>
                    </Accordion>

                    <Accordion>
                        <AccordionTrigger className="text-left px-6 py-4 bg-accent rounded-lg">
                            <span className="text-lg font-semibold text-balance">
                                2. {t("howItWorks.step2.title")}
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="px-6 py-4 text-muted-foreground text-pretty">
                                {t("howItWorks.step2.description")}
                            </div>
                        </AccordionContent>
                    </Accordion>

                    <Accordion>
                        <AccordionTrigger className="text-left px-6 py-4 bg-accent rounded-lg">
                            <span className="text-lg font-semibold text-balance">
                                3. {t("howItWorks.step3.title")}
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="px-6 py-4 text-muted-foreground text-pretty">
                                {t("howItWorks.step3.description")}
                            </div>
                        </AccordionContent>
                    </Accordion>

                    <Accordion>
                        <AccordionTrigger className="text-left px-6 py-4 bg-accent rounded-lg">
                            <span className="text-lg font-semibold text-balance">
                                4. {t("howItWorks.step4.title")}
                            </span>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="px-6 py-4 text-muted-foreground text-pretty">
                                {t("howItWorks.step4.description")}
                            </div>
                        </AccordionContent>
                    </Accordion>
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="space-y-8 bg-accent/50 -mx-4 px-4 py-12 rounded-lg">
                <h2 className="text-3xl lg:text-4xl font-bold text-center text-balance">
                    {t("useCases.title")}
                </h2>
                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <div className="space-y-2 text-center">
                        <h3 className="text-lg font-semibold text-balance">{t("useCases.workout.title")}</h3>
                        <p className="text-sm text-muted-foreground text-pretty">
                            {t("useCases.workout.description")}
                        </p>
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-lg font-semibold text-balance">{t("useCases.cooking.title")}</h3>
                        <p className="text-sm text-muted-foreground text-pretty">
                            {t("useCases.cooking.description")}
                        </p>
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-lg font-semibold text-balance">{t("useCases.study.title")}</h3>
                        <p className="text-sm text-muted-foreground text-pretty">
                            {t("useCases.study.description")}
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="text-center space-y-6">
                <h2 className="text-2xl lg:text-3xl font-bold text-balance">
                    {t("cta.title")}
                </h2>
                <HomeLinks />
            </section>
        </main>
    );
}