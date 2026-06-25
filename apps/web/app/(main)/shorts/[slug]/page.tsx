import { ShortsFeed } from '../shorts-feed';

interface ShortRoutePageProps {
  params: {
    slug: string;
  };
}

export default function ShortRoutePage({ params }: ShortRoutePageProps) {
  return <ShortsFeed initialShortSlug={params.slug} />;
}
