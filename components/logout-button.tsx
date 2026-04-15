"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { logout } from "@/app/actions/auth";
import { useTransition } from "react";
import MotionLoader from "./motion-loader";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export default function LogoutButton(props: React.ComponentProps<typeof Button>) {
    const t = useTranslations("Header");
    const [pending, startTransition] = useTransition();
    const handleLogout = () => {
        startTransition(() => {
            logout();
        });
    }

    return (<Button
        variant="link"
        onClick={() => handleLogout()}
        {...props}
        className={cn("text-foreground", props.className)}
    >
        {pending ? <MotionLoader pending={pending} /> : <SignOutIcon weight="bold" />}
        {t("logout")}
    </Button>);
}