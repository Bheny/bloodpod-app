"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, bloodTypeOptions, type SignUpValues } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { parseInviteIdentifier } from "@/lib/invite-identifier";
import { Field, Input, PasswordInput } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/auth/OAuthButtons";

interface InvitePreview {
  podName: string;
  inviterName: string | null;
}

interface CheckResult {
  identifier: string;
  preview: InvitePreview | null;
}

function fetchInvitePreview(identifier: string, onResult: (result: CheckResult) => void) {
  fetch(`/api/invite/${identifier}`)
    .then(async (res) => {
      if (!res.ok) {
        onResult({ identifier, preview: null });
        return;
      }
      const data = await res.json();
      onResult({ identifier, preview: { podName: data.pod.name, inviterName: data.inviter.name } });
    })
    .catch(() => onResult({ identifier, preview: null }));
}

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlInviteToken = searchParams.get("invite");

  const [formError, setFormError] = useState<string | null>(null);
  const [showCodeField, setShowCodeField] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  const targetIdentifier = urlInviteToken || (codeValue.trim() ? parseInviteIdentifier(codeValue.trim()) : "");
  const checking = targetIdentifier !== "" && checkResult?.identifier !== targetIdentifier;
  const showResult = targetIdentifier !== "" && checkResult?.identifier === targetIdentifier;
  const preview = showResult ? checkResult?.preview ?? null : null;
  const notFound = showResult && !preview;

  useEffect(() => {
    if (urlInviteToken) fetchInvitePreview(urlInviteToken, setCheckResult);
  }, [urlInviteToken]);

  useEffect(() => {
    if (urlInviteToken) return;
    const trimmed = codeValue.trim();
    if (!trimmed) return;
    const identifier = parseInviteIdentifier(trimmed);
    const timer = setTimeout(() => fetchInvitePreview(identifier, setCheckResult), 400);
    return () => clearTimeout(timer);
  }, [codeValue, urlInviteToken]);

  async function onSubmit(values: SignUpValues) {
    setFormError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.name } },
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    if (data.user) {
      await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseId: data.user.id,
          email: values.email,
          name: values.name,
          bloodType: values.bloodType,
        }),
      });
    }

    if (targetIdentifier) {
      localStorage.setItem("pending_invite_token", targetIdentifier);
    }

    router.push("/onboarding");
  }

  return (
    <div>
      <h1 className="mt-6 text-center text-2xl font-bold text-ink">Create your account</h1>
      <p className="mt-1 text-center text-sm text-ink-muted">
        Free forever. Build your pod in 60 seconds.
      </p>

      <div className="mt-8">
        <GoogleButton label="Continue with Google" />
      </div>

      <div className="my-6 flex items-center gap-3 text-[13px] text-ink-faint">
        <div className="h-px flex-1 bg-[#E5E5EA]" />
        or continue with email
        <div className="h-px flex-1 bg-[#E5E5EA]" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Full name" id="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Akosua Mensah" {...register("name")} />
        </Field>

        <Field label="Email address" id="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>

        <Field label="Password" id="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register("password")}
          />
        </Field>

        <Field label="Blood type" id="bloodType" error={errors.bloodType?.message}>
          <Select id="bloodType" defaultValue="" {...register("bloodType")}>
            {bloodTypeOptions.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>

        {urlInviteToken ? (
          preview && (
            <p className="rounded-xl bg-red-light px-3 py-2.5 text-xs font-semibold text-red">
              You&apos;ll join {preview.podName}
              {preview.inviterName ? ` · invited by ${preview.inviterName}` : ""}
            </p>
          )
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowCodeField((v) => !v)}
              className="text-sm font-semibold text-red"
            >
              Have an invite code?
            </button>
            {showCodeField && (
              <div className="mt-2">
                <Input
                  placeholder="Enter code or paste invite link"
                  value={codeValue}
                  onChange={(e) => setCodeValue(e.target.value)}
                />
                {checking && <p className="mt-1.5 text-xs text-ink-muted">Checking...</p>}
                {!checking && preview && (
                  <p className="mt-1.5 text-xs font-semibold text-red">
                    You&apos;ll join {preview.podName}
                    {preview.inviterName ? ` · invited by ${preview.inviterName}` : ""} →
                  </p>
                )}
                {!checking && notFound && (
                  <p className="mt-1.5 text-xs text-ink-muted">
                    That code wasn&apos;t found — you can still create your own pod.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {formError && <p className="text-sm text-red">{formError}</p>}

        <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? "Creating your account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mid">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-red">
          Sign in
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-ink-faint">
        By creating an account you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
