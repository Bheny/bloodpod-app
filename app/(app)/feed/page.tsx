import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFeedPage } from "@/lib/feed-data";
import { FeedList } from "@/components/feed/FeedList";

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { articles, nextCursor } = await getFeedPage();

  return (
    <div>
      <div className="border-b-[0.5px] border-hairline bg-white px-4 py-3.5 lg:px-6 lg:py-5">
        <h1 className="text-body-sm font-extrabold tracking-[-0.4px] text-ink lg:text-title">Feed</h1>
        <p className="text-label text-ink-muted">
          Tips and articles from the BloodPod team
        </p>
      </div>

      <FeedList initialArticles={articles} initialNextCursor={nextCursor} />
    </div>
  );
}
