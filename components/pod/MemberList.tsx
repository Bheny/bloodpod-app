"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { MemberItem } from "@/components/pod/MemberItem";
import { MemberDetailModal } from "@/components/pod/MemberDetailModal";
import type { PodMemberView } from "@/lib/pod-data";

export function MemberList({ members }: { members: PodMemberView[] }) {
  const [selected, setSelected] = useState<PodMemberView | null>(null);

  return (
    <>
      <div className="divide-y-[0.5px] divide-surface">
        {members.map((member, i) => (
          <m.div
            key={member.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          >
            <MemberItem member={member} onSelect={setSelected} />
          </m.div>
        ))}
      </div>

      <MemberDetailModal member={selected} onClose={() => setSelected(null)} />
    </>
  );
}
