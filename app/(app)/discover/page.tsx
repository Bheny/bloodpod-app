import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Church, Dumbbell, GraduationCap, Home, type LucideIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getFeaturedArticles } from "@/lib/discover-highlights";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { ArticleCard } from "@/components/feed/ArticleCard";
import { JoinByCodeForm } from "@/components/invite/JoinByCodeForm";

const IDEAS: { icon: LucideIcon; label: string; body: string }[] = [
  { icon: Church, label: "Church or mosque", body: "A congregation already trusts each other and meets weekly." },
  { icon: Briefcase, label: "Office", body: "Colleagues near a hospital are quick to reach." },
  { icon: GraduationCap, label: "School or campus", body: "Students are often young, healthy and nearby." },
  { icon: Dumbbell, label: "Gym or club", body: "Active people who show up for each other." },
  { icon: Home, label: "Family", body: "Close relatives, ready for the call that matters most." },
];

export default async function DiscoverPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.hospitalId) redirect("/hospital");
  if (!user.onboardingComplete) redirect("/onboarding");

  const featured = await getFeaturedArticles();

  return (
    <div>
      <AppHeader wide title="Discover" subtitle="Grow your circle and learn how giving blood works" />

      <div className="flex flex-col gap-3.5 px-3.5 pb-8 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6 lg:px-0 lg:pt-0">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-1 lg:order-none">
            <JoinByCodeForm />
          </div>

          {featured.length > 0 && (
            <div className="order-3 lg:order-none">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-body-sm font-bold text-ink lg:text-title">Worth reading</h2>
                <Link href="/feed" className="text-caption font-bold text-red">
                  See all
                </Link>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2 lg:gap-4">
                {featured.slice(0, 4).map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="order-2 lg:order-none lg:sticky lg:top-8">
          <Card>
            <CardTitle>Who to invite</CardTitle>
            <p className="mt-1 text-caption text-ink-muted lg:text-body-sm">
              The best Pods are groups that already trust each other.
            </p>
            <ul className="mt-4 space-y-3">
              {IDEAS.map((idea) => (
                <li key={idea.label} className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-light">
                    <idea.icon className="size-5 text-red" />
                  </span>
                  <span>
                    <span className="block text-body-sm font-bold text-ink">{idea.label}</span>
                    <span className="block text-caption leading-snug text-ink-muted">{idea.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/pod/invite"
              className="mt-5 block rounded-full bg-red py-3 text-center text-body-sm font-bold text-white transition-transform active:scale-95"
            >
              Invite people to your Pod
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
