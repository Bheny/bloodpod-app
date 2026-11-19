"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Droplet, Stethoscope } from "lucide-react";
import {
  hospitalApplicationSchema,
  hospitalKindOptions,
  type HospitalApplicationValues,
} from "@/lib/validations/hospital";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, PasswordInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const KIND_ICONS = { HOSPITAL: Building2, BLOOD_BANK: Droplet, CLINIC: Stethoscope } as const;

export function HospitalApplyForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<HospitalApplicationValues>({
    resolver: zodResolver(hospitalApplicationSchema),
    defaultValues: { kind: "HOSPITAL" },
  });

  const kind = useWatch({ control, name: "kind" });

  async function next() {
    const ok = await trigger(["name", "jobTitle", "email", "password"]);
    if (ok) setStep(2);
  }

  async function onSubmit(values: HospitalApplicationValues) {
    setFormError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.name } },
    });
    if (error) {
      setFormError(error.message);
      setStep(1);
      return;
    }

    const res = await fetch("/api/hospital/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFormError(data.error ?? "We could not submit your application. Please try again.");
      return;
    }

    router.push("/hospital");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-2" aria-label={`Step ${step} of 2`}>
        {[1, 2].map((n) => (
          <span
            key={n}
            className={cn("h-1.5 flex-1 rounded-full transition-colors", n <= step ? "bg-red" : "bg-hairline")}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6">
        <AnimatePresence mode="wait" initial={false}>
          {step === 1 ? (
            <m.div
              key="s1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-fg">Step 1 of 2</p>
                <h2 className="mt-2 text-xl font-extrabold tracking-[-0.5px] text-ink">Who is applying?</h2>
                <p className="mt-1 text-sm text-ink-muted">You will be the main contact for your facility.</p>
              </div>

              <Field label="Your full name" id="name" error={errors.name?.message}>
                <Input id="name" autoComplete="name" placeholder="Dr. Kwesi Boateng" {...register("name")} />
              </Field>
              <Field label="Your role" id="jobTitle" error={errors.jobTitle?.message}>
                <Input id="jobTitle" placeholder="Head of Blood Bank" {...register("jobTitle")} />
              </Field>
              <Field label="Work email" id="email" error={errors.email?.message}>
                <Input id="email" type="email" autoComplete="email" placeholder="you@hospital.com" {...register("email")} />
              </Field>
              <Field label="Password" id="password" error={errors.password?.message}>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...register("password")}
                />
              </Field>

              {formError && <p className="text-sm text-red-fg">{formError}</p>}

              <Button type="button" onClick={next} size="lg" className="w-full">
                Continue
              </Button>
            </m.div>
          ) : (
            <m.div
              key="s2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-5"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[2px] text-red-fg">Step 2 of 2</p>
                <h2 className="mt-2 text-xl font-extrabold tracking-[-0.5px] text-ink">Tell us about your facility</h2>
                <p className="mt-1 text-sm text-ink-muted">We use this to verify you and to find donors near you.</p>
              </div>

              <fieldset>
                <legend className="text-[13px] font-semibold text-ink-mid">What kind of facility?</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {hospitalKindOptions.map((o) => {
                    const Icon = KIND_ICONS[o.value];
                    const on = kind === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setValue("kind", o.value, { shouldValidate: true })}
                        className={cn(
                          "rounded-xl border-[1.5px] p-3 text-left transition-colors",
                          on ? "border-red bg-red-light" : "border-hairline bg-card hover:border-red-mid",
                        )}
                      >
                        <Icon className={cn("size-5", on ? "text-red-fg" : "text-ink-muted")} />
                        <span className="mt-2 block text-sm font-bold text-ink">{o.label}</span>
                        <span className="block text-[11px] leading-snug text-ink-muted">{o.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <Field label="Facility name" id="facilityName" error={errors.facilityName?.message}>
                <Input id="facilityName" placeholder="Foresight Medical Centre" {...register("facilityName")} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="City or town" id="city" error={errors.city?.message}>
                  <Input id="city" placeholder="Accra" {...register("city")} />
                </Field>
                <Field label="Phone we can call" id="facilityPhone" error={errors.facilityPhone?.message}>
                  <Input id="facilityPhone" type="tel" inputMode="tel" placeholder="030 123 4567" {...register("facilityPhone")} />
                </Field>
              </div>
              <Field label="Address or area" id="address" error={errors.address?.message}>
                <Input id="address" placeholder="Street, area or landmark" {...register("address")} />
              </Field>
              <Field label="Anything we should know? (optional)" id="note" error={errors.note?.message}>
                <textarea
                  id="note"
                  rows={3}
                  placeholder="For example, how often you run short of blood, or which types are hardest to find."
                  className="w-full resize-none rounded-xl border border-hairline bg-card px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-red focus:outline-none focus:ring-3 focus:ring-red/8"
                  {...register("note")}
                />
              </Field>

              {formError && <p className="text-sm text-red-fg">{formError}</p>}

              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="px-6">
                  Back
                </Button>
                <Button type="submit" loading={isSubmitting} size="lg" className="flex-1">
                  {isSubmitting ? "Submitting..." : "Submit application"}
                </Button>
              </div>
              <p className="text-center text-xs text-ink-muted">
                We review every application by hand. Nothing is shared with donors until you are approved.
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </form>

      <p className="mt-6 text-center text-sm text-ink-mid">
        Already applied?{" "}
        <Link href="/sign-in" className="font-semibold text-red-fg">
          Sign in
        </Link>
      </p>
    </div>
  );
}
