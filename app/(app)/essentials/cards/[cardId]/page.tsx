import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserCard } from "@/lib/essentials-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { CardForm } from "@/components/essentials/CardForm";

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { cardId } = await params;
  const card = await getUserCard(user.id, cardId);
  if (!card) notFound();

  return (
    <div>
      <AppHeader title="Edit card" backHref="/essentials" />
      <CardForm supabaseId={user.supabaseId} initialCard={card} />
    </div>
  );
}
