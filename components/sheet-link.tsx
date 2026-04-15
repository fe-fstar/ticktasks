"use client";

import { Link } from "@/i18n/navigation";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import React from "react";

type SheetLinkProps = React.ComponentProps<typeof Link>;

export default function SheetLink(props: SheetLinkProps) {
    return (
        <SheetPrimitive.Close asChild>
            <Link {...props} />
        </SheetPrimitive.Close>
    );
}
