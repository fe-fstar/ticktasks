import { getUser } from "@/lib/dal";
import HeaderLink from "./header-link";
import LogoutButton from "./logout-button";
import { ThemeToggler } from "./ui/theme-toggler";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { ListIcon } from "@phosphor-icons/react/dist/ssr";
import { getTranslations } from "next-intl/server";
import LocaleSwitcher from "./locale-switcher";
import SheetLink from "./sheet-link";
import MobileLogoutButton from "./mobile-logout-button";

export default async function Header() {
    const t = await getTranslations("Header");
    const user = await getUser();

    return (<header className="@container w-between-95-percent-and-1440 mx-auto mt-header-top-margin mb-header-bottom-margin relative z-50 grid grid-cols-5 items-center border border-border">
        {/* Desktop Navigation */}
        <nav className="contents @max-4xl:hidden">
            <div className="flex items-center gap-4 justify-start">
                <HeaderLink href="/">
                    {t("home")}
                </HeaderLink>
                <HeaderLink href="/plans">
                    {t("plans")}
                </HeaderLink>
            </div>

            <div className="flex items-center gap-4 justify-center col-span-3">
                {user ? <>
                    <HeaderLink href="/plans/me">
                        {t("myPlans")}
                    </HeaderLink>
                    <HeaderLink href="/bookmarks">
                        {t("bookmarks")}
                    </HeaderLink>
                    <HeaderLink href="/create-plan">
                        {t("createPlan")}
                    </HeaderLink>
                    <HeaderLink href="/account">
                        {t("account")}
                    </HeaderLink>
                </> : <>
                    <HeaderLink href="/login">
                        {t("login")}
                    </HeaderLink>
                    <HeaderLink href="/register">
                        {t("register")}
                    </HeaderLink>
                </>}
            </div>

            <div className="flex items-center gap-4 justify-end">
                {user && <LogoutButton />}
                <LocaleSwitcher />
                <ThemeToggler />
            </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="hidden @max-4xl:flex col-span-5 items-center justify-end h-header">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <ListIcon className="size-5" weight="bold" />
                        <span className="sr-only">{t("openMenu")}</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right">
                    <SheetHeader>
                        <SheetTitle>{t("menu")}</SheetTitle>
                    </SheetHeader>
                    <nav className="flex flex-col gap-4 mt-8">
                        <SheetLink
                            href="/"
                            className="text-sm px-4 py-2 rounded-md hover:bg-accent"
                        >
                            {t("home")}
                        </SheetLink>
                        <SheetLink
                            href="/plans"
                            className="text-sm px-4 py-2 rounded-md hover:bg-accent"
                        >
                            {t("plans")}
                        </SheetLink>
                        {user ? (
                            <>
                                <SheetLink
                                    href="/plans/me"
                                    className="text-sm px-4 py-2 rounded-md hover:bg-accent"
                                >
                                    {t("myPlans")}
                                </SheetLink>
                                <SheetLink
                                    href="/bookmarks"
                                    className="text-sm px-4 py-2 rounded-md hover:bg-accent"
                                >
                                    {t("bookmarks")}
                                </SheetLink>
                                <SheetLink
                                    href="/create-plan"
                                    className="text-sm px-4 py-2 rounded-md hover:bg-accent"
                                >
                                    {t("createPlan")}
                                </SheetLink>
                                <SheetLink
                                    href="/account"
                                    className="text-sm px-4 py-2 rounded-md hover:bg-accent"
                                >
                                    {t("account")}
                                </SheetLink>
                                <div className="border-t pt-4 mt-4">
                                    <MobileLogoutButton className="ps-4" />
                                </div>
                            </>
                        ) : (
                            <>
                                <SheetLink
                                    href="/login"
                                    className="text-sm px-4 py-2 rounded-md hover:bg-accent"
                                >
                                    {t("login")}
                                </SheetLink>
                                <SheetLink
                                    href="/register"
                                    className="text-sm px-4 py-2 rounded-md hover:bg-accent"
                                >
                                    {t("register")}
                                </SheetLink>
                            </>
                        )}

                        <div className="border-t pt-4 px-4">
                            <div className="flex items-center justify-between">
                                <span>{t("theme")}</span>
                                <ThemeToggler />
                            </div>
                        </div>
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
    </header>);
}