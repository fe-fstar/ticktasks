"use client";

import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { useActionState } from "react";
import { Link } from "@/i18n/navigation";
import AnimatedFormBox from "@/components/animated-form-box";
import { requestPasswordReset } from "@/app/actions/auth";
import MotionLoader from "@/components/motion-loader";
import { useTranslations } from "next-intl";

export default function ForgotPasswordForm() {
    const t = useTranslations("ForgotPasswordPage");
    const [state, action, pending] = useActionState(requestPasswordReset, undefined);

    return (<div className="w-between-95-percent-and-720 space-y-8">
        <div className="space-y-4">
            <h1 className="text-3xl lg:text-5xl font-bold">{t("title")}</h1>
            <p className="text-lg">
                {t("description")}
            </p>
        </div>
        <AnimatedFormBox name="form-container">
            <form action={action} className="space-y-6">
                {state?.message && (
                    <div className={`p-3 rounded-md text-sm ${state.message.includes("sent")
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                        {state.message}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="username_xor_email">{t("form.usernameXorEmail")}</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="username_xor_email"
                            name="username_xor_email"
                            type="text"
                            placeholder={t("form.usernameXorEmailPlaceholder")}
                            required
                            aria-invalid={!!state?.errors?.usernameXorEmail}
                            defaultValue={state?.data?.usernameXorEmail}
                        />
                    </InputGroup>
                    {state?.errors?.usernameXorEmail && (
                        <p className="text-xs text-destructive">{state.errors.usernameXorEmail[0]}</p>
                    )}
                </div>
                <div className="text-center space-y-3">
                    <Button type="submit" className="w-full" size="lg" disabled={pending}>
                        <MotionLoader pending={pending} />
                        {t("form.submitButton")}
                    </Button>
                    <Button variant="link" size="sm" className="mx-auto text-card-foreground" asChild>
                        <Link href="/login">{t("form.rememberPassword")}
                            <ArrowUpRightIcon />
                        </Link>
                    </Button>
                </div>
            </form>
        </AnimatedFormBox>
    </div>);
}