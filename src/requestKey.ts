/**
 * Builds a stable key for per-request schema selection from draft fields.
 *
 * The SDK does not expose a saved request id in tab contexts, so method + URL
 * is used as a best-effort identifier.
 *
 * @param draft - Request draft with method and url.
 */
export function requestKey(draft: { method: string; url: string }): string {
  return `${draft.method.trim().toUpperCase()} ${draft.url.trim()}`;
}
