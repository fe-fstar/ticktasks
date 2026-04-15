import AnimatedFormBox from "@/components/animated-form-box";
import { getUser } from "@/lib/dal";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./components/reset-password-form";
import { Metadata } from "next";

export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
    }
}

export default async function ({
    searchParams
}: {
    searchParams: Promise<{ token?: string; email?: string }>
}) {
    const user = await getUser();

    if (user) {
        const redirectUrl = (await cookies()).get("redirect")?.value;
        redirect(redirectUrl || "/");
    }

    const { token, email } = await searchParams;

    if (!token || !email) {
        return (<main className="min-h-100vh-minus-header grid place-items-center gap-8">
            <AnimatedFormBox
                className="w-between-95-percent-and-720 text-pretty space-y-4"
                name="form-container"
            >
                <h1 className="text-3xl lg:text-5xl font-semibold">Invalid Reset Link</h1>
                <p className="text-lg lg:text-xl">The reset link you used is invalid or has expired. Please request a new password reset link.</p>
            </AnimatedFormBox>
        </main>);
    }

    return(<main className="min-h-100vh-minus-header grid place-items-center gap-8">
        <ResetPasswordForm />
    </main>)
}