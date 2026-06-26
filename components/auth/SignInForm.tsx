"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/auth/OAuthButtons";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function SignInForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  async function onSubmit(values: SignInValues) {
    if (isLocked) return;
    setFormError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      if (error.code === "email_not_confirmed") {
        setFormError("Please confirm your email before signing in — check your inbox for the link.");
        return;
      }

      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);

      if (attempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setFormError(`Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.`);
        setTimeout(() => setIsLocked(false), LOCKOUT_MINUTES * 60 * 1000);
      } else {
        setFormError("Invalid email or password");
      }
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div>
      <h1 className="mt-6 text-center text-2xl font-bold text-ink">Welcome back</h1>
      <p className="mt-1 text-center text-sm text-ink-muted">Sign in to your pod</p>

      <div className="mt-8">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="my-6 flex items-center gap-3 text-[13px] text-ink-faint">
        <div className="h-px flex-1 bg-[#E5E5EA]" />
        or continue with email
        <div className="h-px flex-1 bg-[#E5E5EA]" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Email address" id="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-semibold text-ink-mid">
              Password
            </label>
            <Link href="/forgot-password" className="text-[13px] font-semibold text-red">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {errors.password?.message && (
            <p className="text-xs text-red">{errors.password.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-red">{formError}</p>}

        <Button type="submit" loading={isSubmitting} disabled={isLocked} className="mt-1 w-full">
          {isSubmitting ? "Signing in..." : "Sign in →"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mid">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-semibold text-red">
          Build your pod →
        </Link>
      </p>
    </div>
  );
}
