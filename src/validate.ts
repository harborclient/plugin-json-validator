import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import type { ValidationResult } from './types';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Formats an Ajv instance path for display.
 *
 * @param instancePath - Ajv instancePath value.
 */
function formatPath(instancePath: string): string {
  if (!instancePath) {
    return '/';
  }
  return instancePath;
}

/**
 * Maps Ajv errors to path-level validation messages.
 *
 * @param errors - Ajv error objects from a failed validation.
 */
function mapErrors(errors: ErrorObject[] | null | undefined): ValidationResult {
  const mapped =
    errors?.map((error) => ({
      path: formatPath(error.instancePath),
      message: error.message ?? 'Validation failed'
    })) ?? [];

  if (mapped.length === 0) {
    return { status: 'fail', errors: [{ path: '/', message: 'Validation failed' }] };
  }

  return { status: 'fail', errors: mapped };
}

/**
 * Validates a JSON response body against a JSON Schema document.
 *
 * @param schemaText - Raw JSON Schema text.
 * @param bodyText - Raw response body text expected to be JSON.
 */
export function validateJson(schemaText: string, bodyText: string): ValidationResult {
  let schema: unknown;
  try {
    schema = JSON.parse(schemaText) as unknown;
  } catch {
    return { status: 'invalid-schema', message: 'Schema is not valid JSON' };
  }

  let data: unknown;
  try {
    data = JSON.parse(bodyText) as unknown;
  } catch {
    return { status: 'invalid-body', message: 'Response body is not valid JSON' };
  }

  try {
    const validate = ajv.compile(schema as Record<string, unknown>);
    const valid = validate(data);
    if (valid) {
      return { status: 'pass' };
    }
    return mapErrors(validate.errors);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON Schema';
    return { status: 'invalid-schema', message };
  }
}
