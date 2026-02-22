'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { ProductDTO, PaginatedResponse, GestureDTO } from '@/types/dtos';
import { Skeleton } from '@/components/ui/Skeleton';
import { CatalogControlsBar } from './CatalogControlsBar';
import styles from './CatalogClient.module.css';

interface CatalogClientProps {
  initialData: PaginatedResponse<ProductDTO>;
  gestures: GestureDTO[];
}

async function fetchProducts(params: URLSearchParams): Promise<PaginatedResponse<ProductDTO>> {
  const res = await fetch(`/api/products?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

function sortProducts(products: ProductDTO[], sortBy: string): ProductDTO[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price.amount - b.price.amount);
    case 'price_desc':
      return sorted.sort((a, b) => b.price.amount - a.price.amount);
    case 'name_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'fr'));
    case 'name_desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title, 'fr'));
    case 'default':
    default:
      return sorted;
  }
}

export function CatalogClient({ initialData, gestures }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'default',
    geste: searchParams.get('geste') || '',
    page: Number(searchParams.get('page')) || 1,
  });

  // Sync URL changes back to state (e.g., when gesture filter changes URL)
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'default',
      geste: searchParams.get('geste') || '',
      page: Number(searchParams.get('page')) || 1,
    });
  }, [searchParams]);

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['products', filters.search, filters.geste, filters.page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.geste) params.set('gesture', filters.geste);
      params.set('page', String(filters.page));
      params.set('limit', '12');
      return fetchProducts(params);
    },
    initialData,
    placeholderData: (prev) => prev,
    staleTime: 60000,
  });

  // Apply client-side sorting
  const sortedProducts = useMemo(() => {
    if (!data?.data) return [];
    return sortProducts(data.data, filters.sort);
  }, [data?.data, filters.sort]);

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters, page: 1 };
    setFilters(updated);

    const params = new URLSearchParams();
    if (updated.search) params.set('search', updated.search);
    if (updated.sort && updated.sort !== 'default') params.set('sort', updated.sort);
    if (updated.geste) params.set('geste', updated.geste);
    if (updated.page > 1) params.set('page', String(updated.page));

    router.push(`/objets?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));

    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    router.push(`/objets?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Unified Controls Bar (Sticky) - Gesture Filters + Search + Sort */}
      <CatalogControlsBar
        gestures={gestures}
        sortValue={filters.sort}
        searchValue={filters.search}
        onSearchChange={(value) => updateFilters({ search: value })}
        onSortChange={(value) => updateFilters({ sort: value })}
      />

      <div className={styles.container}>
        {/* Results Count */}
        <div className={styles.resultsBar}>
          <p className={styles.count}>
            {data.pagination.total} {data.pagination.total > 1 ? 'objets' : 'objet'}
          </p>
        </div>

        {/* Grid */}
        <div className={styles.grid} style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className={styles.card}>
                <Skeleton width="100%" height="280px" />
                <div className={styles.cardContent}>
                  <Skeleton width="60%" height="16px" />
                  <Skeleton width="90%" height="24px" />
                  <Skeleton width="40%" height="20px" />
                </div>
              </div>
            ))
          ) : (
            sortedProducts.map((product) => (
              <Link key={product.id} href={`/objets/${product.slug}`} className={styles.card}>
                <div className={styles.cardImage}>
                  <Image
                    src={product.coverImage.url}
                    alt={product.coverImage.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 370px"
                    className={styles.image}
                  />
                  {!product.availability.inStock && (
                    <div className={styles.badge}>Épuisé</div>
                  )}
                </div>
                <div className={styles.cardContent}>
                  {product.gesture && (
                    <span className={styles.gesture}>{product.gesture.name}</span>
                  )}
                  <h3 className={styles.cardTitle}>{product.title}</h3>
                  <p className={styles.price}>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: product.price.currency,
                    }).format(product.price.amount)}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination */}
        {data.pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(filters.page - 1)}
              disabled={filters.page === 1 || isPlaceholderData}
              className={styles.paginationButton}
            >
              Précédent
            </button>
            <span className={styles.paginationInfo}>
              Page {filters.page} sur {data.pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(filters.page + 1)}
              disabled={filters.page === data.pagination.totalPages || isPlaceholderData}
              className={styles.paginationButton}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </>
  );
}
