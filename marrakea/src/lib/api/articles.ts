import type { ArticleDTO, ArticleDetailDTO, PaginatedResponse } from '@/types/dtos';

export async function getArticles(params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<PaginatedResponse<ArticleDTO>> {
  const { serverFetch } = await import('./client.server');
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.category) searchParams.set('category', params.category);

  const query = searchParams.toString();
  return serverFetch<PaginatedResponse<ArticleDTO>>(
    `/blog/articles${query ? `?${query}` : ''}`,
    { revalidate: 120, tags: ['articles'] }
  );
}

export async function getArticle(slug: string): Promise<ArticleDetailDTO> {
  const { serverFetch } = await import('./client.server');
  return serverFetch<ArticleDetailDTO>(`/blog/articles/${slug}`, {
    revalidate: 120,
    tags: ['articles', `article-${slug}`],
  });
}
