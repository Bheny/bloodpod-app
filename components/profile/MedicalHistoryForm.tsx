"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Genotype } from "@prisma/client";
import {
  medicalHistorySchema,
  type MedicalHistoryValues,
} from "@/lib/validations/profile";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

const GENOTYPE_LABELS: Record<Genotype, string> = {
  AA: "AA",
  AS: "AS",
  SS: "SS",
  AC: "AC",
  SC: "SC",
  CC: "CC",
  UNKNOWN: "I don't know",
};

export interface MedicalHistoryDefaults {
  genotype: Genotype | "";
  allergies: string;
  chronicConditions: string;
  medications: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export function MedicalHistoryForm({ defaultValues }: { defaultValues: MedicalHistoryDefaults }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicalHistoryValues>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      genotype: defaultValues.genotype || undefined,
      allergies: defaultValues.allergies,
      chronicConditions: defaultValues.chronicConditions,
      medications: defaultValues.medications,
      emergencyContactName: defaultValues.emergencyContactName,
      emergencyContactPhone: defaultValues.emergencyContactPhone,
    },
  });

  async function onSubmit(values: MedicalHistoryValues) {
    setFormError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile/medical-history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4">
      <Field label="Genotype" id="genotype" error={errors.genotype?.message}>
        <Select id="genotype" {...register("genotype")}>
          <option value="">Select genotype</option>
          {Object.entries(GENOTYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Allergies" id="allergies" error={errors.allergies?.message}>
        <Textarea id="allergies" placeholder="e.g. penicillin, peanuts" {...register("allergies")} />
      </Field>

      <Field label="Chronic conditions" id="chronicConditions" error={errors.chronicConditions?.message}>
        <Textarea
          id="chronicConditions"
          placeholder="e.g. hypertension, diabetes"
          {...register("chronicConditions")}
        />
      </Field>

      <Field label="Current medications" id="medications" error={errors.medications?.message}>
        <Textarea id="medications" placeholder="e.g. lisinopril 10mg daily" {...register("medications")} />
      </Field>

      <Field
        label="Emergency contact name"
        id="emergencyContactName"
        error={errors.emergencyContactName?.message}
      >
        <Input id="emergencyContactName" {...register("emergencyContactName")} />
      </Field>

      <Field
        label="Emergency contact phone"
        id="emergencyContactPhone"
        error={errors.emergencyContactPhone?.message}
      >
        <Input id="emergencyContactPhone" type="tel" {...register("emergencyContactPhone")} />
      </Field>

      {formError && <p className="text-sm text-red">{formError}</p>}
      {saved && <p className="text-sm font-semibold text-[#1FA855]">Saved ✓</p>}

      <Button type="submit" loading={isSubmitting} size="lg" className="mt-1 w-full">
        Save medical history
      </Button>
    </form>
  );
}
