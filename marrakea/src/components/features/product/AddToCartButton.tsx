'use client';

import { useState } from 'react';
import type { ProductDetailDTO } from '@/types/dtos';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/Button';
import styles from './AddToCartButton.module.css';

interface AddToCartButtonProps {
  product: ProductDetailDTO;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = () => {
    addItem({
      productId: product.medusaProductId, // Use Medusa product ID, not Strapi ID
      title: product.title,
      slug: product.slug,
      price: product.price,
      coverImage: product.coverImage,
      purchaseMode: product.availability.purchaseMode,
      maxQuantity: product.availability.maxQuantity,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (!product.availability.inStock) {
    return (
      <Button disabled fullWidth>
        Épuisé
      </Button>
    );
  }

  return (
    <div className={styles.container}>
      <Button onClick={handleAddToCart} variant="primary" fullWidth>
        {isAdded ? '✓ Ajouté au panier' : 'Ajouter au panier'}
      </Button>

      {product.availability.purchaseMode === 'unique' && (
        <p className={styles.note}>Pièce unique</p>
      )}
    </div>
  );
}
