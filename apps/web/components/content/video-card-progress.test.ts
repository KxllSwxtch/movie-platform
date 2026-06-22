import { describe, expect, it } from 'vitest';

import {
  formatRemainingTime,
  isValidNumber,
  safeProgressPercent,
} from './video-card-progress';

describe('continue-watching progress helpers', () => {
  it('recognizes only finite numbers', () => {
    expect(isValidNumber(0)).toBe(true);
    expect(isValidNumber(Number.NaN)).toBe(false);
    expect(isValidNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidNumber(null)).toBe(false);
  });

  it('always returns a finite, clamped percentage', () => {
    expect(safeProgressPercent(30, 100)).toBe(30);
    expect(safeProgressPercent(undefined, 100)).toBe(0);
    expect(safeProgressPercent(30, 0)).toBe(0);
    expect(safeProgressPercent(Number.NaN, Number.NaN)).toBe(0);
    expect(safeProgressPercent(150, 100)).toBe(100);
  });

  it('hides remaining time when duration is invalid', () => {
    expect(formatRemainingTime(10, undefined)).toBeNull();
    expect(formatRemainingTime(10, 0)).toBeNull();
    expect(formatRemainingTime(10, Number.NaN)).toBeNull();
    expect(formatRemainingTime(90, 90)).toBeNull();
  });

  it('formats valid remaining time without NaN', () => {
    expect(formatRemainingTime(undefined, 600)).toBe('осталось 10 мин');
    expect(formatRemainingTime(60, 3_720)).toBe('осталось 1 ч 1 мин');
  });
});
