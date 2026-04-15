"use server";

import { SignupFormSchema, RegisterFormSchema, LoginFormSchema, FormState, ForgotPasswordFormSchema, ResetPasswordFormSchema } from "@/lib/definitions";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { PasswordResetEmail } from "@/components/password-reset-email";
import crypto from "crypto";

export async function signup(state: FormState, formData: FormData) {
  // 1. Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
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
      message: "An account with this email already exists",
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
      message: "Failed to create account. Please try again.",
    };
  }

  // 5. Create session
  const sessionCreated = await createSession(newUser.id, newUser.role);

  if (!sessionCreated) {
    return {
      message: "Failed to create session. Please try again.",
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
  // 1. Validate form fields
  const validatedFields = RegisterFormSchema.safeParse({
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
      message: "An account with this email already exists",
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
      message: "Failed to create account. Please try again.",
      data: { username, email, password },
    };
  }

  // 5. Create session
  const sessionCreated = await createSession(newUser.id, newUser.role);

  if (!sessionCreated) {
    return {
      message: "Failed to create session. Please try logging in.",
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
  // 1. Validate form fields
  const validatedFields = LoginFormSchema.safeParse({
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
      message: "Invalid username xor email and/or password",
      data: { usernameXorEmail, password },
    };
  }

  // 3. Compare passwords
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return {
      message: "Invalid email or password",
      data: { usernameXorEmail, password },
    };
  }

  // 4. Create session
  const sessionCreated = await createSession(user.id, user.role);

  if (!sessionCreated) {
    return {
      message: "Failed to create session. Please try again.",
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
  redirect("/");
}

export async function updateProfile(state: FormState, formData: FormData) {
  const { UpdateProfileFormSchema } = await import("@/lib/definitions");
  const { getUser } = await import("@/lib/dal");

  // 1. Get current user
  const user = await getUser();

  if (!user) {
    return {
      message: "You must be logged in to update your profile",
    };
  }

  // 2. Validate form fields
  const validatedFields = UpdateProfileFormSchema.safeParse({
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
        message: "Username is already taken",
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
        message: "Email is already taken",
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
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Failed to update profile:", error);
    return {
      message: "Failed to update profile. Please try again.",
      data: { username, email },
    };
  }
}

export async function updatePassword(state: FormState, formData: FormData) {
  const { UpdatePasswordFormSchema } = await import("@/lib/definitions");
  const { getUser } = await import("@/lib/dal");

  // 1. Get current user
  const user = await getUser();

  if (!user) {
    return {
      message: "You must be logged in to update your password",
    };
  }

  // 2. Validate form fields
  const validatedFields = UpdatePasswordFormSchema.safeParse({
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
      message: "User not found",
    };
  }

  // 4. Verify current password
  const passwordMatch = await bcrypt.compare(currentPassword, userWithPassword.password);

  if (!passwordMatch) {
    return {
      message: "Current password is incorrect",
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
      message: "Password updated successfully",
    };
  } catch (error) {
    console.error("Failed to update password:", error);
    return {
      message: "Failed to update password. Please try again.",
      data: { currentPassword, newPassword },
    };
  }
}

export async function requestPasswordReset(state: FormState, formData: FormData) {
  // 1. Validate form fields
  const validatedFields = ForgotPasswordFormSchema.safeParse({
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
  const successMessage = "If an account with those credentials exists, we've sent a password reset link to its mailbox.";

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

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: [user.email],
      subject: "Password Reset Request",
      react: PasswordResetEmail({ resetLink }),
    });
  } catch (error) {
    console.error("Failed to send reset email:", error);
    // Still return success message to avoid leaking information
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
  // 1. Validate form fields
  const validatedFields = ResetPasswordFormSchema.safeParse({
    currentPassword: formData.get("current_password"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirm_password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { currentPassword, password } = validatedFields.data;

  // 2. Find user by email
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return {
      message: "Invalid or expired reset link",
    };
  }

  // 3. Verify token exists for this user
  const [resetToken] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      eq(passwordResetTokens.token, token)
    )
    .limit(1);

  if (!resetToken || resetToken.userId !== user.id) {
    return {
      message: "Invalid or expired reset link",
    };
  }

  // 4. Verify current password
  const passwordMatch = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatch) {
    return {
      message: "Current password is incorrect",
    };
  }

  // 5. Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 6. Update user password
  try {
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // 7. Delete the used token
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));

    return {
      message: "Password reset successfully. You can now log in with your new password.",
    };
  } catch (error) {
    console.error("Failed to reset password:", error);
    return {
      message: "Failed to reset password. Please try again.",
    };
  }
}
