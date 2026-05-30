import { timingSafeEqual } from 'crypto';

export function timingSafeStringEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function timingSafeHexEqual(actualHex: string, expectedHex: string): boolean {
  try {
    const actualBuffer = Buffer.from(actualHex, 'hex');
    const expectedBuffer = Buffer.from(expectedHex, 'hex');

    if (
      actualBuffer.length === 0 ||
      actualBuffer.length !== expectedBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
