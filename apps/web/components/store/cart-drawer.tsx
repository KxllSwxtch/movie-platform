'use client';

import { Bag } from '@phosphor-icons/react';
import Link from 'next/link';
import * as React from 'react';

import { CartItemRow } from '@/components/store/cart-item-row';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useCart, useUpdateCartItem, useRemoveFromCart, useClearCart } from '@/hooks/use-store';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price);
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { data: cart, isLoading } = useCart();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateCartItem();
  const { mutate: removeItem } = useRemoveFromCart();
  const { mutate: clearCart } = useClearCart();

  const items = cart?.items ?? [];
  const isEmpty = items.length === 0;

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    updateItem({ productId, quantity });
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sesh-cart-drawer w-full sm:w-[430px] flex flex-col p-0"
      >
        <SheetHeader className="sesh-cart-drawer-header px-6 py-5">
          <SheetTitle className="text-mp-text-primary">
            Корзина {!isEmpty && `(${cart?.itemCount ?? 0})`}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="sesh-cart-spinner w-8 h-8 rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="sesh-cart-empty-icon w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Bag className="w-8 h-8 text-mp-text-disabled" />
            </div>
            <h3 className="text-base font-medium text-mp-text-primary mb-1">Корзина пуста</h3>
            <p className="text-sm text-mp-text-secondary mb-4">
              Добавьте товары из магазина
            </p>
            <Button className="sesh-cart-secondary-button" asChild onClick={() => onOpenChange(false)}>
              <Link href="/store">Перейти в магазин</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Items list */}
            <ScrollArea className="flex-1 px-5">
              <div className="sesh-cart-items">
                {items.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    isUpdating={isUpdating}
                    compact
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="sesh-cart-drawer-footer px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-mp-text-secondary">Итого</span>
                <span className="text-lg font-semibold text-mp-text-primary">
                  {formatPrice(cart?.totalAmount ?? 0)} ₽
                </span>
              </div>

              <Button className="sesh-cart-checkout-button w-full" asChild onClick={() => onOpenChange(false)}>
                <Link href="/store/checkout">Оформить заказ</Link>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="sesh-cart-clear-button w-full"
                onClick={() => clearCart()}
              >
                Очистить корзину
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
