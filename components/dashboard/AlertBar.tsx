import Link from "next/link";
import { m } from "framer-motion";
import { Droplet } from "lucide-react";
import { formatBloodType } from "@/lib/formatters";
import type { BloodRequest, User } from "@prisma/client";

export function AlertBar({ request }: { request: BloodRequest & { requester: User } }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink px-3.5 py-3.5">
      <m.span
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex size-[34px] shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(221,0,0,0.25)" }}
      >
        <Droplet className="size-4 text-red" />
      </m.span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-white">
          {request.requester.name ?? "Someone"} needs {formatBloodType(request.bloodType)} blood
        </p>
        <p className="truncate text-[10px] text-white/40">
          {request.facility} · {request.urgency.toLowerCase()}
        </p>
      </div>

      <Link
        href="/dashboard/request"
        className="shrink-0 rounded-full bg-red px-3 py-1.5 text-[11px] font-bold text-white"
      >
        Respond
      </Link>
    </div>
  );
}
