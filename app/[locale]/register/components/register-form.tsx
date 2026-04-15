"use client";

import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeClosedIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { useState, useActionState } from "react";
import { Link } from "@/i18n/navigation";
import AnimatedFormBox from "@/components/animated-form-box";
import { register } from "@/app/actions/auth";
import MotionLoader from "@/components/motion-loader";
import { useTranslations } from "next-intl";

export default function RegisterForm() {
    const t = useTranslations("RegisterPage");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [state, action, pending] = useActionState(register, undefined);

    return (<div className="w-between-95-percent-and-720 space-y-8">
        <div className="space-y-4">
            {/* <ReducableViewTransition name="register-text"> */}
            <h1 className="text-3xl lg:text-5xl font-bold">{t("title")}</h1>
            {/* </ReducableViewTransition> */}
            <p className="text-lg">
                {t("description")}
            </p>
        </div>
        <AnimatedFormBox name="form-container">
            <form action={action} className="space-y-6">
                {state?.message && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {state.message}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="username">{t("form.username")}</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="username"
                            name="username"
                            type="text"
                            placeholder={t("form.usernamePlaceholder")}
                            required
                            minLength={2}
                            maxLength={30}
                            pattern="^[a-zA-Z0-9_-]+$"
                            title={t("form.usernameTitle")}
                            aria-invalid={!!state?.errors?.username}
                            defaultValue={state?.data?.username}
                        />
                    </InputGroup>
                    {state?.errors?.username && (
                        <p className="text-xs text-destructive">{state.errors.username[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">{t("form.email")}</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="email"
                            name="email"
                            type="email"
                            placeholder={t("form.emailPlaceholder")}
                            required
                            aria-invalid={!!state?.errors?.email}
                            defaultValue={state?.data?.email}
                        />
                    </InputGroup>
                    {state?.errors?.email && (
                        <p className="text-xs text-destructive">{state.errors.email[0]}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">{t("form.password")}</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="password"
                            name="password"
                            type={passwordVisible ? "text" : "password"}
                            placeholder={t("form.passwordPlaceholder")}
                            required
                            minLength={8}
                            pattern="^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$"
                            title={t("form.passwordTitle")}
                            aria-invalid={!!state?.errors?.password}
                            defaultValue={state?.data?.password}
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
                            type={"password"}
                            placeholder={t("form.confirmPasswordPlaceholder")}
                            required
                            aria-invalid={!!state?.errors?.confirmPassword}
                        />
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
                        <Link href="/login">{t("form.haveAccount")}
                            <ArrowUpRightIcon />
                        </Link>
                    </Button>
                </div>
            </form>
        </AnimatedFormBox>
    </div>);
}
