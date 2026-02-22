import type { Metadata } from 'next';
import { TitleBlock } from '@/components/features/home/TitleBlock';
import { ObjectsSection } from '@/components/features/home/ObjectsSection';
import { ImageBand } from '@/components/features/home/ImageBand';
import { MethodSection } from '@/components/features/home/MethodSection';
import { GesturesSection } from '@/components/features/home/GesturesSection';
import { TrustSection } from '@/components/features/home/TrustSection';
import { JsonLd, generateOrganizationJsonLd } from '@/lib/utils/seo';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/utils/constants';
import { getGestures } from '@/lib/api/products';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Artisanat marocain. Sélectionné, documenté, transmis.`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — Artisanat marocain. Sélectionné, documenté, transmis.`,
    description: SITE_DESCRIPTION,
  },
};

export default async function HomePage() {
  const gestures = await getGestures();

  return (
    <>
      <JsonLd data={generateOrganizationJsonLd()} />

      <TitleBlock />
      <ObjectsSection />
      <ImageBand />
      <MethodSection />
      <GesturesSection gestures={gestures} />
      <TrustSection />
    </>
  );
}
