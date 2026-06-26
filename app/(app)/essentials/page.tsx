import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getUserCards, getUserDocuments } from "@/lib/essentials-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { EssentialsTabs } from "@/components/essentials/EssentialsTabs";

export default async function EssentialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const [cards, documents] = await Promise.all([
    getUserCards(user.id),
    getUserDocuments(user.id),
  ]);

  return (
    <div>
      <AppHeader
        title="My Essentials"
        subtitle="Your IDs and documents, ready to share when needed"
        backHref="/profile"
      />
      <EssentialsTabs cards={cards} documents={documents} />
    </div>
  );
}
