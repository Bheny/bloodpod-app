import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;

export interface FeedPage {
  articles: Awaited<ReturnType<typeof fetchArticles>>;
  nextCursor: string | null;
}

function fetchArticles(cursor?: string) {
  return prisma.article.findMany({
    take: PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
  });
}

export async function getFeedPage(cursor?: string): Promise<FeedPage> {
  const articles = await fetchArticles(cursor);
  const nextCursor = articles.length === PAGE_SIZE ? articles[articles.length - 1].id : null;
  return { articles, nextCursor };
}

export function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({ where: { slug } });
}
