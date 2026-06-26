import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { Droplet } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getArticleBySlug } from "@/lib/feed-data";
import { formatDate } from "@/lib/formatters";
import { AppHeader } from "@/components/layout/AppHeader";

const CATEGORY_LABELS: Record<string, string> = {
  TIP: "Tip",
  ARTICLE: "Article",
  NEWS: "News",
  FAQ: "FAQ",
};

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardingComplete) redirect("/onboarding");

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div>
      <AppHeader title="Feed" backHref="/feed" />

      {article.coverImageUrl ? (
        <div className="relative h-44">
          <Image src={article.coverImageUrl} alt="" fill sizes="100vw" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-32 items-center justify-center bg-ink">
          <Droplet className="size-10 text-white/15" />
        </div>
      )}

      <div className="px-4 py-4">
        <span className="rounded-full bg-red-light px-2 py-0.5 text-[10px] font-bold text-red">
          {CATEGORY_LABELS[article.category]}
        </span>

        <h1 className="mt-2.5 text-xl font-extrabold leading-tight tracking-[-0.5px] text-ink">
          {article.title}
        </h1>

        <p className="mt-2 text-[11px] text-ink-faint">
          {article.authorName} · {formatDate(article.publishedAt)}
        </p>

        <div className="mt-4 flex flex-col gap-3.5">
          {article.body.split(/\n\s*\n/).map((paragraph, i) => (
            <p key={i} className="text-[14px] leading-[1.7] text-ink-mid">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
