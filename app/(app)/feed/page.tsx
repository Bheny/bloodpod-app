import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFeedPage } from "@/lib/feed-data";
import { AppHeader } from "@/components/layout/AppHeader";
import { FeedList } from "@/components/feed/FeedList";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { articles, nextCursor } = await getFeedPage();

  return (
    <div>
      <AppHeader wide title="Feed" subtitle="Tips and articles from the BloodPod team" />
      <FeedList initialArticles={articles} initialNextCursor={nextCursor} />
    </div>
  );
}
