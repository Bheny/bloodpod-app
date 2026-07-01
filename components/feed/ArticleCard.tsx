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

export function ArticleCard({ article }: { article: Article }) {
  const category = CATEGORY_STYLES[article.category];

  return (
    <Link
      href={`/feed/${article.slug}`}
      className="block overflow-hidden rounded-2xl border-[0.5px] border-[#E5E5EA] bg-white transition-colors duration-150 hover:border-red"
    >
      {article.coverImageUrl ? (
        <div className="relative h-28">
          <Image
            src={article.coverImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center bg-ink">
          <Droplet className="size-8 text-white/15" />
        </div>
      )}

      <div className="p-3.5 lg:p-4">
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold lg:text-[11px]"
          style={{ backgroundColor: category.bg, color: category.color }}
        >
          {category.label}
        </span>
        <p className="mt-2 text-[13px] font-extrabold leading-tight tracking-[-0.3px] text-ink lg:text-[15px]">
          {article.title}
        </p>
        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-ink-muted lg:text-[13px]">
          {article.excerpt}
        </p>
        <p className="mt-2 text-[9px] text-ink-faint lg:text-[11px]">
          {article.authorName} · {formatRelativeTime(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}
