import AnimatedFormBox from "@/components/animated-form-box";
import { Link } from "@/i18n/navigation";
import { ArrowUpRightIcon, EmptyIcon } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";

export default function NotFoundPage() {
    const t = useTranslations("NotFoundPage");
    
    return (<main className="min-h-100vh-minus-header grid place-items-center">
        <AnimatedFormBox name="form-container" className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4 mb-6">
                <EmptyIcon className="size-18 inline" />
                <h1 className="text-3xl lg:text-4xl font-bold">{t("title")}</h1>
            </div>
            <p className="text-lg lg:text-xl mb-8">{t("description")}</p>
            <Link href={"/"} className="content-center underline underline-offset-4">
                <ArrowUpRightIcon className="size-4 me-2 inline" />
                {t("backToHome")}
            </Link>
        </AnimatedFormBox>
    </main>);
}