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
      <div className="border-b-[0.5px] border-[#E5E5EA] bg-white px-4 py-3.5">
        <h1 className="text-[13px] font-extrabold tracking-[-0.4px] text-ink">Feed</h1>
        <p className="text-[9px] text-ink-muted">Tips and articles from the BloodPod team</p>
      </div>

      <FeedList initialArticles={articles} initialNextCursor={nextCursor} />
    </div>
  );
}
