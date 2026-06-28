import { useId } from '@harborclient/sdk/react';
import type { RequestTabContext } from '@harborclient/sdk';
import { FormGroup, Select, StatusMessage } from '@harborclient/sdk/components';
import { requestKey } from './requestKey';
import { setSelection, useSchemas, useSelection } from './store';

interface Props {
  /**
   * Read-only request tab context from HarborClient.
   */
  context: RequestTabContext;
}

/**
 * Request editor tab for choosing which JSON Schema validates this request's responses.
 */
export function SchemaSelectTab({ context }: Props) {
  const selectId = useId();
  const key = requestKey(context.draft);
  const schemas = useSchemas();
  const selectedId = useSelection(key);

  if (schemas.length === 0) {
    return (
      <StatusMessage>
        No JSON Schemas yet. Add one in the sidebar under JSON Schemas, then return here to assign
        it to this request.
      </StatusMessage>
    );
  }

  return (
    <div className="flex flex-col gap-3" style={{ minHeight: '320px' }}>
      <FormGroup label="Schema for this request" htmlFor={selectId}>
        <Select
          id={selectId}
          value={selectedId}
          onChange={(event) => {
            void setSelection(key, event.target.value);
          }}
        >
          <option value="">None</option>
          {schemas.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </Select>
      </FormGroup>
      <StatusMessage>
        Selection is remembered for requests with the same method and URL. Changing the URL clears
        the association for the new address.
      </StatusMessage>
    </div>
  );
}
