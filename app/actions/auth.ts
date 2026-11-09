"use server";

import { getSignupFormSchema, getRegisterFormSchema, getLoginFormSchema, FormState, getForgotPasswordFormSchema, getResetPasswordFormSchema } from "@/lib/definitions";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Resend } from "resend";
// import { PasswordResetEmail } from "@/components/password-reset-email";
import crypto from "crypto";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect as nextIntlRedirect } from '@/i18n/navigation';

export async function signup(state: FormState, formData: FormData) {
  const [t, tv] = await Promise.all([
    getTranslations("Errors"),
    getTranslations("Errors.validation")
  ]);

  // 1. Validate form fields
  const validatedFields = getSignupFormSchema(tv).safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, email, password } = validatedFields.data;

  // 2. Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      message: t("auth.emailExists"),
    };
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create user
  const [newUser] = await db
    .insert(users)
    .values({
      username,
      email,
      password: hashedPassword,
      role: "user",
    })
    .returning({ id: users.id, role: users.role });

  if (!newUser) {
    return {
      message: t("auth.createAccountFailed"),
    };
  }

  // 5. Create session
  const sessionCreated = await createSession(newUser.id, newUser.role);

  if (!sessionCreated) {
    return {
      message: t("auth.createSessionFailed"),
    };
  }

  const cookieStore = await cookies();
  const redirectUrl = cookieStore.get("redirect")?.value;
  if (redirectUrl) {
    cookieStore.delete("redirect");
  }

  redirect(redirectUrl || "/");
}

export async function register(state: FormState, formData: FormData) {
  const [t, tv] = await Promise.all([
    getTranslations("Errors"),
    getTranslations("Errors.validation")
  ]);

  // 1. Validate form fields
  const validatedFields = getRegisterFormSchema(tv).safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirm_password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      data: {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      },
    };
  }

  const { username, email, password } = validatedFields.data;

  // 2. Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      message: t("auth.emailExists"),
      data: { username, email, password },
    };
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create user
  const [newUser] = await db
    .insert(users)
    .values({
      username,
      email,
      password: hashedPassword,
      role: "user",
    })
    .returning({ id: users.id, role: users.role });

  if (!newUser) {
    return {
      message: t("auth.createAccountFailed"),
      data: { username, email, password },
    };
  }

  // 5. Create session
  const sessionCreated = await createSession(newUser.id, newUser.role);

  if (!sessionCreated) {
    return {
      message: t("auth.createSessionFailedLogin"),
      data: { username, email, password },
    };
  }

  // 6. Get redirect URL from cookie and clear it
  const cookieStore = await cookies();
  const redirectUrl = cookieStore.get("redirect")?.value;
  if (redirectUrl) {
    cookieStore.delete("redirect");
  }

  // 7. Redirect
  redirect(redirectUrl || "/");
}

export async function login(state: FormState, formData: FormData) {
  const [t, tv] = await Promise.all([
    getTranslations("Errors"),
    getTranslations("Errors.validation")
  ]);

  // 1. Validate form fields
  const validatedFields = getLoginFormSchema(tv).safeParse({
    usernameXorEmail: formData.get("username_xor_email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      data: {
        usernameXorEmail: formData.get("username_xor_email") as string,
        password: formData.get("password") as string,
      },
    };
  }

  const { usernameXorEmail, password } = validatedFields.data;

  // 2. Query the database for the user by email or username
  const isEmail = usernameXorEmail.includes("@");
  const [user] = await db
    .select()
    .from(users)
    .where(isEmail ? eq(users.email, usernameXorEmail) : eq(users.username, usernameXorEmail))
    .limit(1);

  if (!user) {
    return {
      message: t("auth.invalidCredentials"),
      data: { usernameXorEmail, password },
    };
  }

  // 3. Compare passwords
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return {
      message: t("auth.invalidCredentials"),
      data: { usernameXorEmail, password },
    };
  }

  // 4. Create session
  const sessionCreated = await createSession(user.id, user.role);

  if (!sessionCreated) {
    return {
      message: t("auth.createSessionFailed"),
      data: { usernameXorEmail, password },
    };
  }

  // 5. Get redirect URL from cookie and clear it
  const cookieStore = await cookies();
  const redirectUrl = cookieStore.get("redirect")?.value;
  if (redirectUrl) {
    cookieStore.delete("redirect");
  }

  // 6. Redirect
  redirect(redirectUrl || "/");
}

export async function logout() {
  await deleteSession();
  const locale = await getLocale();
  nextIntlRedirect({ href: "/", locale });
}

export async function updateProfile(state: FormState, formData: FormData) {
  const [t, tv] = await Promise.all([
    getTranslations("Errors"),
    getTranslations("Errors.validation")
  ]);

  const { getUpdateProfileFormSchema } = await import("@/lib/definitions");
  const { getUser } = await import("@/lib/dal");

  // 1. Get current user
  const user = await getUser();

  if (!user) {
    return {
      message: t("auth.loginRequiredUpdateProfile"),
    };
  }

  // 2. Validate form fields
  const validatedFields = getUpdateProfileFormSchema(tv).safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      data: {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
      },
    };
  }

  const { username, email } = validatedFields.data;

  // 3. Check if username is taken by another user
  if (username !== user.username) {
    const [existingUserWithUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUserWithUsername && existingUserWithUsername.id !== user.id) {
      return {
        message: t("auth.usernameTaken"),
        data: { username, email },
      };
    }
  }

  // 4. Check if email is taken by another user
  if (email !== user.email) {
    const [existingUserWithEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUserWithEmail && existingUserWithEmail.id !== user.id) {
      return {
        message: t("auth.emailTaken"),
        data: { username, email },
      };
    }
  }

  // 5. Update user
  try {
    await db
      .update(users)
      .set({
        username,
        email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return {
      message: t("auth.profileUpdated"),
    };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return {
      message: t("auth.profileUpdateFailed"),
      data: { username, email },
    };
  }
}

export async function updatePassword(state: FormState, formData: FormData) {
  const [t, tv] = await Promise.all([
    getTranslations("Errors"),
    getTranslations("Errors.validation")
  ]);
  const { getUpdatePasswordFormSchema } = await import("@/lib/definitions");
  const { getUser } = await import("@/lib/dal");

  // 1. Get current user
  const user = await getUser();

  if (!user) {
    return {
      message: t("auth.loginRequiredUpdatePassword"),
    };
  }

  // 2. Validate form fields
  const validatedFields = getUpdatePasswordFormSchema(tv).safeParse({
    currentPassword: formData.get("current_password"),
    newPassword: formData.get("new_password"),
    confirmPassword: formData.get("confirm_password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  // 3. Get user with password from database
  const [userWithPassword] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!userWithPassword) {
    return {
      message: t("auth.userNotFound"),
    };
  }

  // 4. Verify current password
  const passwordMatch = await bcrypt.compare(currentPassword, userWithPassword.password);

  if (!passwordMatch) {
    return {
      message: t("auth.currentPasswordIncorrect"),
      data: { currentPassword, newPassword },
    };
  }

  // 5. Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 6. Update password
  try {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return {
      message: t("auth.passwordUpdated"),
    };
  } catch (error) {
    console.error("Failed to update password:", error);
    return {
      message: t("auth.passwordUpdateFailed"),
      data: { currentPassword, newPassword },
    };
  }
}

export async function requestPasswordReset(state: FormState, formData: FormData) {
  const [t, tv] = await Promise.all([
    getTranslations("Errors"),
    getTranslations("Errors.validation")
  ]);
  // 1. Validate form fields
  const validatedFields = getForgotPasswordFormSchema(tv).safeParse({
    usernameXorEmail: formData.get("username_xor_email"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      data: {
        usernameXorEmail: formData.get("username_xor_email") as string,
      },
    };
  }

  const { usernameXorEmail } = validatedFields.data;

  // Always return the same message regardless of whether the user exists
  const successMessage = t("auth.resetRequestSent");

  // 2. Query the database for the user by email or username
  const isEmail = usernameXorEmail.includes("@");
  const [user] = await db
    .select()
    .from(users)
    .where(isEmail ? eq(users.email, usernameXorEmail) : eq(users.username, usernameXorEmail))
    .limit(1);

  // If user doesn't exist, still return success message (security best practice)
  if (!user) {
    return {
      message: successMessage,
    };
  }

  // 3. Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");

  // 4. Delete any existing reset tokens for this user
  try {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));
  } catch (error) {
    console.error("Failed to delete existing tokens:", error);
  }

  // 5. Save the token to database
  try {
    await db.insert(passwordResetTokens).values({
      token,
      userId: user.id,
    });
  } catch (error) {
    console.error("Failed to create reset token:", error);
    return {
      message: successMessage,
    };
  }

  // 6. Send email with reset link
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    const { data, error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [user.email],
      subject: "Password Reset Request",
      html: `<p>Reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    });

    if (sendError) console.error("Resend API error:", JSON.stringify(sendError));
  } catch (error) {
    console.error("Failed to send reset email:", error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error));
  }

  return {
    message: successMessage,
  };
}

export async function resetPassword(
  email: string,
  token: string,
  state: FormState,
  formData: FormData
) {
  const [t, tv] = await Promise.all([
    getTranslations("Errors"),
    getTranslations("Errors.validation")
  ]);
  // 1. Validate form fields
  const validatedFields = getResetPasswordFormSchema(tv).safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirm_password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { password, confirmPassword } = validatedFields.data;

  // 2. Verify passwords are equal
  if (password !== confirmPassword) {
    return {
      message: t("auth.passwordsMustMatch"),
    };
  }

  // 3. Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return {
      message: t("auth.invalidResetLink"),
    };
  }

  // 4. Verify token exists for this user
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      eq(passwordResetTokens.token, token)
    )
    .limit(1);

  if (!resetToken || resetToken.userId !== user.id) {
    return {
      message: t("auth.invalidResetLink"),
    };
  }

  // 6. Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 7. Update user password
  try {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // 8. Delete the used token
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    return {
      message: t("auth.passwordResetSuccess"),
    };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return {
      message: t("auth.passwordResetFailed"),
    };
  }
}
