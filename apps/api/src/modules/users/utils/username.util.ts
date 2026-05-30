export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

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

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;

export interface UsernameValidationResult {
  valid: boolean;
  normalized: string;
  reason?: string;
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value?: string | null): UsernameValidationResult {
  const normalized = normalizeUsername(value ?? '');

  if (!normalized) {
    return {
      valid: false,
      normalized,
      reason: 'Username is required',
    };
  }

  if (
    normalized.length < USERNAME_MIN_LENGTH ||
    normalized.length > USERNAME_MAX_LENGTH
  ) {
    return {
      valid: false,
      normalized,
      reason: 'Username must be 3 to 30 characters long',
    };
  }

  if (normalized !== (value ?? '').trim()) {
    return {
      valid: false,
      normalized,
      reason: 'Username must be lowercase',
    };
  }

  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      valid: false,
      normalized,
      reason:
        'Username may contain lowercase letters, numbers, underscores, and hyphens, and must start and end with a letter or number',
    };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return {
      valid: false,
      normalized,
      reason: 'Username is reserved',
    };
  }

  return {
    valid: true,
    normalized,
  };
}

export function normalizeUsernameCandidate(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/[-_]+/g, '_')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, USERNAME_MAX_LENGTH);
}
