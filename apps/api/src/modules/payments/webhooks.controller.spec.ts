import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { WebhooksController } from './webhooks.controller';

describe('WebhooksController', () => {
  function createController(secret = 'bank-secret', nodeEnv = 'test') {
    const paymentsService = {
      completePaymentById: jest.fn().mockResolvedValue(undefined),
    };
    const config = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'BANK_TRANSFER_WEBHOOK_SECRET') return secret;
        if (key === 'ADMIN_SECRET') return '';
        if (key === 'NODE_ENV') return nodeEnv;
        return defaultValue;
      }),
    };

    return {
      controller: new WebhooksController(
        paymentsService as any,
        {} as any,
        {} as any,
        config as any,
      ),
      paymentsService,
    };
  }

  it('denies bank transfer webhook when secret header is missing', async () => {
    const { controller } = createController();

    await expect(
      controller.handleBankTransferWebhook({
        invoiceNumber: 'INV-1',
        amount: 100,
        transactionId: 'tx-1',
      }, ''),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('denies bank transfer webhook when secret is invalid', async () => {
    const { controller } = createController();

    await expect(
      controller.handleBankTransferWebhook({
        invoiceNumber: 'INV-1',
        amount: 100,
        transactionId: 'tx-1',
      }, 'wrong-secret'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('completes bank transfer webhook when secret is valid', async () => {
    const { controller, paymentsService } = createController();

    const result = await controller.handleBankTransferWebhook({
      invoiceNumber: 'INV-1',
      amount: 100,
      transactionId: 'tx-1',
    }, 'bank-secret');

    expect(result).toEqual({ success: true });
    expect(paymentsService.completePaymentById).toHaveBeenCalledWith('tx-1');
  });

  it('denies production bank transfer webhook when secret is not configured', async () => {
    const { controller } = createController('', 'production');

    await expect(
      controller.handleBankTransferWebhook({
        invoiceNumber: 'INV-1',
        amount: 100,
        transactionId: 'tx-1',
      }, ''),
    ).rejects.toThrow(ForbiddenException);
  });
});
