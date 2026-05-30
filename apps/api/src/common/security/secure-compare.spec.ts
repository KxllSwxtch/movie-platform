import { timingSafeHexEqual, timingSafeStringEqual } from './secure-compare';

describe('secure compare helpers', () => {
  it('compares strings without accepting missing or different-length values', () => {
    expect(timingSafeStringEqual('secret', 'secret')).toBe(true);
    expect(timingSafeStringEqual('secret', 'wrong')).toBe(false);
    expect(timingSafeStringEqual('', 'secret')).toBe(false);
  });

  it('compares hex digests safely', () => {
    expect(timingSafeHexEqual('0f', '0f')).toBe(true);
    expect(timingSafeHexEqual('0f', '0e')).toBe(false);
    expect(timingSafeHexEqual('not-hex', '0f')).toBe(false);
  });
});
