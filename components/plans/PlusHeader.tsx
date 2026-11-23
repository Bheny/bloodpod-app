"use client";

import { useState } from "react";
import { BillingToggle, type Billing } from "@/components/plans/BillingToggle";
import type { Tier } from "@/lib/plan-catalog";

/** The top of the Plus card on the in-app Plans page: name, price, and the monthly/yearly choice (yearly to begin with). */
export function PlusHeader({ tier }: { tier: Pick<Tier, "id" | "name" | "audience" | "price" | "cadence" | "yearly"> }) {
  const [billing, setBilling] = useState<Billing>("yearly");
  const yearly = billing === "yearly" ? tier.yearly : undefined;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`plan-${tier.id}`} className="text-title font-extrabold tracking-[-0.4px] text-ink">
            {tier.name}
          </h2>
          <p className="mt-0.5 text-caption text-ink-muted">{tier.audience}</p>
        </div>
        <p className="shrink-0 text-right text-[28px] font-extrabold leading-none tracking-[-1px] text-ink" aria-live="polite">
          {yearly ? yearly.price : tier.price}
          <span className="ml-1 block text-body-sm font-semibold tracking-normal text-ink-muted">{yearly ? yearly.cadence : tier.cadence}</span>
        </p>
      </div>

      {tier.yearly && (
        <div className="mt-3.5">
          <BillingToggle value={billing} onChange={setBilling} saving={tier.yearly.saving} />
          <p className="mt-2 min-h-5 text-caption text-ink-muted">
            {yearly
              ? `${yearly.perMonth} a month, paid once a year instead of ${yearly.monthlyTotal}.`
              : `Or ${tier.yearly.price} a year and get ${tier.yearly.saving}.`}
          </p>
        </div>
      )}
    </>
  );
}
