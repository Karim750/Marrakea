'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/Button';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getTotal = useCartStore((state) => state.getTotal);

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    // Close drawer and navigate to cart page where Stripe checkout happens
    onClose();
    router.push('/panier');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} />
      <div ref={drawerRef} className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Panier</h2>
          <button onClick={onClose} className={styles.closeButton} aria-label="Fermer">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>Votre panier est vide</p>
            <Button as={Link} href="/objets" onClick={onClose} variant="primary">
              Découvrir le catalogue
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.productId} className={styles.item}>
                  <Link
                    href={`/objets/${item.slug}`}
                    className={styles.itemImage}
                    onClick={onClose}
                  >
                    <Image
                      src={item.coverImage.url}
                      alt={item.coverImage.alt}
                      fill
                      sizes="80px"
                      className={styles.image}
                    />
                  </Link>

                  <div className={styles.itemInfo}>
                    <Link
                      href={`/objets/${item.slug}`}
                      className={styles.itemTitle}
                      onClick={onClose}
                    >
                      {item.title}
                    </Link>
                    <p className={styles.itemPrice}>
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: item.price.currency,
                      }).format(item.price.amount)}
                    </p>

                    <div className={styles.itemActions}>
                      {item.purchaseMode === 'quantity' ? (
                        <div className={styles.quantityControls}>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className={styles.quantityButton}
                            aria-label="Diminuer quantité"
                          >
                            −
                          </button>
                          <span className={styles.quantity}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className={styles.quantityButton}
                            disabled={
                              item.maxQuantity !== undefined && item.quantity >= item.maxQuantity
                            }
                            aria-label="Augmenter quantité"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className={styles.uniqueBadge}>Pièce unique</span>
                      )}

                      <button
                        onClick={() => removeItem(item.productId)}
                        className={styles.removeButton}
                        aria-label="Retirer du panier"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.total}>
                <span className={styles.totalLabel}>Total (indicatif)</span>
                <span className={styles.totalAmount}>{getTotal()}</span>
              </div>

              <Button onClick={handleCheckout} variant="primary" fullWidth>
                Payer
              </Button>

              <p className={styles.note}>
                Le montant final sera calculé par notre système de paiement sécurisé.
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
