import { z } from "zod";
import { normalizeGhanaPhone } from "@/lib/phone";

export const bloodTypeOptions = [
  { label: "A+", value: "A_POS" },
  { label: "A−", value: "A_NEG" },
  { label: "B+", value: "B_POS" },
  { label: "B−", value: "B_NEG" },
  { label: "O+", value: "O_POS" },
  { label: "O−", value: "O_NEG" },
  { label: "AB+", value: "AB_POS" },
  { label: "AB−", value: "AB_NEG" },
  { label: "I don't know", value: "" },
] as const;

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizeGhanaPhone(v) !== null, "Enter a Ghana mobile number, like 024 123 4567"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type SignInValues = z.infer<typeof signInSchema>;
