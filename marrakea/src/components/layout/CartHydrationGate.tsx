'use client';

import { useEffect, useState } from 'react';

/**
 * CartHydrationGate prevents hydration mismatch by ensuring
 * cart-dependent client components only render after hydration.
 * Uses invisible placeholder to prevent CLS.
 */
export function CartHydrationGate({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    // Invisible placeholder to reserve space and prevent CLS
    return <div style={{ width: '24px', height: '24px', visibility: 'hidden' }} aria-hidden="true" />;
  }

  return <>{children}</>;
}
