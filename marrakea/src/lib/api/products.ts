import type {
  ProductDTO,
  ProductDetailDTO,
  PaginatedResponse,
  FilterParams,
  GestureDTO,
} from '@/types/dtos';

export async function getProducts(params?: FilterParams): Promise<PaginatedResponse<ProductDTO>> {
  const { serverFetch } = await import('./client.server');
  const searchParams = new URLSearchParams();
  if (params?.gesture) searchParams.set('gesture', params.gesture);
  if (params?.territory) searchParams.set('territory', params.territory);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  return serverFetch<PaginatedResponse<ProductDTO>>(
    `/catalog/products${query ? `?${query}` : ''}`,
    { revalidate: 60, tags: ['products'] }
  );
}

export async function getProduct(slug: string): Promise<ProductDetailDTO | null> {
  try {
    const { serverFetch } = await import('./client.server');
    return await serverFetch<ProductDetailDTO>(`/catalog/products/${slug}`, {
      revalidate: 60,
      tags: ['products', `product-${slug}`],
    });
  } catch (error) {
    // If BFF returns 404, return null to trigger not-found page
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

export async function getFeaturedProducts(): Promise<ProductDTO[]> {
  const { serverFetch } = await import('./client.server');
  return serverFetch<ProductDTO[]>('/catalog/products/featured', {
    revalidate: 300,
    tags: ['products', 'featured'],
  });
}

export async function checkStock(productId: string): Promise<{ inStock: boolean }> {
  const { clientFetch } = await import('./client.client');
  return clientFetch<{ inStock: boolean }>(`/catalog/products/${productId}/stock`, {
    cache: 'no-store',
  });
}

export async function getGestures(): Promise<GestureDTO[]> {
  const { serverFetch } = await import('./client.server');
  return serverFetch<GestureDTO[]>('/catalog/gestures', {
    revalidate: 3600, // 1 hour - gestures rarely change
    tags: ['gestures'],
  });
}
