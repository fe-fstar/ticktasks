"use client";

import { useState, useActionState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeClosedIcon } from "@phosphor-icons/react";
import MotionLoader from "@/components/motion-loader";
import { updateProfile, updatePassword } from "@/app/actions/auth";
import type { User } from "@/db/schema";
import AnimatedFormBox from "@/components/animated-form-box";
import { useTranslations } from "next-intl";

interface AccountCredentialsProps {
    user: Pick<User, "id" | "username" | "email">;
}

export default function AccountCredentials({ user }: AccountCredentialsProps) {
    const t = useTranslations("AccountPage");
    return (
        <div className="w-between-95-percent-and-720 mx-auto space-y-8">
            <AnimatedFormBox name="form-container">
                <Tabs defaultValue="profile" orientation="horizontal">
                    <TabsList>
                        <TabsTrigger value="profile">{t("tabs.profile")}</TabsTrigger>
                        <TabsTrigger value="password">{t("tabs.password")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="profile">
                        <ProfileForm user={user} />
                    </TabsContent>
                    <TabsContent value="password">
                        <PasswordForm />
                    </TabsContent>
                </Tabs>
            </AnimatedFormBox>
        </div>
    );
}

function ProfileForm({ user }: { user: Pick<User, "username" | "email"> }) {
    const t = useTranslations("AccountPage.profileForm");
    const [state, action, pending] = useActionState(updateProfile, undefined);

    return (
        <form action={action} className="space-y-6 pt-4">
            {state?.message && (
                <div className={`p-3 rounded-md text-sm ${state.message.includes("successfully")
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                    }`}>
                    {state.message}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="username">{t("username")}</Label>
                <InputGroup>
                    <InputGroupInput
                        id="username"
                        name="username"
                        type="text"
                        placeholder={t("usernamePlaceholder")}
                        required
                        aria-invalid={!!state?.errors?.username}
                        defaultValue={state?.data?.username ?? user.username}
                    />
                </InputGroup>
                {state?.errors?.username && (
                    <p className="text-xs text-destructive">{state.errors.username[0]}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <InputGroup>
                    <InputGroupInput
                        id="email"
                        name="email"
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        required
                        aria-invalid={!!state?.errors?.email}
                        defaultValue={state?.data?.email ?? user.email}
                    />
                </InputGroup>
                {state?.errors?.email && (
                    <p className="text-xs text-destructive">{state.errors.email[0]}</p>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={pending}>
                <MotionLoader pending={pending} />
                {t("submitButton")}
            </Button>
        </form>
    );
}

function PasswordForm() {
    const t = useTranslations("AccountPage.passwordForm");
    const [state, action, pending] = useActionState(updatePassword, undefined);
    const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

    return (
        <form action={action} className="space-y-6 pt-4">
            {state?.message && (
                <div className={`p-3 rounded-md text-sm ${state.message.includes("successfully")
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-destructive/10 text-destructive"
                    }`}>
                    {state.message}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="current_password">{t("currentPassword")}</Label>
                <InputGroup>
                    <InputGroupInput
                        id="current_password"
                        name="current_password"
                        type={currentPasswordVisible ? "text" : "password"}
                        placeholder={t("currentPasswordPlaceholder")}
                        defaultValue={state?.data?.currentPassword}
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
                <Label htmlFor="new_password">{t("newPassword")}</Label>
                <InputGroup>
                    <InputGroupInput
                        id="new_password"
                        name="new_password"
                        type={newPasswordVisible ? "text" : "password"}
                        placeholder={t("newPasswordPlaceholder")}
                        defaultValue={state?.data?.newPassword}
                        required
                        minLength={8}
                        aria-invalid={!!state?.errors?.newPassword}
                    />
                    <InputGroupAddon align="inline-end">
                        <Button
                            size="icon"
                            onClick={() => setNewPasswordVisible(v => !v)}
                            type="button"
                            variant="ghost"
                        >
                            {newPasswordVisible ? <EyeClosedIcon weight="bold" /> : <EyeIcon weight="bold" />}
                        </Button>
                    </InputGroupAddon>
                </InputGroup>
                {state?.errors?.newPassword && (
                    <p className="text-xs text-destructive">{state.errors.newPassword[0]}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirm_password">{t("confirmPassword")}</Label>
                <InputGroup>
                    <InputGroupInput
                        id="confirm_password"
                        name="confirm_password"
                        type={confirmPasswordVisible ? "text" : "password"}
                        placeholder={t("confirmPasswordPlaceholder")}
                        required
                        minLength={8}
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

            <Button type="submit" className="w-full" disabled={pending}>
                <MotionLoader pending={pending} />
                {t("submitButton")}
            </Button>
        </form>
    );
}
