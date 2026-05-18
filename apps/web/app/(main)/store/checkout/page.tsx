'use client';

import { ArrowLeft, Check, Shield, Lock } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import {
  PaymentMethodSelector,
  BonusApplicator,
  PaymentStatusPolling,
} from '@/components/payment';
import { CheckoutStepIndicator } from '@/components/store';

const ShippingAddressForm = dynamic(
  () => import('@/components/store/shipping-address-form').then((m) => ({ default: m.ShippingAddressForm })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-mp-surface rounded" />
        <div className="h-10 bg-mp-surface rounded" />
        <div className="h-10 bg-mp-surface rounded" />
        <div className="h-10 bg-mp-surface rounded" />
      </div>
    ),
  }
);
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Container } from '@/components/ui/container';
import { useCart, useCreateOrder, usePayOrder } from '@/hooks/use-store';
import { useBonusBalance, useMaxApplicable } from '@/hooks/use-bonus';
import { handlePaymentRedirect } from '@/hooks';
import { useAuthStore } from '@/stores/auth.store';
import { useCheckoutStore } from '@/stores/checkout.store';
import type { ShippingAddressDto } from '@/types/store.types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price);
}

export default function StoreCheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuthStore();

  const {
    shippingAddress,
    paymentMethod,
    bonusAmount,
    checkoutStep,
    orderId,
    orderTotal,
    transactionId,
    setShippingAddress,
    setPaymentMethod,
    setBonusAmount,
    setCheckoutStep,
    setOrderId,
    setOrderTotal,
    setTransactionId,
    prevStep,
    resetCheckout,
  } = useCheckoutStore();

  const { data: cart, isLoading: isCartLoading } = useCart();
  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: payOrder, isPending: isPaying } = usePayOrder();

  // Bonus data
  const cartTotal = cart?.totalAmount ?? 0;
  const checkoutTotal = orderId ? orderTotal : cartTotal;
  const { data: bonusData, isLoading: isBonusLoading } = useBonusBalance();
  const { data: maxApplicableData } = useMaxApplicable(checkoutTotal);
  const bonusBalance = bonusData?.balance ?? 0;
  const maxApplicable = maxApplicableData?.maxAmount ?? 0;
  const amountToPay = Math.max(0, checkoutTotal - bonusAmount);
  const isFullyCoveredByBonus = bonusAmount >= checkoutTotal && checkoutTotal > 0;

  // Auth & cart guard
  React.useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login?returnUrl=/store/checkout');
    }
  }, [isAuthenticated, isHydrated, router]);

  React.useEffect(() => {
    if (!isCartLoading && cart && cart.items.length === 0 && !orderId && checkoutStep !== 'complete') {
      router.push('/store');
    }
  }, [cart, isCartLoading, checkoutStep, orderId, router]);

  React.useEffect(() => {
    if (checkoutStep === 'processing' && !transactionId) {
      setCheckoutStep(orderId ? 'payment' : 'shipping');
    }
  }, [checkoutStep, orderId, setCheckoutStep, transactionId]);

  if (!isHydrated || !isAuthenticated) return null;

  const items = cart?.items ?? [];

  const handleShippingSubmit = async (address: ShippingAddressDto) => {
    try {
      setShippingAddress(address);

      const order = await createOrder({
        shippingAddress: address,
      });

      setOrderId(order.id);
      setOrderTotal(order.totalAmount);
      setPaymentMethod(null);
      setCheckoutStep('payment');
    } catch {
      toast.error('Не удалось создать заказ');
    }
  };

  const handleStartPayment = async () => {
    if (!orderId) return;
    if (!isFullyCoveredByBonus && !paymentMethod) {
      toast.error('Выберите способ оплаты');
      return;
    }

    try {
      setCheckoutStep('processing');

      const result = await payOrder({
        orderId,
        data: {
          paymentMethod: paymentMethod ?? 'CARD',
          bonusAmount: bonusAmount > 0 ? bonusAmount : undefined,
          returnUrl: `${window.location.origin}/payment/callback`,
        },
      });

      setOrderId(result.orderId);
      setTransactionId(result.transactionId);

      if (result.status === 'COMPLETED') {
        setCheckoutStep('complete');
      } else {
        const redirectResult = handlePaymentRedirect(result);
        if (!redirectResult) {
          setCheckoutStep('complete');
        }
      }
    } catch {
      setCheckoutStep('payment');
      toast.error('Не удалось запустить оплату');
    }
  };

  const handleCancelCheckout = () => {
    resetCheckout();
    router.push('/store/cart');
  };

  return (
    <Container size="lg" className="py-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/store/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к корзине
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-mp-text-primary">Оформление заказа</h1>
      </div>

      {/* Step indicator */}
      <CheckoutStepIndicator currentStep={checkoutStep} className="mb-8" />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step 1: Shipping */}
          {checkoutStep === 'shipping' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Адрес доставки</CardTitle>
              </CardHeader>
              <CardContent>
                <ShippingAddressForm
                  defaultValues={shippingAddress}
                  onSubmit={handleShippingSubmit}
                  submitLabel="Продолжить к оплате"
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Payment */}
          {checkoutStep === 'payment' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Заказ готов к оплате</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-mp-text-secondary">
                  <p>
                    {orderId
                      ? `Номер заказа: ${orderId.slice(0, 8)}...`
                      : 'Заказ будет создан после заполнения данных.'}
                  </p>
                  <p>Выберите способ оплаты и подтвердите запуск платежа.</p>
                </CardContent>
              </Card>

              {/* Bonus applicator */}
              {!isBonusLoading && bonusBalance > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Использовать бонусы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BonusApplicator
                      availableBalance={bonusBalance}
                      maxApplicable={maxApplicable}
                      appliedAmount={bonusAmount}
                      onApply={setBonusAmount}
                      orderTotal={checkoutTotal}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Payment method */}
              {!isFullyCoveredByBonus && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Способ оплаты</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentMethodSelector
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={prevStep}>
                  Назад
                </Button>
                <Button
                  variant="gradient"
                  className="flex-1"
                  onClick={handleStartPayment}
                  disabled={isPaying || !orderId || (!isFullyCoveredByBonus && !paymentMethod)}
                >
                  {isPaying ? 'Запускаем оплату...' : isFullyCoveredByBonus ? 'Оформить бесплатно' : 'Оплатить'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {checkoutStep === 'processing' && (
            <Card className="py-12 text-center">
              <CardContent>
                <PaymentStatusPolling
                  status="PENDING"
                  isPolling
                  className="mx-auto max-w-sm"
                />
              </CardContent>
            </Card>
          )}

          {/* Step 5: Complete */}
          {checkoutStep === 'complete' && (
            <Card className="py-12 text-center">
              <CardContent>
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-mp-success-bg">
                  <Check className="h-10 w-10 text-mp-success-text" />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-mp-text-primary">
                  Заказ оформлен!
                </h2>
                <p className="mb-6 text-mp-text-secondary">
                  {orderId ? `Номер заказа: ${orderId.slice(0, 8)}...` : 'Спасибо за покупку!'}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button variant="gradient" asChild onClick={() => resetCheckout()}>
                    <Link href="/store/orders">Перейти к заказам</Link>
                  </Button>
                  <Button variant="outline" asChild onClick={() => resetCheckout()}>
                    <Link href="/store">Продолжить покупки</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order summary sidebar */}
        {checkoutStep !== 'complete' && (
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ваш заказ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="divide-y divide-mp-border">
                    {items.slice(0, 3).map((item) => (
                      <div key={item.productId} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-mp-text-secondary truncate mr-2">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="text-mp-text-primary font-medium shrink-0">
                          {formatPrice(item.totalPrice)} ₽
                        </span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="py-2 text-sm text-mp-text-disabled">
                        и ещё {items.length - 3} товаров...
                      </div>
                    )}
                  </div>

                  <div className="border-t border-mp-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-mp-text-secondary">Товары</span>
                      <span className="text-mp-text-primary">{formatPrice(checkoutTotal)} ₽</span>
                    </div>
                    {bonusAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-mp-accent-secondary">Бонусы</span>
                        <span className="text-mp-accent-secondary">−{formatPrice(bonusAmount)} ₽</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-semibold pt-2 border-t border-mp-border">
                      <span className="text-mp-text-primary">Итого</span>
                      <span className="text-mp-text-primary">{formatPrice(amountToPay)} ₽</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Security badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-mp-surface/50 p-3">
                  <Shield className="h-5 w-5 text-mp-accent-secondary" />
                  <div>
                    <p className="text-sm font-medium text-mp-text-primary">Безопасная оплата</p>
                    <p className="text-xs text-mp-text-secondary">256-bit SSL шифрование</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-mp-surface/50 p-3">
                  <Lock className="h-5 w-5 text-mp-accent-secondary" />
                  <div>
                    <p className="text-sm font-medium text-mp-text-primary">Защита данных</p>
                    <p className="text-xs text-mp-text-secondary">Мы не храним данные карт</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
