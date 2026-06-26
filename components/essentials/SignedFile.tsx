"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { getSignedUrl, isPdfPath } from "@/lib/uploads";
import { cn } from "@/lib/utils";

export function SignedFile({
  path,
  alt,
  className,
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const [result, setResult] = useState<{ path: string; url: string | null } | null>(null);

  useEffect(() => {
    getSignedUrl(path).then((signedUrl) => {
      setResult({ path, url: signedUrl });
    });
  }, [path]);

  const loading = result?.path !== path;
  const url = loading ? null : result?.url ?? null;

  if (loading) {
    return <div className={cn("animate-pulse bg-surface", className)} />;
  }

  if (!url) {
    return (
      <div className={cn("flex items-center justify-center bg-surface text-ink-faint", className)}>
        —
      </div>
    );
  }

  if (isPdfPath(path)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex flex-col items-center justify-center gap-1 bg-surface text-ink-mid",
          className,
        )}
      >
        <FileText className="size-6" />
        <span className="text-[10px] font-semibold">View PDF</span>
      </a>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element -- signed URLs are short-lived and per-request; next/image's caching/optimization doesn't apply here
  return <img src={url} alt={alt} className={cn("object-cover", className)} />;
}
