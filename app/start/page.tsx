import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { StartFlow } from "@/components/start/StartFlow";

export const metadata: Metadata = {
  title: "Build your Blood Card | BloodPod",
  description: "Answer three quick questions and see your Blood Card. No account needed yet.",
};

export default async function StartPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.hospitalId ? "/hospital" : "/dashboard");

  return (
    <Suspense>
      <StartFlow />
    </Suspense>
  );
}
