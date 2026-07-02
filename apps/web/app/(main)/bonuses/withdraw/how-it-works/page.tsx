'use client';

import {
  Bank,
  CheckCircle,
  ClockCountdown,
  ClipboardText,
  CurrencyRub,
  ShieldCheck,
  Wallet,
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

const withdrawalSteps: FinancialStep[] = [
  {
    title: 'Проверьте бонусный баланс',
    description:
      'Перед заявкой убедитесь, что на балансе достаточно бонусов для минимальной суммы вывода.',
    icon: Wallet,
  },
  {
    title: 'Выберите способ вывода',
    description:
      'Финансовый модуль будет поддерживать подготовленные способы получения средств после подключения.',
    icon: Bank,
  },
  {
    title: 'Укажите сумму вывода',
    description:
      'Сумма, комиссии и ограничения будут рассчитываться по правилам бонусной программы.',
    icon: CurrencyRub,
  },
  {
    title: 'Подтвердите заявку',
    description:
      'Перед отправкой пользователь увидит итоговую сумму, реквизиты и условия обработки.',
    icon: ShieldCheck,
  },
  {
    title: 'Дождитесь обработки',
    description:
      'Статус заявки будет отображаться в истории финансовых операций и в карточке вывода.',
    icon: ClockCountdown,
  },
  {
    title: 'Получите средства или проверьте статус',
    description:
      'После обработки раздел покажет успешный перевод, отклонение или ожидающее действие.',
    icon: CheckCircle,
  },
];

const withdrawalFaq = [
  {
    question: 'Можно ли сейчас вывести бонусы с этой страницы?',
    answer:
      'Нет. Эта страница описывает будущий процесс и не запускает вывод средств без подключенного финансового модуля.',
  },
  {
    question: 'Где будет отображаться статус заявки?',
    answer:
      'Статусы вывода должны жить в кошельке, истории операций и на отдельной странице статуса конкретной заявки.',
  },
  {
    question: 'Нужна ли отдельная страница успешного вывода?',
    answer:
      'Да. Для будущего модуля стоит использовать общий шаблон статуса операции: успешно, ожидает обработки или не выполнено.',
  },
  {
    question: 'Будут ли реквизиты храниться здесь?',
    answer:
      'Нет. Эта страница только объясняет процесс. Реквизиты должны вводиться и подтверждаться внутри защищенного flow.',
  },
];

export default function BonusWithdrawalHowItWorksPage() {
  return (
    <FinancialInfoPageShell>
      <FinancialInfoHero
        icon={Wallet}
        eyebrow={<FutureFeatureBadge>Информационный раздел</FutureFeatureBadge>}
        title="Как будет работать вывод бонусов"
        description="Премиальный сценарий вывода бонусов подготовлен как понятный пошаговый flow. Финансовая логика, реальные заявки и платежные операции будут подключены отдельно."
      >
        <FinancialCTAGroup
          actions={[
            { href: '/bonuses', label: 'К бонусам' },
            { href: '/account/wallet', label: 'Открыть кошелек', variant: 'outline' },
          ]}
        />
      </FinancialInfoHero>

      <FinancialNoticeCard
        title="Функция будет доступна после подключения финансового модуля"
        description="Страница не создает заявки, не проверяет реквизиты и не выполняет перевод. Она фиксирует будущую архитектуру пользовательского сценария."
        tone="warning"
      />

      <FinancialStepsTimeline steps={withdrawalSteps} />

      <FinancialProcessPreview
        title="Будущий статус заявки"
        description="Один визуальный паттерн подойдет для вывода, покупки, возврата и ожидания платежа."
        items={[
          { label: 'Статус', value: 'Ожидает обработки' },
          { label: 'Операция', value: 'Вывод бонусов' },
          { label: 'Детали', value: 'Сумма, метод, дата' },
        ]}
      />

      <FinancialNoticeCard
        title="Что понадобится при интеграции"
        description="Нужны защищенная форма суммы, выбор метода, экран подтверждения, страница статуса, история операций и серверная проверка лимитов."
        icon={ClipboardText}
        tone="info"
      />

      <FinancialFAQ items={withdrawalFaq} />
    </FinancialInfoPageShell>
  );
}
