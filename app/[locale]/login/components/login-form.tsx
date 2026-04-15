"use client";

import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeClosedIcon, ArrowUpRightIcon } from "@phosphor-icons/react";
import { useState, useActionState } from "react";
import { Link } from "@/i18n/navigation";
import AnimatedFormBox from "@/components/animated-form-box";
import { login } from "@/app/actions/auth";
import MotionLoader from "@/components/motion-loader";
import { useTranslations } from "next-intl";

export default function LoginForm() {
    const t = useTranslations("LoginPage");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [state, action, pending] = useActionState(login, undefined);

    return (<div className="w-between-95-percent-and-720 space-y-8">
        <div className="space-y-4">
            {/* <ReducableViewTransition name="login-text"> */}
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

                <div className="space-y-2">
                    <Label htmlFor="password">{t("form.password")}</Label>
                    <InputGroup>
                        <InputGroupInput
                            id="password"
                            name="password"
                            type={passwordVisible ? "text" : "password"}
                            placeholder={t("form.passwordPlaceholder")}
                            required
                            minLength={1}
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

                <div className="text-center space-y-3">
                    <Button type="submit" className="w-full" size="lg" disabled={pending}>
                        <MotionLoader pending={pending} />
                        {t("form.submitButton")}
                    </Button>
                    <div className="text-center space-x-4">
                        <Button variant="link" size="sm" className="mx-auto text-card-foreground" asChild>
                            <Link href="/register">{t("form.noAccount")}
                                <ArrowUpRightIcon />
                            </Link>
                        </Button>
                        <Button variant="link" size="sm" className="mx-auto text-card-foreground" asChild>
                            <Link href="/forgot-password">{t("form.forgotPassword")}
                                <ArrowUpRightIcon />
                            </Link>
                        </Button>
                    </div>
                </div>
            </form>
        </AnimatedFormBox>
    </div>);
}