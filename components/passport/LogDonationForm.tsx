"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { m } from "framer-motion";
import type { BloodType } from "@prisma/client";
import { donationSchema, type DonationValues } from "@/lib/validations/donation";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";
import { formatDate, formatOrdinal } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface LogResult {
  newCount: number;
  newTier: string;
  tierUpgraded: boolean;
  streak: number;
  nextEligible: string;
}

export function LogDonationForm({ defaultBloodType }: { defaultBloodType: BloodType | null }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<LogResult | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DonationValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      facility: "",
      donatedAt: todayISO(),
      bloodType: defaultBloodType ?? undefined,
      verified: false,
      notes: "",
    },
  });

  async function onSubmit(values: DonationValues) {
    setFormError(null);
    try {
      const res = await fetch("/api/passport/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  function logAnother() {
    setResult(null);
    reset({
      facility: "",
      donatedAt: todayISO(),
      bloodType: defaultBloodType ?? undefined,
      verified: false,
      notes: "",
    });
  }

  return (
    <div className="relative px-4 py-5">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Hospital / facility" id="facility" error={errors.facility?.message}>
          <Input
            id="facility"
            placeholder="e.g. Trust Hospital, Korle Bu"
            className="text-[11px]"
            {...register("facility")}
          />
        </Field>

        <Field label="Date of donation" id="donatedAt" error={errors.donatedAt?.message}>
          <Input
            id="donatedAt"
            type="date"
            max={todayISO()}
            className="text-[11px]"
            {...register("donatedAt")}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <label className="text-[8px] font-bold uppercase tracking-wide text-ink-mid">
            Verification status
          </label>
          <Controller
            control={control}
            name="verified"
            render={({ field }) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => field.onChange(false)}
                  className={cn(
                    "flex-1 rounded-full py-2 text-[10px] font-bold transition-colors",
                    !field.value ? "bg-red text-white" : "bg-surface text-ink-muted",
                  )}
                >
                  Self-reported
                </button>
                <button
                  type="button"
                  onClick={() => field.onChange(true)}
                  className={cn(
                    "flex-1 rounded-full py-2 text-[10px] font-bold transition-colors",
                    field.value ? "bg-red text-white" : "bg-surface text-ink-muted",
                  )}
                >
                  Hospital verified
                </button>
              </div>
            )}
          />
        </div>

        <Field label="Blood type confirmed" id="bloodType" error={errors.bloodType?.message}>
          <Select id="bloodType" className="text-[11px]" {...register("bloodType")}>
            {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notes (optional)" id="notes" error={errors.notes?.message}>
          <Input
            id="notes"
            placeholder="e.g. walk-in donation, blood drive, emergency"
            maxLength={120}
            className="text-[11px]"
            {...register("notes")}
          />
        </Field>

        {formError && <p className="text-[9px] text-red">{formError}</p>}

        <Button type="submit" loading={isSubmitting} size="lg" className="w-full">
          {isSubmitting ? "Recording..." : "Record donation"}
        </Button>
      </form>

      {result && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center bg-black/70"
        >
          <m.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="mx-5 rounded-2xl bg-white p-[18px] text-center"
          >
            <p className="text-2xl">🩸</p>
            <p className="mt-2 text-[13px] font-extrabold tracking-[-0.3px] text-ink">
              Donation recorded.
            </p>
            <p className="mt-1 text-[10px] text-ink-muted">
              Your {formatOrdinal(result.newCount)} donation has been added to your passport.
            </p>

            {result.streak > 0 && (
              <span className="mt-2.5 inline-flex items-center gap-1 rounded-xl bg-red-light px-2.5 py-1.5 text-[9px] font-bold text-red">
                🔴 {result.streak}-quarter streak · keep it going
              </span>
            )}

            {result.tierUpgraded && (
              <div className="mt-2.5 rounded-xl bg-ink px-2.5 py-1.5">
                <p className="text-[9px] font-bold text-white">
                  You&apos;ve reached {result.newTier} tier
                </p>
              </div>
            )}

            <p className="mb-2.5 mt-2.5 text-[9px] text-ink-muted">
              Next eligible: {formatDate(result.nextEligible)}
            </p>

            <Link
              href="/passport"
              className="inline-block rounded-full bg-red px-[18px] py-2 text-[10px] font-bold text-white"
            >
              View my passport
            </Link>
            <button
              type="button"
              onClick={logAnother}
              className="mt-1.5 block w-full text-[10px] font-bold text-red"
            >
              Log another
            </button>
          </m.div>
        </m.div>
      )}
    </div>
  );
}
