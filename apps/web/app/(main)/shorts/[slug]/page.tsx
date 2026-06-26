import { ShortsFeed } from '../shorts-feed';

interface ShortRoutePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ShortRoutePage({ params }: ShortRoutePageProps) {
  const { slug } = await params;

  return (
    <div className="sesh-shorts-page">
      <ShortsFeed initialShortSlug={slug} />
    </div>
  );
}
