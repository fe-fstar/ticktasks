import { getUser } from "@/lib/dal";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./components/login-form";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getAlternateLanguages } from "@/lib/utils";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const t = await getTranslations("LoginPage");
    const { locale } = await params;
    const alternates = getAlternateLanguages(locale, { pathname: "/login" });

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

export default async function () {
    const user = await getUser();

    if (user) {
        const redirectUrl = (await cookies()).get("redirect")?.value;
        redirect(redirectUrl || "/");
    }

    return (<main className="min-h-100vh-minus-header grid place-items-center gap-8">
        <LoginForm />
    </main>);
}