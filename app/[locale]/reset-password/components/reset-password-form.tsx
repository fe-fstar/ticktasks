"use client";

import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeClosedIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { useState, useActionState } from "react";
import { Link } from "@/i18n/navigation";
import AnimatedFormBox from "@/components/animated-form-box";
import { resetPassword } from "@/app/actions/auth";
import MotionLoader from "@/components/motion-loader";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ResetPasswordForm() {
    const t = useTranslations("ResetPasswordPage");
    const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const searchParams = useSearchParams();

    const email = searchParams.get("email");
    const token = searchParams.get("token");

    // Show error if email or token is missing
    if (!email || !token) {
        return (
            <div className="w-between-95-percent-and-720 space-y-8">
                <div className="space-y-4">
                    <h1 className="text-3xl lg:text-5xl font-bold">{t("invalidLink.title")}</h1>
                    <p className="text-lg text-destructive">
                        {t("invalidLink.description")}
                    </p>
                </div>
                <div className="text-center">
                    <Button variant="default" size="lg" asChild>
                        <Link href="/forgot-password">{t("invalidLink.button")}</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const [state, action, pending] = useActionState(resetPassword.bind(null, email, token), undefined);

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
                    <div className={`p-3 rounded-md text-sm ${
                        state.message.includes("successfully") 
                            ? "bg-green-500/10 text-green-700 dark:text-green-400" 
                            : "bg-destructive/10 text-destructive"
                    }`}>
                        {state.message}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="current_password">{t("form.currentPassword")}</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="current_password"
                            name="current_password"
                            type={currentPasswordVisible ? "text" : "password"}
                            placeholder={t("form.currentPasswordPlaceholder")}
                            required
                            aria-invalid={!!state?.errors?.currentPassword}
                        />
                        <InputGroupAddon align="inline-end">
                            <Button
                                size="icon"
                                onClick={() => setCurrentPasswordVisible(v => !v)}
                                type="button"
                                variant="ghost"
                            >
                                {currentPasswordVisible ? <EyeClosedIcon weight="bold" /> : <EyeIcon weight="bold" />}
                            </Button>
                        </InputGroupAddon>
                    </InputGroup>
                    {state?.errors?.currentPassword && (
                        <p className="text-xs text-destructive">{state.errors.currentPassword[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">{t("form.newPassword")}</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="password"
                            name="password"
                            type={passwordVisible ? "text" : "password"}
                            placeholder={t("form.newPasswordPlaceholder")}
                            required
                            minLength={8}
                            pattern="^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$"
                            title="Password must be at least 8 characters and contain at least one letter and one number"
                            aria-invalid={!!state?.errors?.password}
                        />
                        <InputGroupAddon align="inline-end">
                            <Button
                                size="icon"
                                onClick={() => setPasswordVisible(v => !v)}
                                type="button"
                                variant="ghost"
                            >
                                {passwordVisible ? <EyeClosedIcon weight="bold" /> : <EyeIcon weight="bold" />}
                            </Button>
                        </InputGroupAddon>
                    </InputGroup>
                    {state?.errors?.password && (
                        <p className="text-xs text-destructive">{state.errors.password[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm_password">{t("form.confirmPassword")}</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="confirm_password"
                            name="confirm_password"
                            type={confirmPasswordVisible ? "text" : "password"}
                            placeholder={t("form.confirmPasswordPlaceholder")}
                            required
                            aria-invalid={!!state?.errors?.confirmPassword}
                        />
                        <InputGroupAddon align="inline-end">
                            <Button
                                size="icon"
                                onClick={() => setConfirmPasswordVisible(v => !v)}
                                type="button"
                                variant="ghost"
                            >
                                {confirmPasswordVisible ? <EyeClosedIcon weight="bold" /> : <EyeIcon weight="bold" />}
                            </Button>
                        </InputGroupAddon>
                    </InputGroup>
                    {state?.errors?.confirmPassword && (
                        <p className="text-xs text-destructive">{state.errors.confirmPassword[0]}</p>
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
