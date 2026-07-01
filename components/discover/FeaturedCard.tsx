import Link from "next/link";
import Image from "next/image";
import { Droplet } from "lucide-react";
import type { Article } from "@prisma/client";
import { formatRelativeTime } from "@/lib/formatters";

const CATEGORY_STYLES: Record<Article["category"], { label: string; bg: string; color: string }> = {
  TIP: { label: "Tip", bg: "#FFF0F0", color: "#DD0000" },
  ARTICLE: { label: "Article", bg: "#F2F2F2", color: "#1C1C1E" },
  NEWS: { label: "News", bg: "#EFF6FF", color: "#1D4ED8" },
  FAQ: { label: "FAQ", bg: "#F5F3FF", color: "#6D28D9" },
};

export function FeaturedCard({ article }: { article: Article }) {
  const category = CATEGORY_STYLES[article.category];

  return (
    <Link
      href={`/feed/${article.slug}`}
      className="block w-[230px] shrink-0 snap-start overflow-hidden rounded-2xl border-[0.5px] border-hairline bg-white shadow-raised lg:w-[280px]"
    >
      {article.coverImageUrl ? (
        <div className="relative h-28 lg:h-36">
          <Image src={article.coverImageUrl} alt="" fill sizes="(min-width: 1024px) 280px, 230px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center bg-ink lg:h-36">
          <Droplet className="size-7 text-white/15" />
        </div>
      )}

      <div className="p-3 lg:p-4">
        <span
          className="rounded-full px-2 py-0.5 text-label font-bold"
          style={{ backgroundColor: category.bg, color: category.color }}
        >
          {category.label}
        </span>
        <p className="mt-1.5 line-clamp-2 text-caption font-extrabold leading-tight text-ink lg:text-body-sm">
          {article.title}
        </p>
        <p className="mt-1.5 text-label text-ink-faint">
          {formatRelativeTime(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
