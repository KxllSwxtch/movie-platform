import { redirect } from 'next/navigation';

/**
 * Admin index page - redirects to dashboard
 */
export default function AdminIndexPage() {
  redirect('/admin/dashboard');
}
