import { useMemo } from '@harborclient/sdk/react';
import type { ResponseTabContext } from '@harborclient/sdk';
import { Badge, StatusMessage } from '@harborclient/sdk/components';
import { getSchemaById, useSelection } from './store';
import { validateJson } from './validate';

interface Props {
  /**
   * Read-only response tab context from HarborClient.
   */
  context: ResponseTabContext;
}

/**
 * Response viewer tab that validates the body against the selected JSON Schema.
 */
export function ValidationTab({ context }: Props) {
  const key = context.requestKey;
  const selectedId = useSelection(key);
  const schema = selectedId ? getSchemaById(selectedId) : undefined;

  /**
   * Validation outcome derived from the selected schema and latest response body.
   */
  const result = useMemo(() => {
    if (!schema || !context.response?.body) {
      return null;
    }
    return validateJson(schema.schema, context.response.body);
  }, [schema, context.response?.body]);

  if (!selectedId || !schema) {
    return (
      <StatusMessage>
        No JSON Schema selected for this request. Choose one on the JSON Schema tab in the request
        editor.
      </StatusMessage>
    );
  }

  if (!context.response) {
    return <StatusMessage>Send the request to validate the response body.</StatusMessage>;
  }

  if (!context.response.body.trim()) {
    return <StatusMessage>The response body is empty.</StatusMessage>;
  }

  if (!result) {
    return <StatusMessage>Preparing validation…</StatusMessage>;
  }

  if (result.status === 'invalid-body') {
    return (
      <div className="flex flex-col gap-3">
        <Badge variant="muted">Not JSON</Badge>
        <StatusMessage live>{result.message}</StatusMessage>
        <StatusMessage>
          JSON Validation only runs when the response body parses as JSON.
        </StatusMessage>
      </div>
    );
  }

  if (result.status === 'invalid-schema') {
    return (
      <div className="flex flex-col gap-3">
        <Badge variant="danger">Invalid schema</Badge>
        <StatusMessage live>{result.message}</StatusMessage>
      </div>
    );
  }

  if (result.status === 'pass') {
    return (
      <div className="flex flex-col gap-3">
        <Badge variant="success">Valid</Badge>
        <StatusMessage live>Response matches schema &ldquo;{schema.name}&rdquo;.</StatusMessage>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Badge variant="danger">Invalid</Badge>
      <StatusMessage live>
        {result.errors.length} validation error{result.errors.length === 1 ? '' : 's'} against
        &ldquo;{schema.name}&rdquo;.
      </StatusMessage>
      <ul className="m-0 list-none space-y-2 p-0">
        {result.errors.map((error, index) => (
          <li
            key={`${error.path}-${index}`}
            className="rounded-md border border-[var(--mac-separator)] bg-[var(--mac-control)] px-3 py-2 text-[14px]"
          >
            <div className="font-medium text-[var(--mac-text)]">
              {error.path === '/' ? 'root' : error.path}
            </div>
            <div className="text-[var(--mac-muted)]">{error.message}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
