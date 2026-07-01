"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Article } from "@prisma/client";
import { ArticleCard } from "@/components/feed/ArticleCard";

export function FeedList({
  initialArticles,
  initialNextCursor,
}: {
  initialArticles: Article[];
  initialNextCursor: string | null;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/feed?cursor=${nextCursor}`);
      const data = await res.json();
      setArticles((prev) => [...prev, ...data.articles]);
      setNextCursor(data.nextCursor);
    } catch {
      // the sentinel stays in view, so the user can just scroll to retry
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="px-3.5 py-3 lg:px-6 lg:py-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {nextCursor && (
        <div ref={sentinelRef} className="mt-3 flex justify-center py-4">
          {loading && (
            <div className="size-5 animate-spin rounded-full border-2 border-red-mid border-t-red" />
          )}
        </div>
      )}

      {!nextCursor && articles.length > 0 && (
        <p className="mt-4 text-center text-label text-ink-faint lg:text-body-sm">
          You&apos;re all caught up.
        </p>
      )}
    </div>
  );
}
