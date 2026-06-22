'use client';

import { CreditCard, QrCode, BuildingOffice, Check } from '@phosphor-icons/react';
import * as React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PaymentMethodType } from '@/types';

interface PaymentMethodOption {
  type: PaymentMethodType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    type: 'CARD',
    name: 'Банковская карта',
    description: 'Visa, Mastercard, МИР через YooKassa',
    icon: CreditCard,
    recommended: true,
  },
  {
    type: 'SBP',
    name: 'СБП',
    description: 'Оплата по QR-коду через приложение банка',
    icon: QrCode,
  },
  {
    type: 'BANK_TRANSFER',
    name: 'Банковский перевод',
    description: 'Оплата по реквизитам для юридических лиц',
    icon: BuildingOffice,
  },
];

const isTestPaymentsEnabled =
  process.env.NEXT_PUBLIC_ENABLE_TEST_PAYMENTS === 'true' &&
  (process.env.NEXT_PUBLIC_APP_ENV
    ? process.env.NEXT_PUBLIC_APP_ENV !== 'production'
    : process.env.NODE_ENV !== 'production');

const AVAILABLE_PAYMENT_METHODS: PaymentMethodOption[] = isTestPaymentsEnabled
  ? [
      ...PAYMENT_METHODS,
      {
        type: 'TEST',
        name: 'Тестовая оплата',
        description: 'Мгновенно имитирует успешный платёж для проверки песочницы',
        icon: CreditCard,
      },
    ]
  : PAYMENT_METHODS;

interface PaymentMethodSelectorProps {
  selected: PaymentMethodType | null;
  onSelect: (method: PaymentMethodType) => void;
  disabled?: boolean;
  className?: string;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  disabled = false,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm font-medium text-mp-text-primary">
        Способ оплаты
      </Label>

      <div className="space-y-2">
        {AVAILABLE_PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.type;

          return (
            <button
              key={method.type}
              type="button"
              onClick={() => !disabled && onSelect(method.type)}
              disabled={disabled}
              className={cn(
                'group relative w-full rounded-lg border p-4 text-left transition-all',
                'focus:outline-none focus:ring-2 focus:ring-[#d5203a]/45 focus:ring-offset-0',
                isSelected
                  ? 'border-[#d5203a]/55 bg-[#8f101f]/12 shadow-[0_0_16px_rgba(213,32,58,0.1)]'
                  : 'border-mp-border hover:border-mp-border/80 hover:bg-mp-surface',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {/* Recommended badge */}
              {method.recommended && (
                <span className="absolute -top-2 right-3 rounded-full bg-[#b91428] px-2 py-0.5 text-[10px] font-medium text-white shadow-[0_0_10px_rgba(213,32,58,0.22)]">
                  Рекомендуем
                </span>
              )}

              <div className="flex items-start gap-4">
                {/* Selection indicator */}
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected
                      ? 'border-[#d5203a] bg-[#b91428]'
                      : 'border-mp-border group-hover:border-mp-text-secondary'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>

                {/* Icon */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isSelected
                      ? 'bg-[#8f101f]/24 text-[#ff6a78]'
                      : 'bg-mp-surface text-mp-text-secondary group-hover:text-mp-text-primary'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <span
                    className={cn(
                      'block font-medium transition-colors',
                      isSelected ? 'text-mp-text-primary' : 'text-mp-text-primary'
                    )}
                  >
                    {method.name}
                  </span>
                  <span className="block text-sm text-mp-text-secondary">
                    {method.description}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact version for smaller spaces
 */
interface PaymentMethodSelectorCompactProps {
  selected: PaymentMethodType | null;
  onSelect: (method: PaymentMethodType) => void;
  disabled?: boolean;
  className?: string;
}

export function PaymentMethodSelectorCompact({
  selected,
  onSelect,
  disabled = false,
  className,
}: PaymentMethodSelectorCompactProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {AVAILABLE_PAYMENT_METHODS.map((method) => {
        const Icon = method.icon;
        const isSelected = selected === method.type;

        return (
          <button
            key={method.type}
            type="button"
            onClick={() => !disabled && onSelect(method.type)}
            disabled={disabled}
            className={cn(
              'flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 transition-all',
              'focus:outline-none focus:ring-2 focus:ring-[#d5203a]/45',
              isSelected
                ? 'border-[#d5203a]/55 bg-[#8f101f]/14 shadow-[0_0_14px_rgba(213,32,58,0.1)]'
                : 'border-mp-border hover:border-mp-border/80 hover:bg-mp-surface/50',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                isSelected ? 'text-[#ff6a78]' : 'text-mp-text-secondary'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium',
                isSelected ? 'text-mp-text-primary' : 'text-mp-text-secondary'
              )}
            >
              {method.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
