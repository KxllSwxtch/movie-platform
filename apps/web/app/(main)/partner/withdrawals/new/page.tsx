import { redirect } from 'next/navigation';

/**
 * Deprecated compatibility route.
 * New withdrawal requests are created through the bonus withdrawal flow.
 */
export default function LegacyNewPartnerWithdrawalPage() {
  redirect('/bonuses/withdraw');
}
