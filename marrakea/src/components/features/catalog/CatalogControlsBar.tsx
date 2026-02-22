'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';
import type { GestureDTO } from '@/types/dtos';
import styles from './CatalogControlsBar.module.css';

interface CatalogControlsBarProps {
  gestures: GestureDTO[];
  sortValue: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

const sortOptions = [
  { value: 'default', label: 'Par défaut' },
  { value: 'price_asc', label: 'Prix : croissant' },
  { value: 'price_desc', label: 'Prix : décroissant' },
  { value: 'name_asc', label: 'Nom : A → Z' },
  { value: 'name_desc', label: 'Nom : Z → A' },
];

export function CatalogControlsBar({
  gestures,
  sortValue,
  searchValue,
  onSearchChange,
  onSortChange,
}: CatalogControlsBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGesture = searchParams.get('geste') || '';
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const handleGestureClick = (gestureSlug: string) => {
    const params = new URLSearchParams(searchParams);

    if (gestureSlug === '') {
      params.delete('geste');
    } else {
      params.set('geste', gestureSlug);
    }

    params.delete('page');
    router.push(`/objets?${params.toString()}`, { scroll: false });
  };

  const handleSortSelect = (value: string) => {
    onSortChange(value);
    setIsSortOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSortOpen]);

  return (
    <div className={styles.sticky}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <div className={styles.gestureSection}>
            <span className={styles.label}>Par geste</span>

            <div className={styles.buttons}>
              <button
                onClick={() => handleGestureClick('')}
                className={`${styles.button} ${currentGesture === '' ? styles.active : ''}`}
              >
                Tous les objets
              </button>

              {gestures.map((gesture) => (
                <button
                  key={gesture.id}
                  onClick={() => handleGestureClick(gesture.slug)}
                  className={`${styles.button} ${currentGesture === gesture.slug ? styles.active : ''}`}
                >
                  {gesture.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.rightControls}>
            <div className={styles.searchSection}>
              <input
                type="search"
                placeholder="Rechercher..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.sortSection} ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className={styles.sortButton}
                aria-label="Trier les produits"
                aria-expanded={isSortOpen}
              >
                <ArrowUpDown size={18} className={styles.sortIcon} />
              </button>

              {isSortOpen && (
                <div className={styles.sortDropdown}>
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortSelect(option.value)}
                      className={`${styles.sortOption} ${sortValue === option.value ? styles.sortOptionActive : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
