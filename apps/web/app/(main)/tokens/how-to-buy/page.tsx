'use client';

import {
  CheckCircle,
  Coins,
  CreditCard,
  ListChecks,
  Package,
  Receipt,
  ShieldCheck,
} from '@phosphor-icons/react';

import {
  FinancialCTAGroup,
  FinancialFAQ,
  FinancialInfoHero,
  FinancialInfoPageShell,
  FinancialNoticeCard,
  FinancialProcessPreview,
  FinancialStepsTimeline,
  FutureFeatureBadge,
  type FinancialStep,
} from '@/components/finance';

const tokenPurchaseSteps: FinancialStep[] = [
  {
    title: 'Выберите пакет',
    description:
      'Пакеты токенов должны отображаться из финансового модуля, без локально захардкоженных цен.',
    icon: Package,
  },
  {
    title: 'Выберите способ оплаты',
    description:
      'Карта, СБП, банковский перевод или другой метод подключаются через платежный слой.',
    icon: CreditCard,
  },
  {
    title: 'Подтвердите покупку',
    description:
      'Экран подтверждения покажет пакет, сумму, способ оплаты и условия зачисления.',
    icon: ShieldCheck,
  },
  {
    title: 'Завершите оплату',
    description:
      'Пользователь перейдет к платежному провайдеру или увидит инструкции для выбранного метода.',
    icon: Receipt,
  },
  {
    title: 'Получите токены',
    description:
      'После успешной оплаты токены будут зачислены на баланс через серверную обработку.',
    icon: Coins,
  },
  {
    title: 'Отслеживайте статус',
    description:
      'Статус оплаты должен быть доступен в кошельке, истории операций и на странице платежа.',
    icon: ListChecks,
  },
];

const tokenFaq = [
  {
    question: 'Можно ли купить токены сейчас?',
    answer:
      'Нет. Сейчас раздел подготовлен под будущий функционал и не инициирует реальные платежи.',
  },
  {
    question: 'Где должны жить пакеты токенов?',
    answer:
      'Пакеты лучше хранить и отдавать с backend, чтобы цены, валюты, акции и доступность не дублировались во frontend.',
  },
  {
    question: 'Как показывать незавершенный платеж?',
    answer:
      'Через общий экран статуса операции: ожидает оплаты, успешно, ошибка, отменено или требуется действие.',
  },
  {
    question: 'Можно ли использовать этот UI для подписок?',
    answer:
      'Да. Компоненты статуса, подтверждения и платежных методов можно переиспользовать, если не смешивать бизнес-логику.',
  },
];

export default function TokenHowToBuyPage() {
  return (
    <FinancialInfoPageShell>
      <FinancialInfoHero
        icon={Coins}
        eyebrow={<FutureFeatureBadge>Информационный раздел</FutureFeatureBadge>}
        title="Как будет работать покупка токенов"
        description="Страница задает будущий визуальный сценарий покупки токенов: выбор пакета, метод оплаты, подтверждение, платеж и отслеживание статуса."
      >
        <FinancialCTAGroup
          actions={[
            { href: '/account/wallet', label: 'Открыть кошелек' },
            { href: '/account/payments', label: 'История платежей', variant: 'outline' },
          ]}
        />
      </FinancialInfoHero>

      <FinancialNoticeCard
        title="Покупка токенов пока не подключена"
        description="На этой странице нет цен, пакетов и платежных действий. Они должны приходить из финансовой системы после backend-интеграции."
        tone="warning"
      />

      <FinancialStepsTimeline steps={tokenPurchaseSteps} />

      <FinancialProcessPreview
        title="Будущий платежный статус"
        description="Единый блок статуса поможет одинаково отображать оплату картой, СБП, переводом и возврат."
        items={[
          { label: 'Платеж', value: 'Ожидает оплаты' },
          { label: 'Пакет', value: 'Будет загружен из API' },
          { label: 'Зачисление', value: 'После подтверждения' },
        ]}
      />

      <FinancialNoticeCard
        title="Что важно сохранить при реализации"
        description="Frontend должен показывать серверное состояние платежа, а не рассчитывать итоговые суммы или доступность токенов самостоятельно."
        icon={CheckCircle}
        tone="success"
      />

      <FinancialFAQ items={tokenFaq} />
    </FinancialInfoPageShell>
  );
}
