import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AppHeader } from "@/components/layout/AppHeader";
import { CardForm } from "@/components/essentials/CardForm";

export default async function NewCardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  return (
    <div>
      <AppHeader title="Add a card" backHref="/essentials" />
      <CardForm supabaseId={user.supabaseId} />
    </div>
  );
}
