import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { verifyTransaction } from "@/lib/paystack";
import { applySuccessfulCharge } from "@/lib/billing";

/** Paystack sends people back here. We verify the payment ourselves instead of trusting the URL. */
export default async function UpgradeDonePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref;

  let paid = false;
  if (reference) {
    try {
      const charge = await verifyTransaction(reference);
      const result = await applySuccessfulCharge(charge);
      // The charge must belong to this person.
      paid = Boolean(result && result.userId === user.id);
    } catch (err) {
      console.error("[billing] verify failed", err);
    }
  }

  return (
    <div className="flex flex-col items-center px-6 pb-10 pt-16 text-center">
      {paid ? <CheckCircle2 className="size-12 text-[#1FA855]" /> : <Clock className="size-12 text-[#F59E0B]" />}
      <h1 className="mt-4 text-[22px] font-extrabold tracking-[-0.6px] text-ink">
        {paid ? "Your Care Pod is active" : "We're confirming your payment"}
      </h1>
      <p className="mt-2 max-w-sm text-body-sm text-ink-muted">
        {paid
          ? "Thank you. You can now own more Pods."
          : "This can take a minute. If you were charged, your plan switches on automatically once the payment is confirmed."}
      </p>
      <Link href="/dashboard" className="mt-6 rounded-full bg-red px-6 py-3 text-body-sm font-bold text-white">
        Back to dashboard
      </Link>
      <Link href="/upgrade" className="mt-3 text-caption font-bold text-ink-muted">
        View plan
      </Link>
    </div>
  );
}
