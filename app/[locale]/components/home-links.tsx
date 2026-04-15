import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/dal";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { GlobeIcon, SignInIcon, TableIcon, UserPlusIcon } from "@phosphor-icons/react/dist/ssr";

export default async function HomeLinks() {
    const t = await getTranslations("HomePage.links");
    const user = await getUser();

    return (<div className="flex gap-4 flex-wrap justify-center items-center">
        {user ? <Button size="lg" asChild>
            <Link href="/plans/me">
                <TableIcon />
                {t("myPlans")}
            </Link>
        </Button> : <>
            <Button size="lg" asChild>
                <Link href="/login">
                    <SignInIcon />
                    {t("login")}
                </Link>
            </Button>
            <Button size="lg" asChild>
                <Link href="/register">
                    <UserPlusIcon />
                    {t("register")}
                </Link>
            </Button>
        </>}
        <Button size="lg" asChild>
            <Link href="/plans">
                <GlobeIcon />
                {t("publicPlans")}
            </Link>
        </Button>
    </div>);
}