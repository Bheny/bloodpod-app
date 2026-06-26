"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { IdCard, IdCardType } from "@prisma/client";
import { idCardSchema, type IdCardValues } from "@/lib/validations/essentials";
import { cardImagePath, extensionFor, uploadToStorage, deleteFromStorage } from "@/lib/uploads";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { FileUploadSlot } from "@/components/essentials/FileUploadSlot";

const TYPE_OPTIONS: { value: IdCardType; label: string }[] = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "NHIS", label: "NHIS" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "DRIVERS_LICENSE", label: "Driver's licence" },
  { value: "PASSPORT", label: "Passport" },
  { value: "STUDENT_ID", label: "Student ID" },
  { value: "OTHER", label: "Other" },
];

function toDateInput(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function CardForm({ supabaseId, initialCard }: { supabaseId: string; initialCard?: IdCard }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IdCardValues>({
    resolver: zodResolver(idCardSchema),
    defaultValues: {
      type: initialCard?.type ?? "NATIONAL_ID",
      label: initialCard?.label ?? "",
      cardNumber: initialCard?.cardNumber ?? "",
      issuingAuthority: initialCard?.issuingAuthority ?? "",
      expiryDate: toDateInput(initialCard?.expiryDate),
      notes: initialCard?.notes ?? "",
    },
  });

  const type = watch("type");

  async function onSubmit(values: IdCardValues) {
    setFormError(null);
    try {
      const recordId = initialCard?.id ?? crypto.randomUUID();

      let frontImagePath = initialCard?.frontImagePath ?? undefined;
      if (frontFile) {
        frontImagePath = cardImagePath(supabaseId, recordId, "front", extensionFor(frontFile));
        await uploadToStorage(frontImagePath, frontFile);
      }

      let backImagePath = initialCard?.backImagePath ?? undefined;
      if (backFile) {
        backImagePath = cardImagePath(supabaseId, recordId, "back", extensionFor(backFile));
        await uploadToStorage(backImagePath, backFile);
      }

      const payload = { ...values, id: recordId, frontImagePath, backImagePath };
      const res = await fetch(
        initialCard ? `/api/essentials/cards/${initialCard.id}` : "/api/essentials/cards",
        {
          method: initialCard ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      router.push("/essentials");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function handleDelete() {
    if (!initialCard) return;
    setDeleting(true);
    try {
      await deleteFromStorage([initialCard.frontImagePath ?? "", initialCard.backImagePath ?? ""]);
      await fetch(`/api/essentials/cards/${initialCard.id}`, { method: "DELETE" });
      router.push("/essentials");
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4">
      <Field label="Card type" id="type" error={errors.type?.message}>
        <Select id="type" {...register("type")}>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      {type === "OTHER" && (
        <Field label="Label" id="label" error={errors.label?.message}>
          <Input id="label" placeholder="e.g. Work ID" {...register("label")} />
        </Field>
      )}

      <Field label="Card number" id="cardNumber" error={errors.cardNumber?.message}>
        <Input id="cardNumber" {...register("cardNumber")} />
      </Field>

      <Field label="Issuing authority" id="issuingAuthority" error={errors.issuingAuthority?.message}>
        <Input id="issuingAuthority" placeholder="e.g. NIA, NHIA" {...register("issuingAuthority")} />
      </Field>

      <Field label="Expiry date" id="expiryDate" error={errors.expiryDate?.message}>
        <Input id="expiryDate" type="date" {...register("expiryDate")} />
      </Field>

      <FileUploadSlot
        label="Front of card"
        existingPath={initialCard?.frontImagePath}
        onSelect={setFrontFile}
      />
      <FileUploadSlot
        label="Back of card (optional)"
        existingPath={initialCard?.backImagePath}
        onSelect={setBackFile}
      />

      <Field label="Notes" id="notes" error={errors.notes?.message}>
        <Textarea id="notes" placeholder="Optional" {...register("notes")} />
      </Field>

      {formError && <p className="text-sm text-red">{formError}</p>}

      <Button type="submit" loading={isSubmitting} size="lg" className="mt-1 w-full">
        {initialCard ? "Save changes" : "Save card"}
      </Button>

      {initialCard && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm font-semibold text-red disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete this card"}
        </button>
      )}
    </form>
  );
}
