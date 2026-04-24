"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import { Button } from "./ui/button";
import { logout } from "@/app/actions/auth";
import { useTransition, useRef } from "react";
import MotionLoader from "./motion-loader";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { SheetClose } from "./ui/sheet";

export default function MobileLogoutButton(props: React.ComponentProps<typeof Button>) {
    const t = useTranslations("Header");
    const [pending, startTransition] = useTransition();
    const closeRef = useRef<HTMLButtonElement>(null);
    
    const handleLogout = () => {
        // Close the sheet first
        closeRef.current?.click();
        
        // Then logout
        startTransition(() => {
            logout();
        });
    }

    return (
        <>
            <SheetClose ref={closeRef} className="hidden" />
            <Button
                variant="link"
                onClick={handleLogout}
                {...props}
                className={cn("text-foreground", props.className)}
            >
                {pending ? <MotionLoader pending={pending} /> : <SignOutIcon weight="bold" />}
                {t("logout")}
            </Button>
        </>
    );
}
