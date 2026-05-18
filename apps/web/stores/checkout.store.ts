import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PaymentMethodType } from '@/types';
import type { ShippingAddressDto } from '@/types/store.types';

type CheckoutStep = 'shipping' | 'payment' | 'processing' | 'complete';

interface CheckoutState {
  shippingAddress: ShippingAddressDto | null;
  paymentMethod: PaymentMethodType | null;
  bonusAmount: number;
  checkoutStep: CheckoutStep;
  orderId: string | null;
  orderTotal: number;
  transactionId: string | null;
  error: string | null;

  setShippingAddress: (address: ShippingAddressDto) => void;
  setPaymentMethod: (method: PaymentMethodType | null) => void;
  setBonusAmount: (amount: number) => void;
  setCheckoutStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setOrderId: (id: string | null) => void;
  setOrderTotal: (total: number) => void;
  setTransactionId: (id: string | null) => void;
  setError: (error: string | null) => void;
  resetCheckout: () => void;
}

const STEP_ORDER: CheckoutStep[] = ['shipping', 'payment', 'processing', 'complete'];

const DEFAULT_STATE = {
  shippingAddress: null,
  paymentMethod: null,
  bonusAmount: 0,
  checkoutStep: 'shipping' as CheckoutStep,
  orderId: null,
  orderTotal: 0,
  transactionId: null,
  error: null,
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setShippingAddress: (address) =>
        set({ shippingAddress: address, error: null }),

      setPaymentMethod: (method) =>
        set({ paymentMethod: method, error: null }),

      setBonusAmount: (amount) =>
        set({ bonusAmount: Math.max(0, amount), error: null }),

      setCheckoutStep: (step) =>
        set({ checkoutStep: step, error: null }),

      nextStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().checkoutStep);
        if (currentIndex < STEP_ORDER.length - 1) {
          set({ checkoutStep: STEP_ORDER[currentIndex + 1], error: null });
        }
      },

      prevStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().checkoutStep);
        if (currentIndex > 0) {
          set({ checkoutStep: STEP_ORDER[currentIndex - 1], error: null });
        }
      },

      setOrderId: (id) => set({ orderId: id }),
      setOrderTotal: (total) => set({ orderTotal: Math.max(0, total) }),
      setTransactionId: (id) => set({ transactionId: id }),
      setError: (error) => set({ error }),

      resetCheckout: () => set(DEFAULT_STATE),
    }),
    {
      name: 'mp-store-checkout',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        shippingAddress: state.shippingAddress,
        paymentMethod: state.paymentMethod,
        bonusAmount: state.bonusAmount,
        checkoutStep: state.checkoutStep,
        orderId: state.orderId,
        orderTotal: state.orderTotal,
        transactionId: state.transactionId,
      }),
    },
  ),
);

export const checkoutSelectors = {
  getAmountToPay: (state: CheckoutState) => (cartTotal: number) => {
    return Math.max(0, cartTotal - state.bonusAmount);
  },

  canProceedToNext: (state: CheckoutState) => {
    switch (state.checkoutStep) {
      case 'shipping':
        return !!state.shippingAddress;
      case 'payment':
        return !!state.paymentMethod;
      default:
        return false;
    }
  },
};
