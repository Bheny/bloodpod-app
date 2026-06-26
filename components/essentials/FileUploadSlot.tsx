"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { ACCEPTED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "@/lib/uploads";
import { SignedFile } from "@/components/essentials/SignedFile";

export function FileUploadSlot({
  label,
  existingPath,
  onSelect,
}: {
  label: string;
  existingPath?: string | null;
  onSelect: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);

    if (file && file.size > MAX_UPLOAD_BYTES) {
      setError("File is too large (max 8MB).");
      e.target.value = "";
      return;
    }

    onSelect(file);
    if (file) {
      setFileName(file.name);
      setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    } else {
      setFileName(null);
      setPreview(null);
    }
  }

  return (
    <div>
      <p className="text-[8px] font-bold uppercase tracking-wide text-ink-mid">{label}</p>
      <div className="mt-1.5 flex items-center gap-3">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote asset
          <img src={preview} alt="" className="size-16 rounded-xl object-cover" />
        ) : existingPath ? (
          <SignedFile path={existingPath} alt="" className="size-16 rounded-xl" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-xl bg-surface text-ink-faint">
            <Camera className="size-5" />
          </span>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="truncate rounded-full bg-surface px-3 py-2 text-[10px] font-bold text-ink"
        >
          {fileName ?? (existingPath ? "Replace" : "Upload")}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_UPLOAD_TYPES}
          capture="environment"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red">{error}</p>}
    </div>
  );
}
