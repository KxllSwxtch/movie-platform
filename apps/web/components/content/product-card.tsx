'use client';

import { Bag, Package } from '@phosphor-icons/react';
import Link from 'next/link';

import { ContentImage } from '@/components/content/content-image';
import { cn } from '@/lib/utils';
import { ProductStatus } from '@movie-platform/shared';

export interface ProductContent {
  id: string;
  slug: string;
  name: string;
  thumbnailUrl?: string;
  price: number;
  bonusPrice?: number;
  status: ProductStatus;
}

interface ProductCardProps {
  content: ProductContent;
  onAddToCart?: (productId: string) => void;
  isAddingToCart?: boolean;
  className?: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price);
}

/**
 * Product card for the store section
 * Features: hover zoom, price display, stock status badge, bonus price
 */
export function ProductCard({ content, onAddToCart, isAddingToCart, className }: ProductCardProps) {
  const isAvailable = content.status === ProductStatus.ACTIVE;

  const handleAddToCart = () => {
    if (onAddToCart && isAvailable) {
      onAddToCart(content.id);
    }
  };

  return (
    <article
      className={cn(
        'sesh-store-card group block w-full shrink-0 rounded-2xl border border-white/10 bg-[#0d0718]/78 p-3 shadow-[0_14px_38px_rgba(0,0,0,0.24)] transition-[border-color,box-shadow] focus-within:border-[#55b7ff]/55 focus-within:shadow-[0_0_0_2px_rgba(85,183,255,0.16),0_16px_42px_rgba(0,0,0,0.28)]',
        !isAvailable && 'opacity-60',
        className
      )}
    >
      {/* Thumbnail container */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-mp-surface-2 mb-3">
        <Link href={`/store/${content.slug}`} className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#55b7ff]" aria-label={content.name} />
        {/* Image with smooth zoom */}
        <ContentImage
          src={content.thumbnailUrl ?? ''}
          alt={content.name}
          fill
          className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          fallbackIcon={<Package className="w-12 h-12 text-mp-text-disabled" />}
        />

        {/* Stock status badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded backdrop-blur-sm',
              isAvailable
                ? 'bg-mp-success-bg/80 text-mp-success-text'
                : 'bg-mp-error-bg/80 text-mp-error-text'
            )}
          >
            {isAvailable ? 'В наличии' : 'Нет в наличии'}
          </span>
        </div>

        {/* Gradient overlay from bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent touch:opacity-60 opacity-0 hover-hover:group-hover:opacity-100 transition-opacity duration-300" />

        {/* Cart icon that scales in */}
        <button
          type="button"
          aria-label={isAvailable ? `Добавить ${content.name} в корзину` : 'Нет в наличии'}
          disabled={!isAvailable || isAddingToCart}
          className="absolute inset-0 z-20 flex scale-90 items-center justify-center opacity-0 transition-all duration-200 touch:scale-100 touch:opacity-80 hover-hover:group-hover:scale-100 hover-hover:group-hover:opacity-100 focus-visible:scale-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#55b7ff] disabled:pointer-events-none"
          onClick={handleAddToCart}
        >
          <div className={cn(
            'w-14 h-14 touch:w-11 touch:h-11 rounded-full bg-mp-accent-primary/90 backdrop-blur-sm flex items-center justify-center shadow-glow-primary',
            isAddingToCart && 'opacity-60',
          )}>
            <Bag className={cn('w-6 h-6 touch:w-5 touch:h-5 text-white', isAddingToCart && 'animate-pulse')} />
          </div>
        </button>
      </div>

      {/* Content info */}
      <div>
        <Link href={`/store/${content.slug}`} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55b7ff]">
          <h3 className="truncate font-medium text-mp-text-primary transition-colors duration-200 group-hover:text-mp-accent-primary">{content.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-base font-semibold text-mp-text-primary">
            {formatPrice(content.price)} ₽
          </span>
          {content.bonusPrice != null && content.bonusPrice > 0 && (
            <span className="text-sm text-mp-accent-secondary font-medium">
              или {formatPrice(content.bonusPrice)} бонусов
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
