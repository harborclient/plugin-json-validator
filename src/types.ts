/**
 * A named JSON Schema stored in the plugin library.
 */
export interface SchemaEntry {
  /**
   * Stable identifier for the schema record.
   */
  id: string;

  /**
   * Display name shown in lists and dropdowns.
   */
  name: string;

  /**
   * Raw JSON Schema document as editable text.
   */
  schema: string;
}

/**
 * Maps a request key (method + URL) to a selected schema id.
 */
export type Selections = Record<string, string>;

/**
 * Path-level validation error from Ajv.
 */
export interface ValidationError {
  /**
   * JSON Pointer-style path to the failing value.
   */
  path: string;

  /**
   * Human-readable error message.
   */
  message: string;
}

/**
 * Result of validating a response body against a schema.
 */
export type ValidationResult =
  | { status: 'pass' }
  | { status: 'fail'; errors: ValidationError[] }
  | { status: 'invalid-schema'; message: string }
  | { status: 'invalid-body'; message: string };
