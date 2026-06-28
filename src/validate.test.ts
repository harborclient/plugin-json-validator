import { describe, expect, it } from 'vitest';
import { validateJson } from './validate';

const userSchema = JSON.stringify({
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' }
  }
});

describe('validateJson', () => {
  it('passes when the body matches the schema', () => {
    const result = validateJson(
      userSchema,
      JSON.stringify({ id: 1, name: 'Ada', email: 'a@b.co' })
    );
    expect(result).toEqual({ status: 'pass' });
  });

  it('returns path-level errors for schema violations', () => {
    const result = validateJson(userSchema, JSON.stringify({ id: 'bad', name: 'Ada' }));
    expect(result.status).toBe('fail');
    if (result.status === 'fail') {
      expect(result.errors.some((error) => error.path.includes('id'))).toBe(true);
      expect(result.errors.every((error) => error.message.length > 0)).toBe(true);
    }
  });

  it('reports invalid schema JSON', () => {
    const result = validateJson('{not json', '{}');
    expect(result).toEqual({ status: 'invalid-schema', message: 'Schema is not valid JSON' });
  });

  it('reports invalid response body JSON', () => {
    const result = validateJson(userSchema, 'not json');
    expect(result).toEqual({ status: 'invalid-body', message: 'Response body is not valid JSON' });
  });

  it('reports invalid schema documents', () => {
    const result = validateJson('{"type":"object","properties":{"x":{"type":"unknown"}}}', '{}');
    expect(result.status).toBe('invalid-schema');
  });
});
