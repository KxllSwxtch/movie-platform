import { customAlphabet } from 'nanoid';

/**
 * URL-safe alphabet without ambiguous characters (0, O, I, l).
 * Uses uppercase letters and numbers for readability.
 */
const REFERRAL_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Default length for referral codes.
 */
const REFERRAL_CODE_LENGTH = 8;

/**
 * Create a nanoid generator with the referral alphabet.
 */
const nanoid = customAlphabet(REFERRAL_ALPHABET, REFERRAL_CODE_LENGTH);

/**
 * Generate a unique, URL-safe referral code.
 *
 * The code is:
 * - 8 characters long
 * - Contains only uppercase letters and numbers
 * - Excludes ambiguous characters (0, O, I, l)
 * - Easy to read and share
 *
 * @returns A unique referral code
 */
export function generateReferralCode(): string {
  return nanoid();
}

/**
 * Validate a referral code format.
 *
 * @param code - Referral code to validate
 * @returns True if the code format is valid
 */
export function isValidReferralCodeFormat(code: string): boolean {
  if (!code || code.length < 6 || code.length > 12) {
    return false;
  }

  // Accept legacy codes that may contain ambiguous characters such as O/I/0.
  return /^[A-Z0-9]+$/.test(code);
}

/**
 * Normalize a referral code for comparison.
 *
 * @param code - Referral code to normalize
 * @returns Normalized code (uppercase, trimmed)
 */
export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Extract a referral code from either a plain code or an invite URL.
 *
 * Accepted examples:
 * - ABC12345
 * - /register?ref=ABC12345
 * - https://example.com/register?ref=ABC12345
 */
export function extractReferralCode(value?: string): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const input = value.trim();
  if (!input) {
    return undefined;
  }

  try {
    const url = new URL(input, 'https://movieplatform.local');
    const code =
      url.searchParams.get('ref') ||
      url.searchParams.get('referralCode') ||
      url.searchParams.get('referral');

    if (code) {
      return normalizeReferralCode(code);
    }
  } catch {
    // Fall through and treat the value as a plain referral code.
  }

  return normalizeReferralCode(input);
}
