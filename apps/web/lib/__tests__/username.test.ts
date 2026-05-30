import { describe, expect, it } from 'vitest';

import {
  getPublicUsernameUrl,
  normalizeUsername,
  validatePublicUsername,
} from '../username';

describe('username helpers', () => {
  it('validates public usernames with backend-compatible rules', () => {
    expect(validatePublicUsername('testauthor')).toBeNull();
    expect(validatePublicUsername('test_author-1')).toBeNull();
    expect(validatePublicUsername('TestAuthor')).toBe('Username must be lowercase');
    expect(validatePublicUsername('админ')).toContain('Use lowercase');
    expect(validatePublicUsername('admin')).toBe('Username is reserved');
    expect(validatePublicUsername('-test')).toContain('Start and end');
    expect(validatePublicUsername('te')).toBe('Username must be 3 to 30 characters long');
  });

  it('normalizes and builds role-specific public URLs', () => {
    expect(normalizeUsername(' TestAuthor ')).toBe('testauthor');
    expect(getPublicUsernameUrl('AUTHOR', 'testauthor', 'http://localhost:3000')).toBe(
      'http://localhost:3000/author/testauthor',
    );
    expect(getPublicUsernameUrl('PARTNER', 'testpartner', 'http://localhost:3000/')).toBe(
      'http://localhost:3000/partner/testpartner',
    );
  });
});
