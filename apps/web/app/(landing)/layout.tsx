// Force dynamic rendering to skip static prerendering
export const dynamic = 'force-dynamic';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
