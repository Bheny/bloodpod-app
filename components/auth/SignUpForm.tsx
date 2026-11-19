"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { parseInviteIdentifier } from "@/lib/invite-identifier";
import { Field, Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "@/components/auth/OAuthButtons";
import { isStartComplete, readStartState, type StartState } from "@/lib/start-state";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { addPendingInvite } from "@/lib/pending-invites";
import type { BloodType } from "@prisma/client";

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
  const fromStart = searchParams.get("from") === "start";
  const [saved, setSaved] = useState<StartState | null>(null);

  useEffect(() => {
    const s = readStartState();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only restore
    if (isStartComplete(s)) setSaved(s);
  }, []);

  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
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
      options: {
        data: { full_name: values.name },
        // Without this the confirmation link lands on the site root and nothing signs the person in.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
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
          phone: values.phone,
        }),
      });
    }

    if (targetIdentifier) addPendingInvite(targetIdentifier);

    // With email confirmation on, there is no session yet: tell them to check their inbox
    // instead of sending them to a page that would bounce them back to sign-in.
    if (!data.session) {
      setSentTo(values.email);
      return;
    }

    router.push("/onboarding");
  }

  async function resend() {
    if (!sentTo) return;
    setResendState("sending");
    const { error } = await createClient().auth.resend({
      type: "signup",
      email: sentTo,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResendState(error ? "error" : "sent");
  }

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="mx-auto mt-6 flex size-14 items-center justify-center rounded-full bg-red-light">
          <MailCheck className="size-7 text-red-fg" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          We sent a confirmation link to <span className="font-semibold text-ink">{sentTo}</span>.
          Open it to finish creating your account
          {preview ? ` and join ${preview.podName}` : ""}.
        </p>

        <ol className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm text-ink-mid">
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold">1</span>
            Open the email from BloodPod.
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold">2</span>
            Tap the confirm link, ideally on this device.
          </li>
          <li className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-bold">3</span>
            You&apos;ll land back here, signed in, ready to finish setup.
          </li>
        </ol>

        <p className="mt-6 text-xs text-ink-faint">Nothing there? Check spam or promotions.</p>
        <button
          type="button"
          onClick={resend}
          disabled={resendState === "sending" || resendState === "sent"}
          className="mt-2 text-sm font-semibold text-red-fg disabled:text-ink-faint"
        >
          {resendState === "sent" ? "Sent again" : resendState === "sending" ? "Sending..." : "Resend the email"}
        </button>
        {resendState === "error" && <p className="mt-1 text-xs text-red-fg">Couldn&apos;t resend. Try again in a minute.</p>}

        <p className="mt-6 text-sm text-ink-mid">
          Already confirmed?{" "}
          <Link href="/sign-in" className="font-semibold text-red-fg">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mt-6 text-center text-2xl font-bold text-ink">
        {saved ? "Save your Blood Card" : "Create your account"}
      </h1>
      <p className="mt-1 text-center text-sm text-ink-muted">
        {saved ? "Create your free account to keep it and get alerts." : "Free for donors. About two minutes to set up."}
      </p>

      {saved && fromStart && (
        <div className="mt-5 flex items-center gap-3 rounded-xl bg-red-light px-4 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red text-sm font-extrabold text-white">
            {BLOOD_TYPE_LABELS[saved.bloodType as BloodType]}
          </span>
          <p className="text-xs leading-snug text-ink-mid">
            <span className="block font-bold text-ink">Your answers are ready</span>
            {saved.city}, {saved.neverDonated ? "never donated" : "last donation saved"}
          </p>
        </div>
      )}

      <div className="mt-8">
        <GoogleButton
          label="Continue with Google"
          beforeRedirect={() => {
            // Onboarding's last step joins every saved invite.
            if (targetIdentifier) addPendingInvite(targetIdentifier);
          }}
        />
      </div>

      <div className="my-6 flex items-center gap-3 text-[13px] text-ink-faint">
        <div className="h-px flex-1 bg-hairline" />
        or continue with email
        <div className="h-px flex-1 bg-hairline" />
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

        <Field label="Mobile number" id="phone" error={errors.phone?.message}>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="024 123 4567"
            {...register("phone")}
          />
          <p className="text-xs text-ink-muted">Shared only if you say Yes to an alert.</p>
        </Field>

        <Field label="Password" id="password" error={errors.password?.message}>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register("password")}
          />
        </Field>


        {urlInviteToken ? (
          preview && (
            <p className="rounded-xl bg-red-light px-3 py-2.5 text-xs font-semibold text-red-fg">
              You&apos;ll join {preview.podName}
              {preview.inviterName ? ` · invited by ${preview.inviterName}` : ""}
            </p>
          )
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setShowCodeField((v) => !v)}
              className="text-sm font-semibold text-red-fg"
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
                  <p className="mt-1.5 text-xs font-semibold text-red-fg">
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

        {formError && <p className="text-sm text-red-fg">{formError}</p>}

        <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? "Creating your account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mid">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-red-fg">
          Sign in
        </Link>
      </p>

      <p className="mt-3 text-center text-sm text-ink-mid">
        Run a hospital or blood bank?{" "}
        <Link href="/hospital/apply" className="font-semibold text-red-fg">
          Apply for hospital access
        </Link>
      </p>

      <p className="mt-6 text-center text-xs text-ink-faint">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-semibold text-ink-muted underline underline-offset-2" target="_blank">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-ink-muted underline underline-offset-2" target="_blank">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
