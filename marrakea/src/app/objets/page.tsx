import type { Metadata } from 'next';
import { getProducts, getGestures } from '@/lib/api/products';
import { SITE_NAME } from '@/lib/utils/constants';
import { CatalogClient } from '@/components/features/catalog/CatalogClient';

export const metadata: Metadata = {
  title: 'Objets',
  description:
    'Découvrez notre sélection d\'objets artisanaux marocains. Chaque pièce est documentée, tracée et authentifiée.',
  openGraph: {
    title: `Objets — ${SITE_NAME}`,
    description:
      'Découvrez notre sélection d\'objets artisanaux marocains. Chaque pièce est documentée, tracée et authentifiée.',
  },
};

interface CatalogPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  // Extract and normalize searchParams
  const geste = typeof searchParams.geste === 'string' ? searchParams.geste : undefined;
  const search = typeof searchParams.search === 'string' ? searchParams.search : undefined;
  const page = typeof searchParams.page === 'string' ? Number(searchParams.page) : 1;

  // SSR initial data with filters applied
  const initialData = await getProducts({
    page,
    limit: 12,
    gesture: geste, // Map 'geste' URL param to 'gesture' API param
    search,
  });
  const gestures = await getGestures();

  return <CatalogClient initialData={initialData} gestures={gestures} />;
}
