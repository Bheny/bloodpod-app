"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { BloodType } from "@prisma/client";
import { profileSchema, type ProfileValues } from "@/lib/validations/profile";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

export function EditProfileForm({
  defaultValues,
}: {
  defaultValues: { name: string; phone: string; city: string; bloodType: BloodType | "" };
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: defaultValues.name,
      phone: defaultValues.phone,
      city: defaultValues.city,
      bloodType: defaultValues.bloodType || undefined,
    },
  });

  async function onSubmit(values: ProfileValues) {
    setFormError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push("/profile");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4">
      <Field label="Full name" id="name" error={errors.name?.message}>
        <Input id="name" {...register("name")} />
      </Field>

      <Field label="Phone number" id="phone" error={errors.phone?.message}>
        <Input id="phone" type="tel" placeholder="024 000 0000" {...register("phone")} />
      </Field>

      <Field label="City" id="city" error={errors.city?.message}>
        <Input id="city" placeholder="Accra" {...register("city")} />
      </Field>

      <Field label="Blood type" id="bloodType" error={errors.bloodType?.message}>
        <Select id="bloodType" {...register("bloodType")}>
          <option value="">I don&apos;t know</option>
          {Object.entries(BLOOD_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      {formError && <p className="text-sm text-red">{formError}</p>}

      <Button type="submit" loading={isSubmitting} size="lg" className="mt-1 w-full">
        Save changes
      </Button>
    </form>
  );
}
