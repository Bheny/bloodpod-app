"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Document, DocumentType } from "@prisma/client";
import { documentSchema, type DocumentValues } from "@/lib/validations/essentials";
import { documentFilePath, extensionFor, uploadToStorage, deleteFromStorage } from "@/lib/uploads";
import { Field, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { FileUploadSlot } from "@/components/essentials/FileUploadSlot";

const TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "MEDICAL_RECORD", label: "Medical record" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "VACCINATION", label: "Vaccination" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "LAB_RESULT", label: "Lab result" },
  { value: "OTHER", label: "Other" },
];

function toDateInput(date: Date | string | null | undefined) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function DocumentForm({
  supabaseId,
  initialDocument,
}: {
  supabaseId: string;
  initialDocument?: Document;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DocumentValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      type: initialDocument?.type ?? "MEDICAL_RECORD",
      title: initialDocument?.title ?? "",
      documentDate: toDateInput(initialDocument?.documentDate),
      notes: initialDocument?.notes ?? "",
    },
  });

  async function onSubmit(values: DocumentValues) {
    setFormError(null);
    try {
      const recordId = initialDocument?.id ?? crypto.randomUUID();

      let filePath = initialDocument?.filePath ?? undefined;
      if (file) {
        filePath = documentFilePath(supabaseId, recordId, extensionFor(file));
        await uploadToStorage(filePath, file);
      }

      const payload = { ...values, id: recordId, filePath };
      const res = await fetch(
        initialDocument
          ? `/api/essentials/documents/${initialDocument.id}`
          : "/api/essentials/documents",
        {
          method: initialDocument ? "PUT" : "POST",
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
    if (!initialDocument) return;
    setDeleting(true);
    try {
      await deleteFromStorage([initialDocument.filePath ?? ""]);
      await fetch(`/api/essentials/documents/${initialDocument.id}`, { method: "DELETE" });
      router.push("/essentials");
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4">
      <Field label="Title" id="title" error={errors.title?.message}>
        <Input id="title" placeholder="e.g. Blood test results" {...register("title")} />
      </Field>

      <Field label="Document type" id="type" error={errors.type?.message}>
        <Select id="type" {...register("type")}>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Document date" id="documentDate" error={errors.documentDate?.message}>
        <Input id="documentDate" type="date" {...register("documentDate")} />
      </Field>

      <FileUploadSlot label="Scanned file" existingPath={initialDocument?.filePath} onSelect={setFile} />

      <Field label="Notes" id="notes" error={errors.notes?.message}>
        <Textarea id="notes" placeholder="Optional" {...register("notes")} />
      </Field>

      {formError && <p className="text-sm text-red">{formError}</p>}

      <Button type="submit" loading={isSubmitting} size="lg" className="mt-1 w-full">
        {initialDocument ? "Save changes" : "Save document"}
      </Button>

      {initialDocument && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm font-semibold text-red disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete this document"}
        </button>
      )}
    </form>
  );
}
