export interface CreatorIdentityInput {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  authorUrl?: string | null;
  role?: string | null;
  totalVideos?: number | null;
  totalPublishedVideos?: number | null;
  totalViews?: number | null;
  subscriberCount?: number | null;
}

export type CreatorInput = string | CreatorIdentityInput | null | undefined;

export interface CreatorIdentity {
  id?: string;
  displayName: string;
  username?: string;
  avatarUrl?: string | null;
  href?: string;
  role?: string;
  totalVideos?: number;
  totalViews?: number;
  subscriberCount?: number;
}

function cleanString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function cleanNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function getAuthorHref(creator: CreatorIdentityInput): string | undefined {
  const authorUrl = cleanString(creator.authorUrl);
  if (authorUrl) return authorUrl;

  const username = cleanString(creator.username);
  if (username) return `/author/${username}`;

  const id = cleanString(creator.id);
  return id ? `/authors/${id}` : undefined;
}

export function normalizeCreatorIdentity(
  creator: CreatorInput,
): CreatorIdentity | null {
  if (!creator) return null;

  if (typeof creator === 'string') {
    const displayName = creator.trim();
    if (!displayName) return null;
    return { displayName };
  }

  const firstName = cleanString(creator.firstName);
  const lastName = cleanString(creator.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const username = cleanString(creator.username);
  const id = cleanString(creator.id);
  const displayName =
    cleanString(creator.displayName) || fullName || username || id;

  if (!displayName) return null;

  return {
    id,
    displayName,
    username,
    avatarUrl: cleanString(creator.avatarUrl) ?? null,
    href: getAuthorHref(creator),
    role: cleanString(creator.role),
    totalVideos: cleanNumber(
      creator.totalVideos ?? creator.totalPublishedVideos,
    ),
    totalViews: cleanNumber(creator.totalViews),
    subscriberCount: cleanNumber(creator.subscriberCount),
  };
}
