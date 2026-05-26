import { z } from 'zod';

export const EmailSchema = z.string().email().max(254).toLowerCase().trim();

export const PasswordSchema = z
  .string()
  .min(10, 'Mínimo 10 caracteres')
  .max(128)
  .regex(/[A-Z]/, 'Debe incluir una mayúscula')
  .regex(/[a-z]/, 'Debe incluir una minúscula')
  .regex(/[0-9]/, 'Debe incluir un número');

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  fullName: z.string().min(2).max(120).trim(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(10),
  password: PasswordSchema,
});

export const GoogleCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
