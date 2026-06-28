import { describe, expect, it } from 'vitest';
import { requestKey } from './requestKey';

describe('requestKey', () => {
  it('normalizes method and trims url', () => {
    expect(
      requestKey({
        method: 'post',
        url: '  https://example.com/api  '
      })
    ).toBe('POST https://example.com/api');
  });
});
