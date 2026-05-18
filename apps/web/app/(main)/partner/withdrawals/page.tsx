import { redirect } from 'next/navigation';

/**
 * Deprecated compatibility route.
 * Bonus withdrawals are the canonical flow:
 * /account/withdrawals -> /bonuses/withdraw -> /admin/bonuses/withdrawals.
 */
export default function LegacyPartnerWithdrawalsPage() {
  redirect('/account/withdrawals');
}
