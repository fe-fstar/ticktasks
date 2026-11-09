import { z } from "zod";

// Translator scoped to the "Errors.validation" namespace
export type ValidationT = (key: string) => string;

export const getSignupFormSchema = (t: ValidationT) => z.object({
  username: z
    .string()
    .min(2, { message: t("usernameMin") })
    .max(30, { message: t("usernameMax") })
    .trim(),
  email: z.string().email({ message: t("emailInvalid") }).trim(),
  password: z
    .string()
    .min(8, { message: t("passwordMin") })
    .regex(/[a-zA-Z]/, { message: t("passwordLetter") })
    .regex(/[0-9]/, { message: t("passwordNumber") })
    .trim(),
});

export const getRegisterFormSchema = (t: ValidationT) => z.object({
  username: z
    .string()
    .min(2, { message: t("usernameMin") })
    .max(30, { message: t("usernameMax") })
    .trim(),
  email: z.string().email({ message: t("emailInvalid") }).trim(),
  password: z
    .string()
    .min(8, { message: t("passwordMin") })
    .regex(/[a-zA-Z]/, { message: t("passwordLetter") })
    .regex(/[0-9]/, { message: t("passwordNumber") })
    .trim(),
  confirmPassword: z.string().trim(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t("passwordsMismatch"),
  path: ["confirmPassword"],
});

export const getLoginFormSchema = (t: ValidationT) => z.object({
  usernameXorEmail: z
    .string()
    .min(1, { message: t("usernameOrEmailRequired") })
    .trim(),
  password: z
    .string()
    .min(1, { message: t("passwordRequired") })
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

export const getUpdateProfileFormSchema = (t: ValidationT) => z.object({
  username: z
    .string()
    .min(2, { message: t("usernameMin") })
    .max(30, { message: t("usernameMax") })
    .trim(),
  email: z.email({ message: t("emailInvalid") }).trim(),
});

export const getUpdatePasswordFormSchema = (t: ValidationT) => z.object({
  currentPassword: z
    .string()
    .min(1, { message: t("currentPasswordRequired") })
    .trim(),
  newPassword: z
    .string()
    .min(8, { message: t("passwordMin") })
    .regex(/[a-zA-Z]/, { message: t("passwordLetter") })
    .regex(/[0-9]/, { message: t("passwordNumber") })
    .trim(),
  confirmPassword: z.string().trim(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: t("passwordsMismatch"),
  path: ["confirmPassword"],
});

export const getForgotPasswordFormSchema = (t: ValidationT) => z.object({
  usernameXorEmail: z
    .string()
    .min(1, { message: t("usernameOrEmailRequired") })
    .trim(),
});

export const getResetPasswordFormSchema = (t: ValidationT) => z.object({
  password: z
    .string()
    .min(8, { message: t("passwordMin") })
    .regex(/[a-zA-Z]/, { message: t("passwordLetter") })
    .regex(/[0-9]/, { message: t("passwordNumber") })
    .trim(),
  confirmPassword: z.string().trim(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t("passwordsMismatch"),
  path: ["confirmPassword"],
});

export type SessionPayload = {
  userId: string;
  role: string;
  expiresAt: number | Date;
};
