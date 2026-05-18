'use client';

import { Copy, Check, Link as LinkIcon } from '@phosphor-icons/react';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildAbsoluteAppUrl, cn, copyTextToClipboard } from '@/lib/utils';

interface ReferralLinkDisplayProps {
  referralCode: string;
  referralUrl: string;
  className?: string;
}

export function ReferralLinkDisplay({
  referralCode,
  referralUrl,
  className,
}: ReferralLinkDisplayProps) {
  const [copied, setCopied] = React.useState<'code' | 'url' | null>(null);
  const absoluteReferralUrl = React.useMemo(
    () => buildAbsoluteAppUrl(referralUrl),
    [referralUrl],
  );

  const copyToClipboard = React.useCallback(async (text: string, type: 'code' | 'url') => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(type);
      toast.success(type === 'code' ? 'Реферальный код скопирован' : 'Ссылка скопирована');
      setTimeout(() => setCopied(null), 2000);
    } else {
      toast.error('Не удалось скопировать. Выделите текст вручную.');
    }
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Referral Code */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-mp-text-secondary">
          Реферальный код
        </label>
        <div className="flex gap-2">
          <Input
            value={referralCode}
            readOnly
            className="font-mono text-lg font-bold tracking-wider"
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Скопировать реферальный код"
            data-testid="copy-referral-code"
            onClick={() => copyToClipboard(referralCode, 'code')}
          >
            {copied === 'code' ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Referral URL */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-mp-text-secondary">
          Реферальная ссылка
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mp-text-disabled" />
            <Input
              value={absoluteReferralUrl}
              readOnly
              className="pl-10 text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Скопировать реферальную ссылку"
            data-testid="copy-referral-url"
            onClick={() => copyToClipboard(absoluteReferralUrl, 'url')}
          >
            {copied === 'url' ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for small spaces
 */
interface ReferralLinkCompactProps {
  referralUrl: string;
  className?: string;
}

export function ReferralLinkCompact({
  referralUrl,
  className,
}: ReferralLinkCompactProps) {
  const [copied, setCopied] = React.useState(false);
  const absoluteReferralUrl = React.useMemo(
    () => buildAbsoluteAppUrl(referralUrl),
    [referralUrl],
  );

  const copyToClipboard = React.useCallback(async () => {
    const ok = await copyTextToClipboard(absoluteReferralUrl);
    if (ok) {
      setCopied(true);
      toast.success('Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Не удалось скопировать. Выделите ссылку вручную.');
    }
  }, [absoluteReferralUrl]);

  return (
    <Button
      variant="outline"
      className={cn('gap-2', className)}
      data-testid="copy-invite-link"
      onClick={copyToClipboard}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" />
          Скопировано!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Копировать ссылку
        </>
      )}
    </Button>
  );
}
