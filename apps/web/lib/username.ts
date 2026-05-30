export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;

export const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'auth',
  'login',
  'register',
  'signup',
  'dashboard',
  'profile',
  'settings',
  'author',
  'authors',
  'channel',
  'channels',
  'partner',
  'partners',
  'moderator',
  'moderation',
  'videos',
  'video',
  'shorts',
  'series',
  'store',
  'payments',
  'subscriptions',
  'verification',
  'verify',
  'support',
  'help',
  'terms',
  'privacy',
  'root',
  'system',
]);

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validatePublicUsername(value: string) {
  const normalized = normalizeUsername(value);

  if (!normalized) return 'Username is required';
  if (normalized.length < 3 || normalized.length > 30) {
    return 'Username must be 3 to 30 characters long';
  }
  if (normalized !== value.trim()) return 'Username must be lowercase';
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Use lowercase letters, numbers, underscores, or hyphens. Start and end with a letter or number.';
  }
  if (RESERVED_USERNAMES.has(normalized)) return 'Username is reserved';

  return null;
}

export function getPublicUsernameUrl(role: string | undefined, username: string, origin: string) {
  const normalized = normalizeUsername(username);
  if (!normalized) return '';

  const path = role === 'PARTNER' ? `/partner/${normalized}` : `/author/${normalized}`;
  return `${origin.replace(/\/$/, '')}${path}`;
}
