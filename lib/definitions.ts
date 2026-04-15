import { z } from "zod";

export const SignupFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters long" })
    .max(30, { message: "Username must be less than 30 characters" })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email" }).trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .trim(),
});

export const RegisterFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters long" })
    .max(30, { message: "Username must be less than 30 characters" })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email" }).trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .trim(),
  confirmPassword: z.string().trim(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const LoginFormSchema = z.object({
  usernameXorEmail: z
    .string()
    .min(1, { message: "Username xor email is required" })
    .trim(),
  password: z
    .string()
    .min(1, { message: "Password field must not be empty" })
    .trim(),
});

export type FormState =
  | {
      errors?: {
        username?: string[];
        email?: string[];
        usernameXorEmail?: string[];
        password?: string[];
        confirmPassword?: string[];
        currentPassword?: string[];
        newPassword?: string[];
      };
      message?: string;
      data?: {
        username?: string;
        email?: string;
        usernameXorEmail?: string;
        password?: string;
        currentPassword?: string;
        newPassword?: string;
      };
    }
  | undefined;

export const UpdateProfileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters long" })
    .max(30, { message: "Username must be less than 30 characters" })
    .trim(),
  email: z.email({ message: "Please enter a valid email" }).trim(),
});

export const UpdatePasswordFormSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: "Current password is required" })
    .trim(),
  newPassword: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .trim(),
  confirmPassword: z.string().trim(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ForgotPasswordFormSchema = z.object({
  usernameXorEmail: z
    .string()
    .min(1, { message: "Username or email is required" })
    .trim(),
});

export const ResetPasswordFormSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: "Current password is required" })
    .trim(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[a-zA-Z]/, { message: "Password must contain at least one letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .trim(),
  confirmPassword: z.string().trim(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SessionPayload = {
  userId: string;
  role: string;
  expiresAt: number | Date;
};
